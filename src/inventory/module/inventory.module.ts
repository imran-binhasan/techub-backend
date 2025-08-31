import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inventory } from '../entity/inventory.entity';
import { Product } from 'src/product/entity/product.entity';
import { InventoryTransaction } from '../entity/inventory-transactuin.entity';
import { AuthModule } from 'src/auth/module/auth.module';
import { InventoryController } from '../controller/inventory.controller';
import { InventoryService } from '../service/inventory.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Inventory,
      InventoryTransaction,
      Product,
    ]),
    AuthModule
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}