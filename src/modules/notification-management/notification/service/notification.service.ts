// src/notification/service/notification.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Notification } from '../entity/notification.entity';
import { Customer } from 'src/user-management/customer/entity/customer.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { SendNotificationDto } from '../dto/send-notification.dto';
import { CustomerNotification } from '../entity/customer-notification';
import { NotificationQueryDto } from '../dto/query.notification.dto';
import { MarkAsReadDto } from '../dto/read-notificaion.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(CustomerNotification)
    private readonly customerNotificationRepository: Repository<CustomerNotification>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create(
      createNotificationDto,
    );
    return await this.notificationRepository.save(notification);
  }

  async findAll(query: NotificationQueryDto) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.deletedAt IS NULL');

    // Search functionality
    if (search) {
      queryBuilder.andWhere(
        '(notification.title ILIKE :search OR notification.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sorting
    const allowedSortFields = ['createdAt', 'updatedAt', 'title'];
    if (allowedSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`notification.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('notification.createdAt', 'DESC');
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [notifications, total] = await queryBuilder.getManyAndCount();

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['customers'],
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async update(
    id: number,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<Notification> {
    const notification = await this.findOne(id);
    Object.assign(notification, updateNotificationDto);
    return await this.notificationRepository.save(notification);
  }

  async remove(id: number): Promise<void> {
    const notification = await this.findOne(id);
    await this.notificationRepository.softDelete(notification.id);
  }

  async restore(id: number): Promise<Notification> {
    const result = await this.notificationRepository.restore(id);

    if (result.affected === 0) {
      throw new NotFoundException('Notification not found or not deleted');
    }

    return await this.findOne(id);
  }

  async sendNotification(
    notificationId: number,
    sendNotificationDto: SendNotificationDto,
  ): Promise<{ sent: number }> {
    const notification = await this.findOne(notificationId);
    const { customerIds } = sendNotificationDto;

    // Verify all customers exist
    const customers = await this.customerRepository.find({
      where: { id: In(customerIds) },
    });

    if (customers.length !== customerIds.length) {
      throw new BadRequestException('One or more customers not found');
    }

    // Create customer notifications
    const customerNotifications = customers.map((customer) =>
      this.customerNotificationRepository.create({
        notification,
        customer,
        isRead: false,
        readAt: null,
      }),
    );

    await this.customerNotificationRepository.save(customerNotifications);

    return { sent: customerNotifications.length };
  }

  async broadcastNotification(
    notificationId: number,
  ): Promise<{ sent: number }> {
    const notification = await this.findOne(notificationId);

    // Get all active customers
    const customers = await this.customerRepository.find({
      where: { deletedAt: IsNull() },
    });

    if (customers.length === 0) {
      return { sent: 0 };
    }

    // Create customer notifications for all customers
    const customerNotifications = customers.map((customer) =>
      this.customerNotificationRepository.create({
        notification,
        customer,
        isRead: false,
        readAt: null,
      }),
    );

    await this.customerNotificationRepository.save(customerNotifications);

    return { sent: customerNotifications.length };
  }

  async getCustomerNotifications(
    customerId: number,
    query: NotificationQueryDto,
  ) {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.customerNotificationRepository
      .createQueryBuilder('customerNotification')
      .leftJoinAndSelect('customerNotification.notification', 'notification')
      .where('customerNotification.customer.id = :customerId', { customerId })
      .andWhere('customerNotification.deletedAt IS NULL')
      .andWhere('notification.deletedAt IS NULL');

    // Search functionality
    if (search) {
      queryBuilder.andWhere(
        '(notification.title ILIKE :search OR notification.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sorting
    const allowedSortFields = ['createdAt', 'updatedAt', 'readAt'];
    if (allowedSortFields.includes(sortBy)) {
      queryBuilder.orderBy(`customerNotification.${sortBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('customerNotification.createdAt', 'DESC');
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [customerNotifications, total] = await queryBuilder.getManyAndCount();

    return {
      data: customerNotifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUnreadNotifications(
    customerId: number,
  ): Promise<CustomerNotification[]> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return await this.customerNotificationRepository.find({
      where: {
        customer: { id: customerId },
        isRead: false,
        deletedAt: IsNull(),
      },
      relations: ['notification'],
      order: { createdAt: 'DESC' },
    });
  }

  async getNotificationCounts(
    customerId: number,
  ): Promise<{ total: number; unread: number }> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const total = await this.customerNotificationRepository.count({
      where: {
        customer: { id: customerId },
        deletedAt: IsNull(),
      },
    });

    const unread = await this.customerNotificationRepository.count({
      where: {
        customer: { id: customerId },
        isRead: false,
        deletedAt: IsNull(),
      },
    });

    return { total, unread };
  }

  async markAsRead(
    customerId: number,
    markAsReadDto: MarkAsReadDto,
  ): Promise<{ updated: number }> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const { notificationIds } = markAsReadDto;

    const result = await this.customerNotificationRepository
      .createQueryBuilder()
      .update(CustomerNotification)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where('customer.id = :customerId', { customerId })
      .andWhere('notification.id IN (:...notificationIds)', { notificationIds })
      .andWhere('isRead = false')
      .execute();

    return { updated: result.affected || 0 };
  }

  async markAllAsRead(customerId: number): Promise<{ updated: number }> {
    const customer = await this.customerRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const result = await this.customerNotificationRepository
      .createQueryBuilder()
      .update(CustomerNotification)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where('customer.id = :customerId', { customerId })
      .andWhere('isRead = false')
      .execute();

    return { updated: result.affected || 0 };
  }

  async getNotificationsCount(): Promise<number> {
    return await this.notificationRepository.count({
      where: { deletedAt: IsNull() },
    });
  }

  async getRecentNotifications(days: number = 7): Promise<Notification[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return await this.notificationRepository.find({
      where: {
        createdAt: In([date]),
        deletedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
