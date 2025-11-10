import { BadRequestException, Injectable } from "@nestjs/common";
import { UserService } from "src/module/user/service/user.service";
import { RegisterDto } from "../dto/register.dto";
import { generateOtp, hashPasswordSync } from "src/common/utils";
import { MailService } from "src/core/mail/mail.service";
import { ResetPasswordDto } from "../dto/reset-password.dto";

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly mailService: MailService,
    ) {}

    async registerUser(registerUser: RegisterDto) {
        const otp = generateOtp();
        this.mailService.sendOtpEmail(registerUser.email, otp);
        const user = await this.userService.createUser(registerUser);
        await this.userService.updateUser(user.id, { otp: otp, otpExpiresAt: new Date(Date.now() + 90 * 1000) });
        return user;
    }

    async verifyOtp(registerUser: RegisterDto) {
        let user = await this.userService.findByEmail(registerUser.email);
        if (user.isVerified) {
            throw new BadRequestException('Tài khoản đã được xác minh');
        }
        if (user.otp !== registerUser.otp) {
            throw new BadRequestException('Mã OTP không đúng');
        }
        if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
            throw new BadRequestException('Mã OTP đã hết hạn');
        }
        await this.userService.updateUser(user.id, { isVerified: true });
    }

    async resendOtp(email: string) {
        const user = await this.userService.findByEmail(email);
        if (user.isVerified) {
            throw new BadRequestException('Tài khoản đã được xác minh');
        }
        const otp = generateOtp();
        this.mailService.sendOtpEmail(user.email, otp);
        await this.userService.updateUser(user.id, { otp: otp, otpExpiresAt: new Date(Date.now() + 90 * 1000) });
    }

    async forgotPassword(email: string) {
        const user = await this.userService.findByEmail(email);
        const otp = generateOtp();
        this.mailService.sendOtpEmail(user.email, otp);
        await this.userService.updateUser(user.id, { otp: otp, otpExpiresAt: new Date(Date.now() + 90 * 1000) });
    }

    async resetPassword(dto: ResetPasswordDto) {
        let user = await this.userService.findByEmail(dto.email);
        if (user.otp !== dto.otp) {
            throw new BadRequestException('Mã OTP không đúng');
        }
        if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
            throw new BadRequestException('Mã OTP đã hết hạn');
        }
        await this.userService.updateUser(user.id, { password: hashPasswordSync(dto.newPassword) });
    }
}