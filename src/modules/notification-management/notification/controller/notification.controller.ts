import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import {
  RequirePermissions,
  RequireResource,
  Public,
} from 'src/core/auth/decorator/auth.decorator';
import { SendNotificationDto } from '../dto/send-notification.dto';
import { NotificationService } from '../service/notification.service';
import { NotificationQueryDto } from '../dto/query.notification.dto';
import { MarkAsReadDto } from '../dto/read-notificaion.dto';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @RequireResource('notification', 'create')
  @Post()
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    const result = await this.notificationService.create(createNotificationDto);
    return {
      success: true,
      message: 'Notification created successfully',
      data: result,
    };
  }

  @RequirePermissions('read:notification')
  @Get()
  async findAll(@Query() query: NotificationQueryDto) {
    const result = await this.notificationService.findAll(query);
    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data: result,
    };
  }

  @RequirePermissions('read:notification')
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const result = await this.notificationService.findOne(id);
    return {
      success: true,
      message: 'Notification retrieved successfully',
      data: result,
    };
  }

  @RequireResource('notification', 'update')
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    const result = await this.notificationService.update(
      id,
      updateNotificationDto,
    );
    return {
      success: true,
      message: 'Notification updated successfully',
      data: result,
    };
  }

  @RequireResource('notification', 'delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.notificationService.remove(id);
    return {
      success: true,
      message: 'Notification deleted successfully',
    };
  }

  @RequireResource('notification', 'manage')
  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  async restore(@Param('id', ParseIntPipe) id: number) {
    const result = await this.notificationService.restore(id);
    return {
      success: true,
      message: 'Notification restored successfully',
      data: result,
    };
  }

  // Send notification to customers
  @RequireResource('notification', 'create')
  @Post(':id/send')
  async sendNotification(
    @Param('id', ParseIntPipe) id: number,
    @Body() sendNotificationDto: SendNotificationDto,
  ) {
    const result = await this.notificationService.sendNotification(
      id,
      sendNotificationDto,
    );
    return {
      success: true,
      message: 'Notification sent successfully',
      data: result,
    };
  }

  // Broadcast notification to all customers
  @RequireResource('notification', 'create')
  @Post(':id/broadcast')
  async broadcastNotification(@Param('id', ParseIntPipe) id: number) {
    const result = await this.notificationService.broadcastNotification(id);
    return {
      success: true,
      message: 'Notification broadcasted successfully',
      data: result,
    };
  }

  // Customer notification endpoints
  @Public()
  @Get('customer/:customerId')
  async getCustomerNotifications(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Query() query: NotificationQueryDto,
  ) {
    const result = await this.notificationService.getCustomerNotifications(
      customerId,
      query,
    );
    return {
      success: true,
      message: 'Customer notifications retrieved successfully',
      data: result,
    };
  }

  @Public()
  @Get('customer/:customerId/unread')
  async getUnreadNotifications(
    @Param('customerId', ParseIntPipe) customerId: number,
  ) {
    const result =
      await this.notificationService.getUnreadNotifications(customerId);
    return {
      success: true,
      message: 'Unread notifications retrieved successfully',
      data: result,
    };
  }

  @Public()
  @Get('customer/:customerId/count')
  async getNotificationCounts(
    @Param('customerId', ParseIntPipe) customerId: number,
  ) {
    const result =
      await this.notificationService.getNotificationCounts(customerId);
    return {
      success: true,
      message: 'Notification counts retrieved successfully',
      data: result,
    };
  }

  @Public()
  @Patch('customer/:customerId/mark-as-read')
  async markNotificationsAsRead(
    @Param('customerId', ParseIntPipe) customerId: number,
    @Body() markAsReadDto: MarkAsReadDto,
  ) {
    const result = await this.notificationService.markAsRead(
      customerId,
      markAsReadDto,
    );
    return {
      success: true,
      message: 'Notifications marked as read successfully',
      data: result,
    };
  }

  @Public()
  @Patch('customer/:customerId/mark-all-as-read')
  async markAllAsRead(@Param('customerId', ParseIntPipe) customerId: number) {
    const result = await this.notificationService.markAllAsRead(customerId);
    return {
      success: true,
      message: 'All notifications marked as read successfully',
      data: result,
    };
  }

  // Statistics endpoints
  @RequirePermissions('read:notification')
  @Get('stats/count')
  async getNotificationsCount() {
    const result = await this.notificationService.getNotificationsCount();
    return {
      success: true,
      message: 'Notifications count retrieved successfully',
      data: { count: result },
    };
  }

  @RequirePermissions('read:notification')
  @Get('stats/recent')
  async getRecentNotifications(@Query('days') days: number = 7) {
    const result = await this.notificationService.getRecentNotifications(days);
    return {
      success: true,
      message: 'Recent notifications retrieved successfully',
      data: result,
    };
  }
}
