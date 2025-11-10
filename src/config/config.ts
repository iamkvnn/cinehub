export default () => ({
  db: {
    type: 'mysql',
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_DATABASE || 'cinehub',
    synchronize: true,
  },
  jwt: {
    access: {
      secret: process.env.JWT_ACCESS_SECRET || '',
      expired: process.env.JWT_ACCESS_EXPIRED || '',
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET || '',
      expired: process.env.JWT_REFRESH_EXPRIED || '',
    },
  },
});
