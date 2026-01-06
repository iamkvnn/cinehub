import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

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
 * Migration script để tạo FREE subscription cho users cũ
 * - Tìm tất cả users verified mà không có subscription active
 * - Tạo FREE subscription cho họ
 */
async function migrate() {
  try {
    await dataSource.initialize();
    console.log('✅ Database connected');

    // Tìm gói FREE
    const [freePlan] = await dataSource.query(
      `SELECT id, durationDays FROM plans WHERE planType = 'FREE' AND isActive = 1 LIMIT 1`,
    );

    if (!freePlan) {
      console.error('❌ FREE plan not found. Please run plan seed first.');
      await dataSource.destroy();
      return;
    }

    console.log(
      `📦 Found FREE plan with id: ${freePlan.id}, duration: ${freePlan.durationDays} days`,
    );

    // Tìm users verified không có subscription active
    const usersWithoutSubscription = await dataSource.query(`
      SELECT u.id, u.email, u.name
      FROM users u
      WHERE u.isVerified = 1
        AND u.role = 'user'
        AND NOT EXISTS (
          SELECT 1 FROM subscriptions s 
          WHERE s.userId = u.id 
            AND s.status = 'ACTIVE'
            AND s.deletedAt IS NULL
        )
    `);

    console.log(
      `👥 Found ${usersWithoutSubscription.length} users without active subscription`,
    );

    if (usersWithoutSubscription.length === 0) {
      console.log('✅ No users need migration');
      await dataSource.destroy();
      return;
    }

    // Tạo FREE subscription cho mỗi user
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + freePlan.durationDays);

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutSubscription) {
      try {
        const subscriptionId = generateUUID();
        await dataSource.query(
          `INSERT INTO subscriptions (id, userId, planId, startDate, endDate, status, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, 'ACTIVE', NOW(), NOW())`,
          [subscriptionId, user.id, freePlan.id, now, endDate],
        );
        console.log(`  ✅ Created FREE subscription for ${user.email}`);
        successCount++;
      } catch (error: any) {
        console.error(`  ❌ Failed for ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${errorCount}`);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

migrate();
