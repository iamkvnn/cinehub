import { BaseEntity } from 'src/core/base/base.entity';
import { Entity, Column } from 'typeorm';
import { Gender } from '../const/user.const';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column()
  password: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  otp?: string;

  @Column({ nullable: true })
  otpExpiresAt?: Date;

  @Column({ nullable: true })
  refreshToken?: string;
}
