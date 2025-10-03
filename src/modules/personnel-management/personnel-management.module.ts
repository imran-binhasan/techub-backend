import { Module } from "@nestjs/common";
import { User } from "./user/entity/user.entity";
import { Admin } from "typeorm";
import { Customer } from "./customer/entity/customer.entity";
import { Role } from "./role/entity/role.entity";
import { Permission } from "./permission/entity/permission.entity";
import { Address } from "./address/entity/address.entity";

@Module({
  imports: [User, Admin, Customer, Role, Permission, Address],
  controllers: [],
  providers: [],
})
export class PersonnelManagementModule {}