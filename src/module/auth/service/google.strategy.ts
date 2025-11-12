import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { GoogleProfileDto } from '../dto/google.profile.dto';
import { LoginResponseDto } from '../dto/login.response.dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('google.clientId')!,
      clientSecret: configService.get<string>('google.clientSecret')!,
      callbackURL: configService.get<string>('google.callbackURL')!,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const extractedProfile: GoogleProfileDto = {
      id: profile.id,
      email: profile.emails[0].value,
      displayName: profile.displayName,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
    };
    console.log(extractedProfile);
    const tokens: LoginResponseDto =
      await this.authService.validateGoogleUser(extractedProfile);
    return tokens;
  }
}
