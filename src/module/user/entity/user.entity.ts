import { BaseEntity } from 'src/core/base/base.entity';
import { Entity, Column } from 'typeorm';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  otp?: string;

  @Column({ nullable: true })
  otpExpiresAt?: Date;
}
