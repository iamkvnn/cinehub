import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async sendOtpEmail(to: string, otp: string) {
    const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; background-color: #f4f4f4; padding: 30px;">
      <div style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        
        <div style="background-color: #E50914; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">CineHub 🎬</h1>
        </div>

        <div style="padding: 30px; color: #333;">
          <h2 style="text-align: center;">Mã xác thực</h2>
          <p>Xin chào,</p>
          <p>Bạn vừa yêu cầu mã xác thực OTP để tiếp tục thao tác trên <strong>CineHub</strong>.</p>

          <div style="margin: 30px 0; text-align: center;">
            <div style="
              display: inline-block;
              padding: 15px 30px;
              font-size: 26px;
              letter-spacing: 6px;
              font-weight: bold;
              background-color: #f4f4f4;
              border-radius: 6px;
              color: #000;
            ">
              ${otp}
            </div>
          </div>

          <p style="text-align: center;">
            Mã OTP này sẽ <strong>hết hạn sau 90 giây</strong>.
          </p>

          <p style="font-size: 14px; color: #666;">
            ⚠️ Vui lòng không chia sẻ mã này cho bất kỳ ai.  
            Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="font-size: 12px; color: #999; text-align: center;">
            © ${new Date().getFullYear()} CineHub. All rights reserved.
          </p>
        </div>
      </div>
    </div>
    `;

    const mailOptions = {
      from: `"CineHub" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Mã xác thực OTP CineHub',
      html,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendGoogleWelcomeEmail(to: string, pass: string, name: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #E50914; text-align: center;">Chào mừng đến với CineHub! 🎬</h2>
        <p>Xin chào <strong>${name}</strong>,</p>
        <p>Tài khoản của bạn đã được tạo thành công thông qua đăng nhập Google.</p>
        <p>Để đảm bảo tính bảo mật và thuận tiện cho việc đăng nhập sau này (nếu bạn muốn dùng password), chúng tôi đã tạo một mật khẩu ngẫu nhiên cho bạn:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
          <span style="font-size: 20px; font-weight: bold; letter-spacing: 2px; color: #333;">${pass}</span>
        </div>
        <p>Vui lòng đăng nhập và đổi lại mật khẩu này sớm nhất có thể.</p>
        <p>Chúc bạn có những giây phút xem phim tuyệt vời!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">Đội ngũ CineHub</p>
      </div>
    `;

    const mailOptions = {
      from: `"CineHub" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Welcome to CineHub - Thông tin tài khoản của bạn',
      html,
    };
    await this.transporter.sendMail(mailOptions);
  }

  async sendVerificationSuccessEmail(to: string, name: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #28a745; text-align: center;">Xác thực thành công! 🎉</h2>
        <p>Xin chào <strong>${name}</strong>,</p>
        <p>Chúc mừng! Tài khoản CineHub của bạn đã được xác thực thành công.</p>
        <p>Giờ đây bạn có thể truy cập đầy đủ các tính năng của CineHub và thưởng thức kho phim khổng lồ của chúng tôi.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/login" style="background-color: #E50914; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">Đăng nhập ngay</a>
        </div>
        <p>Cảm ơn bạn đã lựa chọn CineHub!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #888; text-align: center;">Đội ngũ CineHub</p>
      </div>
    `;

    const mailOptions = {
      from: `"CineHub" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Chào mừng gia nhập cộng đồng CineHub',
      html,
    };
    await this.transporter.sendMail(mailOptions);
  }
}
