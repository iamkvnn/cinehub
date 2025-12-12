export default () => ({
  db: {
    type: process.env.DB_TYPE || 'mysql',
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
      expired: process.env.JWT_ACCESS_EXPIRED || '3600',
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET || '',
      expired: process.env.JWT_REFRESH_EXPRIED || '86400',
    },
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    tokenUrl:
      process.env.GOOGLE_TOKEN_URL || 'https://oauth2.googleapis.com/token',
    userInfoUrl:
      process.env.GOOGLE_USER_INFO_URL ||
      'https://www.googleapis.com/oauth2/v3/userinfo',
    redirectUrl:
      process.env.GOOGLE_REDIRECT_URL || 'http://localhost:5173/auth/callback',
  },
  aws: {
    accessKey: process.env.S3_ACCESS_KEY || '',
    secretKey: process.env.S3_SECRET_KEY || '',
    s3: {
      bucketName: process.env.S3_BUCKET_NAME || '',
      region: process.env.S3_REGION || '',
    },
    cloudfront: {
      distributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID || '',
      domain: process.env.CLOUDFRONT_DOMAIN || '',
      keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID || '',
      privateKeyPath: process.env.CLOUDFRONT_PRIVATE_KEY_PATH || '',
    },
  },
  videos: {
    outputDir: process.env.TRANSFORMS_OUTPUT_DIR || '/tmp',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
});
