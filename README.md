# CineHub Backend

Dự án backend cho hệ thống xem phim CineHub, được xây dựng bằng **NestJS** và **TypeORM**.

## 🚀 Tính năng chính

- **Authentication**: Đăng ký, Đăng nhập, JWT Access/Refresh Token.
- **Google OAuth2**: Đăng nhập bằng tài khoản Google.
- **Database**: MySQL.
- **Video Streaming**: Tích hợp AWS S3 và CloudFront.
- **Thanh toán**: Tích hợp Stripe.
- **Email**: Gửi mail xác thực (OTP).

## 🛠 Yêu cầu hệ thống

- Node.js (>= 18)
- Pnpm

## 📦 Cài đặt

1. **Clone dự án:**
   ```bash
   git clone <repo_url>
   cd cinehub
   ```

2. **Cài đặt dependencies:**
   ```bash
   pnpm install
   ```

3. **Cấu hình môi trường:**
   Copy file `.env.example` thành `.env` và cập nhật các giá trị cấu hình.
   ```bash
   cp .env.example .env
   ```

   **File `.env` mẫu chi tiết:**
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=root
   DB_PASSWORD=root
   DB_DATABASE=cinehub
   
   # JWT Configuration
   JWT_ACCESS_SECRET=your_jwt_access_secret
   JWT_ACCESS_EXPIRED=1h
   JWT_REFRESH_SECRET=your_jwt_refresh_secret
   JWT_REFRESH_EXPIRED=7d 
   # Lưu ý: Kiểm tra key JWT_REFRESH_EXPRIED trong code nếu cần

   # Google OAuth2
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URL=http://localhost:5173/auth/callback
   
   # Optional overrides:
   # GOOGLE_TOKEN_URL=https://oauth2.googleapis.com/token
   # GOOGLE_USER_INFO_URL=https://www.googleapis.com/oauth2/v3/userinfo

   # AWS Configuration (S3 & CloudFront)
   S3_ACCESS_KEY=your_aws_access_key
   S3_SECRET_KEY=your_aws_secret_key
   S3_BUCKET_NAME=your_s3_bucket_name
   S3_REGION=your_aws_region
   
   CLOUDFRONT_DISTRIBUTION_ID=your_distribution_id
   CLOUDFRONT_DOMAIN=your_cloudfront_domain
   CLOUDFRONT_KEY_PAIR_ID=your_key_pair_id
   CLOUDFRONT_PRIVATE_KEY_PATH=videos/private_key.pem

   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...

   # Mail Service (NodeMailer / SMTP)
   MAIL_USER=your_email@gmail.com
   MAIL_PASS=your_email_password

   # Frontend
   FRONTEND_URL=http://localhost:5173
   ```

## 🏃‍♂️ Chạy dự án (Local Dev)

**Chạy ứng dụng (Development mode):**
   ```bash
   pnpm dev
   # hoặc
   pnpm start
   ```
   
   - Server API: `http://localhost:8080/api/v1`
   - Swagger Docs: `http://localhost:8080/api/v1/api-docs`

## 🌱 Seeding & Migration

Sau khi DB đã chạy, chạy các lệnh sau để nạp dữ liệu mẫu:

```bash
# Migration thông báo
pnpm migrate:notification

# Seed gói dịch vụ (Plans)
pnpm seed:plan
```

## 📂 Cấu trúc thư mục

```
src/
├── common/             # Interceptors, Filters, Guards, Pipes, Utils
├── config/             # Environment configuration mapping
├── core/               # Modules cốt lõi: Database, Mail, Health
├── module/             # Các feature modules
│   ├── auth/           # Auth Controller & Service (Google, Login, Register)
│   ├── film/           # Film Management
│   ├── payment/        # Stripe Integration
│   └── ...
├── seeds/              # Database seeds
└── main.ts             # Application entry point
```

## 📝 Auth Flow

1. **Register**: `POST /auth/register` -> Gửi OTP qua email.
2. **Verify**: `POST /auth/verify-otp` -> Active user.
3. **Login**: `POST /auth/login` -> Trả về AccessToken & RefreshToken.
4. **Google Login**: 
   - Frontend lấy authorization code từ Google.
   - Gửi code về `POST /auth/google/callback`.
   - Backend verify code và trả về tokens.
5. **Refresh Token**: `POST /auth/refresh-token` -> Lấy AccessToken mới khi hết hạn.
