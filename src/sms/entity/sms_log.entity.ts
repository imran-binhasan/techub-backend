

// src/sms/entity/sms-log.entity.ts
import { BaseEntity } from 'src/common/entity/base.entity';
import { Entity, Column } from 'typeorm';

@Entity('sms_log')
export class SmsLog extends BaseEntity {
  @Column({ type: 'varchar', length: 20 })
  recipient: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  messageId: string | null;

  @Column({ type: 'boolean', default: false })
  delivered: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt: Date | null;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: string; // pending, sent, delivered, failed

  @Column({ type: 'text', nullable: true })
  responseData: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;
}

// src/sms/dto/send-sms.dto.ts

