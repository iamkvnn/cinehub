import { BaseEntity } from 'src/core/base/base.entity';
import { Entity, Column } from 'typeorm';

@Entity('webhooks')
export class WebhookEntity extends BaseEntity {
  @Column()
  provider: string; // stripe, paypal, etc.

  @Column()
  eventId: string;

  @Column()
  eventType: string;

  @Column({ type: 'text' })
  payload: string; // JSON string của event data

  @Column({ default: false })
  processed: boolean;

  @Column({ type: 'text', nullable: true })
  error?: string;
}
