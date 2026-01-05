import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entity/user.entity';
import { Repository } from 'typeorm';
import { PaginatedApiQuery } from 'src/common/dto/paginated-query.dto';
import { CreateUserDto } from '../dto/user.dto';
import { generateOtp, hashPasswordSync } from 'src/common/utils';
import { GoogleProfileDto } from 'src/module/auth/dto/google.dto';
import { StripeService } from 'src/module/stripe/stripe.service';
import { UserRole } from '../const/user.const';
import { ImageService } from 'src/module/media/service/image.service';
import { SubscriptionService } from 'src/module/subscription/service/subscription.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly stripeService: StripeService,
    private readonly imageService: ImageService,
    @Inject(forwardRef(() => SubscriptionService))
    private readonly subscriptionService: SubscriptionService,
  ) {}

  async findAllUser(query: PaginatedApiQuery): Promise<[UserEntity[], number]> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .andWhere('user.role = :role', { role: UserRole.USER });

    if (query.sort) {
      Object.entries(query.sort).forEach(([key, value]) => {
        if (value !== 'ASC' && value !== 'DESC') {
          throw new BadRequestException(
            `thứ tự sắp xếp không hợp lệ cho ${key}: ${value}`,
          );
        }
        qb.addOrderBy(`user.${key}`, value);
      });
    }

    if (query.search) {
      qb.andWhere('(user.name LIKE :search OR user.email LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [users, count] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return [users, count];
  }

  async findAllAdmin(
    query: PaginatedApiQuery,
  ): Promise<[UserEntity[], number]> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .andWhere('user.role = :role', { role: UserRole.ADMIN });

    if (query.sort) {
      Object.entries(query.sort).forEach(([key, value]) => {
        if (value !== 'ASC' && value !== 'DESC') {
          throw new BadRequestException(
            `thứ tự sắp xếp không hợp lệ cho ${key}: ${value}`,
          );
        }
        qb.addOrderBy(`user.${key}`, value);
      });
    }

    if (query.search) {
      qb.andWhere('(user.name LIKE :search OR user.email LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const [users, count] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return [users, count];
  }

  async createUser(createDto: CreateUserDto): Promise<UserEntity> {
    if (
      await this.userRepository.existsBy({
        email: createDto.email,
        role: UserRole.USER,
      })
    ) {
      throw new BadRequestException('Email đã được sử dụng');
    }
    const stripeCustomer = await this.stripeService.createCustomer({
      email: createDto.email,
      name: `${createDto.name}`,
    });
    const user = this.userRepository.create({
      ...createDto,
      password: hashPasswordSync(createDto.password),
      isVerified: false,
      otp: generateOtp(),
      otpExpiresAt: new Date(Date.now() + 90 * 1000),
      stripeCustomerId: stripeCustomer.id,
      role: UserRole.USER,
    });
    const savedUser = await this.userRepository.save(user);

    // Tự động tạo FREE subscription cho user mới
    try {
      await this.subscriptionService.createFreeSubscription(savedUser.id);
    } catch (error) {
      this.logger.warn(
        `Failed to create FREE subscription for user ${savedUser.id}:`,
        error,
      );
    }

    return savedUser;
  }

  async createAdmin(createDto: CreateUserDto): Promise<UserEntity> {
    if (
      await this.userRepository.existsBy({
        email: createDto.email,
        role: UserRole.ADMIN,
      })
    ) {
      throw new BadRequestException('Email đã được sử dụng');
    }
    return this.userRepository.save({
      ...createDto,
      password: hashPasswordSync(createDto.password),
      isVerified: true,
      role: UserRole.ADMIN,
    });
  }

  async updateUser(
    id: string,
    updateDto: Partial<UserEntity>,
    avatar?: Express.Multer.File,
  ): Promise<UserEntity> {
    const user = await this.findById(id);
    Object.assign(user, updateDto);
    if (avatar) {
      if (user.avatarKey) {
        this.imageService.deleteImage(user.avatarKey);
      }
      const { url, key } = await this.imageService.uploadImage(avatar);
      user.avatarUrl = url;
      user.avatarKey = key;
    }
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return user;
  }

  async findOrCreateByGoogleProfile(
    profile: GoogleProfileDto,
  ): Promise<UserEntity> {
    let user = await this.userRepository.findOne({
      where: { email: profile.email, role: UserRole.USER },
    });

    if (!user) {
      // Tạo Stripe customer cho user mới
      const stripeCustomer = await this.stripeService.createCustomer({
        email: profile.email,
        name: profile.name,
      });

      user = this.userRepository.create({
        email: profile.email,
        name: profile.name,
        password: '',
        isVerified: true,
        role: UserRole.USER,
        stripeCustomerId: stripeCustomer.id,
      });
      await this.userRepository.save(user);

      // Tự động tạo FREE subscription cho user mới đăng ký qua Google
      try {
        await this.subscriptionService.createFreeSubscription(user.id);
      } catch (error) {
        this.logger.warn(
          `Failed to create FREE subscription for Google user ${user.id}:`,
          error,
        );
      }
    }

    return user;
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }
    return user;
  }

  async deleteAdmin(id: string): Promise<void> {
    const user = await this.findById(id);
    if (user.role === UserRole.USER) {
      throw new BadRequestException(
        'Không thể xóa người dùng thường bằng phương thức này',
      );
    }
    await this.userRepository.remove(user);
  }
}
