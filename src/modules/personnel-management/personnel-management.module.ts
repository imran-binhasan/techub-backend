import { Module } from '@nestjs/common';
import { UserModule } from './user/module/user.module';
import { AdminModule } from './admin/module/admin.module';
import { CustomerModule } from './customer/module/customer.module';
import { VendorModule } from './vendor/module/vendor.module';
import { RoleModule } from './role/module/role.module';
import { PermissionModule } from './permission/module/permission.module';
import { AddressModule } from './address/module/address.module';

/**
 * Personnel Management Module
 * Aggregates all personnel-related modules (users, roles, permissions, addresses)
 */
@Module({
  imports: [
    UserModule,
    AdminModule,
    CustomerModule,
    VendorModule,
    RoleModule,
    PermissionModule,
    AddressModule,
  ],
  controllers: [],
  providers: [],
  exports: [
    UserModule,
    AdminModule,
    CustomerModule,
    VendorModule,
    RoleModule,
    PermissionModule,
    AddressModule,
  ],
})
export class PersonnelManagementModule {}
