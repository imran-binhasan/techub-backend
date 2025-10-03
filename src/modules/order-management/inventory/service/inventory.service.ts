import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from '../entity/inventory.entity';
import { Product } from 'src/product-management/product/entity/product.entity';
import { CreateInventoryDto } from '../dto/create-inventory.dto';
import { UpdateInventoryDto } from '../dto/update-inventory.dto';
import { StockAdjustmentDto } from '../dto/stock-adjustment.dto';

import { PaginatedServiceResponse } from 'src/shared/interface/api-response.interface';
import {
  InventoryTransaction,
  TransactionType,
} from '../entity/inventory-transaction.entity';
import { InventoryQueryDto } from '../dto/query-inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(InventoryTransaction)
    private readonly transactionRepository: Repository<InventoryTransaction>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createInventoryDto: CreateInventoryDto): Promise<Inventory> {
    // Check if inventory already exists for this product
    const existingInventory = await this.inventoryRepository.findOne({
      where: { product: { id: createInventoryDto.productId } },
      withDeleted: true,
    });

    if (existingInventory) {
      throw new ConflictException('Inventory already exists for this product');
    }

    // Validate product exists
    const product = await this.productRepository.findOne({
      where: { id: createInventoryDto.productId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${createInventoryDto.productId} not found`,
      );
    }

    // Create inventory
    const inventory = this.inventoryRepository.create({
      product,
      currentStock: createInventoryDto.initialStock,
      reorderLevel: createInventoryDto.reorderLevel || 10,
      location: createInventoryDto.location,
      lastStockUpdate: new Date(),
    });

    const savedInventory = await this.inventoryRepository.save(inventory);

    // Create initial transaction if stock > 0
    if (createInventoryDto.initialStock > 0) {
      await this.createTransaction(savedInventory, {
        type: TransactionType.IN,
        quantity: createInventoryDto.initialStock,
        reason: createInventoryDto.reason || 'Initial stock',
      });
    }

    // Update product stock
    await this.productRepository.update(product.id, {
      stock: createInventoryDto.initialStock,
    });

    return this.findOne(savedInventory.id);
  }

  async findAll(
    query: InventoryQueryDto,
  ): Promise<PaginatedServiceResponse<Inventory>> {
    const {
      page = 1,
      limit = 10,
      search,
      productId,
      location,
      lowStock,
    } = query;

    if (page < 1 || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .select([
        'inventory.id',
        'inventory.currentStock',
        'inventory.reorderLevel',
        'inventory.location',
        'inventory.lastStockUpdate',
        'inventory.createdAt',
        'inventory.updatedAt',
        'product.id',
        'product.name',
        'product.price',
      ]);

    if (search?.trim()) {
      queryBuilder.andWhere('product.name ILIKE :search', {
        search: `%${search.trim()}%`,
      });
    }

    if (productId) {
      queryBuilder.andWhere('product.id = :productId', { productId });
    }

    if (location?.trim()) {
      queryBuilder.andWhere('inventory.location ILIKE :location', {
        location: `%${location.trim()}%`,
      });
    }

    if (lowStock !== undefined) {
      if (lowStock) {
        queryBuilder.andWhere(
          'inventory.currentStock <= inventory.reorderLevel',
        );
      } else {
        queryBuilder.andWhere(
          'inventory.currentStock > inventory.reorderLevel',
        );
      }
    }

    const [items, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('inventory.lastStockUpdate', 'DESC')
      .getManyAndCount();

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['product', 'transactions'],
      order: { transactions: { createdAt: 'DESC' } },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    return inventory;
  }

  async findByProductId(productId: string): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { product: { id: productId } },
      relations: ['product'],
    });

    if (!inventory) {
      throw new NotFoundException(
        `Inventory for product ID ${productId} not found`,
      );
    }

    return inventory;
  }

  async update(
    id: string,
    updateInventoryDto: UpdateInventoryDto,
  ): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    await this.inventoryRepository.update(id, {
      ...updateInventoryDto,
      lastStockUpdate: new Date(),
    });

    return this.findOne(id);
  }

  async adjustStock(
    id: string,
    adjustmentDto: StockAdjustmentDto,
  ): Promise<Inventory> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    const previousStock = inventory.currentStock;
    let newStock: number;

    switch (adjustmentDto.type) {
      case TransactionType.IN:
        newStock = previousStock + Math.abs(adjustmentDto.quantity);
        break;
      case TransactionType.OUT:
        newStock = previousStock - Math.abs(adjustmentDto.quantity);
        if (newStock < 0) {
          throw new BadRequestException('Insufficient stock');
        }
        break;
      case TransactionType.ADJUSTMENT:
        newStock = adjustmentDto.quantity;
        if (newStock < 0) {
          throw new BadRequestException('Stock cannot be negative');
        }
        break;
      default:
        throw new BadRequestException('Invalid transaction type');
    }

    // Update inventory
    await this.inventoryRepository.update(id, {
      currentStock: newStock,
      lastStockUpdate: new Date(),
    });

    // Update product stock
    await this.productRepository.update(inventory.product.id, {
      stock: newStock,
    });

    // Create transaction
    await this.createTransaction(
      inventory,
      {
        ...adjustmentDto,
        quantity: Math.abs(adjustmentDto.quantity),
      },
      previousStock,
      newStock,
    );

    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with ID ${id} not found`);
    }

    if (inventory.currentStock > 0) {
      throw new BadRequestException(
        'Cannot delete inventory with stock. Adjust stock to zero first.',
      );
    }

    await this.inventoryRepository.softDelete(id);
  }

  // Utility methods
  async getLowStockItems(threshold?: number): Promise<Inventory[]> {
    const queryBuilder = this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.product', 'product')
      .where('inventory.currentStock <= inventory.reorderLevel');

    if (threshold !== undefined) {
      queryBuilder.andWhere('inventory.currentStock <= :threshold', {
        threshold,
      });
    }

    return queryBuilder.orderBy('inventory.currentStock', 'ASC').getMany();
  }

  async getInventoryStats(): Promise<{
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalValue: number;
  }> {
    const [totalItems, lowStock, outOfStock] = await Promise.all([
      this.inventoryRepository.count(),
      this.inventoryRepository
        .createQueryBuilder('inventory')
        .where('inventory.currentStock <= inventory.reorderLevel')
        .getCount(),
      this.inventoryRepository
        .createQueryBuilder('inventory')
        .where('inventory.currentStock = 0')
        .getCount(),
    ]);

    const totalValueResult = await this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoin('inventory.product', 'product')
      .select('SUM(inventory.currentStock * product.price)', 'totalValue')
      .getRawOne();

    return {
      totalItems,
      lowStockItems: lowStock,
      outOfStockItems: outOfStock,
      totalValue: parseFloat(totalValueResult?.totalValue || '0'),
    };
  }

  // Private helper method
  private async createTransaction(
    inventory: Inventory,
    data: Omit<StockAdjustmentDto, 'quantity'> & { quantity: number },
    previousStock?: number,
    newStock?: number,
  ): Promise<void> {
    const transaction = this.transactionRepository.create({
      inventory,
      type: data.type,
      quantity: data.quantity,
      previousStock: previousStock ?? inventory.currentStock,
      newStock: newStock ?? inventory.currentStock,
      reason: data.reason,
      referenceId: data.referenceId,
    });

    await this.transactionRepository.save(transaction);
  }
}
