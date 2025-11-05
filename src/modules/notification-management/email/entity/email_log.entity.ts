import { BaseEntity } from 'src/shared/entity/base.entity';
import { Column, Entity, Index } from 'typeorm';

@Entity('email_log')
@Index(['recipient'])
@Index(['status'])
@Index(['createdAt'])
export class EmailLog extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  recipient: string;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'text', nullable: true })
  htmlBody?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reference?: string;

  @Column({ type: 'json', nullable: true })
  attachments?: any;

  @Column({
    type: 'enum',
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
  })
  status: 'pending' | 'sent' | 'failed';

  @Column({ type: 'varchar', length: 255, nullable: true })
  messageId?: string;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'json', nullable: true })
  responseData?: any;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  failedAt?: Date;
}
