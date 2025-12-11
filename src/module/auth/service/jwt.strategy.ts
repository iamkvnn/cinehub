import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../dto/jwt-payload';
import { UserDto } from 'src/module/user/dto/user.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('jwt.access.secret') as string,
    });
  }
  validate(payload: JwtPayload) {
    if (!payload?.sub || !payload?.email) {
      return null;
    }
    return {
      id: payload.sub,
      email: payload.email,
    } as UserDto;
  }
}
