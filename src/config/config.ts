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
    callbackURL:
      process.env.GOOGLE_CALLBACK_URL ||
      'http://localhost:3000/api/v1/auth/google/callback',
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
    outputDir: process.env.TRANSFORMS_OUTPUT_DIR || '/tmp/videos',
  },
});
