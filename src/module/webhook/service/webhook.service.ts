import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookEntity } from '../entity/webhook.entity';

@Injectable()
export class WebhookService {
  constructor(
    @InjectRepository(WebhookEntity)
    private readonly webhookRepository: Repository<WebhookEntity>,
  ) {}

  async saveWebhook(data: {
    provider: string;
    eventId: string;
    eventType: string;
    payload: any;
  }): Promise<WebhookEntity> {
    const webhook = this.webhookRepository.create({
      provider: data.provider,
      eventId: data.eventId,
      eventType: data.eventType,
      payload: JSON.stringify(data.payload),
      processed: false,
    });
    return this.webhookRepository.save(webhook);
  }

  async findByEventId(eventId: string): Promise<WebhookEntity | null> {
    return this.webhookRepository.findOne({ where: { eventId } });
  }

  async markAsProcessed(id: string, error?: string): Promise<void> {
    await this.webhookRepository.update(id, {
      processed: true,
      error: error ?? undefined,
    });
  }
}
