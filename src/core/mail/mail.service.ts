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
    const mailOptions = {
      from: `"CineHub" <${process.env.MAIL_USER}>`,
      to,
      subject: 'Mã xác thực OTP của bạn',
      text: `Mã OTP của bạn là: ${otp}. Hết hạn sau 90 giây.`,
    };
    await this.transporter.sendMail(mailOptions);
  }
}
