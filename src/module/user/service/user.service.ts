import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../entity/user.entity';
import { Repository } from 'typeorm';
import { PaginatedApiQuery } from 'src/common/dto/paginated-query.dto';
import { CreateUserDto } from '../dto/user.dto';
import { hashPasswordSync } from 'src/common/utils';
import { GoogleProfileDto } from 'src/module/auth/dto/google.profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async findAll(query: PaginatedApiQuery): Promise<[UserEntity[], number]> {
    const qb = this.userRepository.createQueryBuilder('user');

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

    const [users, count] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return [users, count];
  }

  async createUser(createDto: CreateUserDto): Promise<UserEntity> {
    if (await this.userRepository.existsBy({ email: createDto.email })) {
      throw new BadRequestException('Email đã được sử dụng');
    }
    const user = this.userRepository.create({
      ...createDto,
      password: hashPasswordSync(createDto.password),
      isVerified: false,
    });
    return this.userRepository.save(user);
  }

  async updateUser(
    id: string,
    updateDto: Partial<UserEntity>,
  ): Promise<UserEntity> {
    const user = await this.findById(id);
    Object.assign(user, updateDto);
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
      where: { email: profile.email },
    });

    if (!user) {
      user = this.userRepository.create({
        email: profile.email,
        name: profile.displayName || `${profile.firstName} ${profile.lastName}`,
        password: '',
        isVerified: true,
      });
      await this.userRepository.save(user);
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

  async deleteUser(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.userRepository.softDelete(user.id);
  }
}
