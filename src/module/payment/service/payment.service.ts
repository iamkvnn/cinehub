import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { PaymentEntity, PaymentStatus } from '../entity/payment.entity';

export interface CreatePaymentDto {
  userId: string;
  planId: string;
  subscriptionId?: string;
  amount: number;
  currency?: string;
  status?: PaymentStatus;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  stripeSessionId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentQueryDto {
  page: number;
  limit: number;
  status?: PaymentStatus;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly paymentRepository: Repository<PaymentEntity>,
  ) {}

  async create(dto: CreatePaymentDto): Promise<PaymentEntity> {
    const payment = this.paymentRepository.create({
      ...dto,
      currency: dto.currency || 'VND',
      status: dto.status || PaymentStatus.PENDING,
    });
    return this.paymentRepository.save(payment);
  }

  async findById(id: string): Promise<PaymentEntity> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['user', 'plan', 'subscription'],
    });
    if (!payment) {
      throw new NotFoundException('Payment không tồn tại');
    }
    return payment;
  }

  async findByStripeSessionId(
    sessionId: string,
  ): Promise<PaymentEntity | null> {
    return this.paymentRepository.findOne({
      where: { stripeSessionId: sessionId },
      relations: ['user', 'plan'],
    });
  }

  async updateStatus(
    id: string,
    status: PaymentStatus,
  ): Promise<PaymentEntity> {
    const payment = await this.findById(id);
    payment.status = status;
    return this.paymentRepository.save(payment);
  }

  async findAll(query: PaymentQueryDto): Promise<[PaymentEntity[], number]> {
    const qb = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user')
      .leftJoinAndSelect('payment.plan', 'plan');

    if (query.status) {
      qb.andWhere('payment.status = :status', { status: query.status });
    }

    if (query.userId) {
      qb.andWhere('payment.userId = :userId', { userId: query.userId });
    }

    if (query.startDate && query.endDate) {
      qb.andWhere('payment.createdAt BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate,
      });
    }

    qb.orderBy('payment.createdAt', 'DESC');

    return qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();
  }

  async findByUserId(userId: string): Promise<PaymentEntity[]> {
    return this.paymentRepository.find({
      where: { userId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPaymentStats(): Promise<{
    totalPayments: number;
    totalRevenue: number;
    byStatus: { status: PaymentStatus; count: number; amount: number }[];
  }> {
    const stats = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'amount')
      .groupBy('payment.status')
      .getRawMany();

    const totalPayments = await this.paymentRepository.count();
    const totalRevenue = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.SUCCESS })
      .getRawOne();

    return {
      totalPayments,
      totalRevenue: parseFloat(totalRevenue?.total || '0'),
      byStatus: stats.map((s) => ({
        status: s.status,
        count: parseInt(s.count, 10),
        amount: parseFloat(s.amount || '0'),
      })),
    };
  }
}
