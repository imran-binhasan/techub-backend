import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CustomerService } from '../service/customer.service';
import {
  AdminOnly,
  CustomerOnly,
  RequirePermissions,
  RequireResource,
  Public,
} from 'src/core/auth/decorator/auth.decorator';
import type { AuthenticatedUser } from 'src/core/auth/interface/auth-user.interface';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { CurrentUser } from 'src/core/auth/decorator/current-user.decorator';
import { PaginationQuery } from 'src/shared/dto/pagination_query.dto';

@Controller('customer')
export class CustomerController {}
