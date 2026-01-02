import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'cinehub',
  synchronize: false,
});

/**
 * Migration script to convert notifications from one-to-one to many-to-many schema
 *
 * Old schema (notifications table):
 * - userId: VARCHAR(36) - target user
 * - status: ENUM('UNREAD', 'READ')
 * - isBroadcast: BOOLEAN
 *
 * New schema:
 * - notifications table:
 *   + senderId: VARCHAR(36) - who sent the notification
 *   + targetType: ENUM('single', 'group', 'broadcast')
 *   - Remove: userId, status, isBroadcast
 *
 * - user_notifications table (junction):
 *   + userId: VARCHAR(36)
 *   + notificationId: VARCHAR(36)
 *   + status: ENUM('UNREAD', 'READ')
 *   + readAt: DATETIME
 */
async function migrateNotifications() {
  try {
    await dataSource.initialize();
    console.log('Database connected successfully');

    // Check if old columns exist
    const [columns] = await dataSource.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'notifications' 
        AND COLUMN_NAME IN ('userId', 'status', 'isBroadcast')
    `);

    const oldColumnsExist = Array.isArray(columns) && columns.length > 0;

    if (!oldColumnsExist) {
      console.log(
        'Old schema columns not found. Migration may have already been completed or this is a fresh install.',
      );
      console.log('Checking if user_notifications table exists...');

      const [tables] = await dataSource.query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'user_notifications'
      `);

      if (Array.isArray(tables) && tables.length > 0) {
        console.log(
          'user_notifications table already exists. Migration completed.',
        );
      } else {
        console.log(
          'user_notifications table does not exist. Please start the app with synchronize: true to create it.',
        );
      }

      await dataSource.destroy();
      return;
    }

    console.log('Old schema detected. Starting migration...');

    // Step 1: Create user_notifications table if not exists
    console.log('Step 1: Creating user_notifications table...');
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        userId VARCHAR(36) NOT NULL,
        notificationId VARCHAR(36) NOT NULL,
        status ENUM('UNREAD', 'READ') DEFAULT 'UNREAD',
        readAt DATETIME NULL,
        createdAt DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
        updatedAt DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE KEY UQ_user_notification (userId, notificationId),
        INDEX IDX_user_status (userId, status),
        CONSTRAINT FK_user_notifications_user FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT FK_user_notifications_notification FOREIGN KEY (notificationId) REFERENCES notifications(id) ON DELETE CASCADE
      )
    `);
    console.log('user_notifications table created.');

    // Step 2: Migrate existing notification data to junction table
    console.log(
      'Step 2: Migrating existing notifications to junction table...',
    );

    // Get all existing notifications with userId (single user notifications)
    const existingNotifications = await dataSource.query(`
      SELECT id, userId, status, isBroadcast 
      FROM notifications 
      WHERE userId IS NOT NULL AND isBroadcast = FALSE
    `);

    console.log(
      `Found ${existingNotifications.length} single-user notifications to migrate.`,
    );

    for (const notification of existingNotifications) {
      await dataSource.query(
        `
        INSERT IGNORE INTO user_notifications (id, userId, notificationId, status, readAt, createdAt, updatedAt)
        VALUES (UUID(), ?, ?, ?, ${notification.status === 'READ' ? 'NOW()' : 'NULL'}, NOW(), NOW())
      `,
        [notification.userId, notification.id, notification.status || 'UNREAD'],
      );
    }

    // Handle broadcast notifications - create records for all users
    const broadcastNotifications = await dataSource.query(`
      SELECT id, status FROM notifications WHERE isBroadcast = TRUE
    `);

    console.log(
      `Found ${broadcastNotifications.length} broadcast notifications.`,
    );

    if (broadcastNotifications.length > 0) {
      const allUsers = await dataSource.query(`SELECT id FROM users`);
      console.log(`Creating junction records for ${allUsers.length} users...`);

      for (const notification of broadcastNotifications) {
        for (const user of allUsers) {
          await dataSource.query(
            `
            INSERT IGNORE INTO user_notifications (id, userId, notificationId, status, createdAt, updatedAt)
            VALUES (UUID(), ?, ?, 'UNREAD', NOW(), NOW())
          `,
            [user.id, notification.id],
          );
        }
      }
    }

    // Step 3: Add new columns to notifications table
    console.log('Step 3: Adding new columns to notifications table...');

    // Check if senderId column exists
    const [senderIdCol] = await dataSource.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'notifications' 
        AND COLUMN_NAME = 'senderId'
    `);

    if (!Array.isArray(senderIdCol) || senderIdCol.length === 0) {
      await dataSource.query(`
        ALTER TABLE notifications 
        ADD COLUMN senderId VARCHAR(36) NULL,
        ADD CONSTRAINT FK_notifications_sender FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE SET NULL
      `);
      console.log('senderId column added.');
    }

    // Check if targetType column exists
    const [targetTypeCol] = await dataSource.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'notifications' 
        AND COLUMN_NAME = 'targetType'
    `);

    if (!Array.isArray(targetTypeCol) || targetTypeCol.length === 0) {
      await dataSource.query(`
        ALTER TABLE notifications 
        ADD COLUMN targetType ENUM('single', 'group', 'broadcast') DEFAULT 'single'
      `);
      console.log('targetType column added.');

      // Update targetType based on old isBroadcast field
      await dataSource.query(`
        UPDATE notifications SET targetType = 'broadcast' WHERE isBroadcast = TRUE
      `);
      await dataSource.query(`
        UPDATE notifications SET targetType = 'single' WHERE isBroadcast = FALSE OR isBroadcast IS NULL
      `);
      console.log('targetType values populated.');
    }

    // Step 4: Remove old columns
    console.log('Step 4: Removing old columns...');

    // Check and drop columns one by one
    const columnsToRemove = ['userId', 'status', 'isBroadcast'];

    for (const columnName of columnsToRemove) {
      const [colExists] = await dataSource.query(
        `
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'notifications' 
          AND COLUMN_NAME = ?
      `,
        [columnName],
      );

      if (Array.isArray(colExists) && colExists.length > 0) {
        // First drop foreign key if exists (for userId)
        if (columnName === 'userId') {
          try {
            await dataSource.query(`
              ALTER TABLE notifications DROP FOREIGN KEY FK_notifications_user
            `);
          } catch {
            // Foreign key might not exist or have different name
          }
        }

        await dataSource.query(`
          ALTER TABLE notifications DROP COLUMN ${columnName}
        `);
        console.log(`Column ${columnName} removed.`);
      }
    }

    console.log('Migration completed successfully!');
    await dataSource.destroy();
  } catch (error) {
    console.error('Migration failed:', error);
    await dataSource.destroy();
    process.exit(1);
  }
}

migrateNotifications();
