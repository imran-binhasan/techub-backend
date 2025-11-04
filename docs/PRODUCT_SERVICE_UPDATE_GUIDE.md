# Product Service Update Guide

## Overview
The Product Service needs to be updated to use the new enums, constants, exceptions, and utilities we've created. Due to the file size (578 lines), here's a systematic approach.

## Changes Required

### 1. Import Statements (DONE ✅)
Already updated with:
- New enums (ProductStatus, ProductCondition, ProductVisibility, DiscountType)
- Constants (PRODUCT_VALIDATION, PRODUCT_DEFAULTS, STOCK_THRESHOLDS, PRODUCT_ANALYTICS)
- Custom exceptions (all 17 exceptions)
- Utilities (slug and SKU generation functions)

### 2. Create Method (DONE ✅)
Enhanced with:
- Auto-generate SKU if not provided
- Auto-generate unique slug if not provided
- Validate SKU and slug format
- Check uniqueness for SKU and slug
- Set all new fields with proper defaults
- Use custom exceptions instead of generic NestJS exceptions

### 3. Replace Generic Exceptions Throughout File
Replace ALL occurrences:

#### BadRequestException → Custom Exceptions
- Line 222: `BadRequestException('Invalid pagination parameters')` 
  → Keep as is (this is a query validation, not product-specific)
  
- Line 441: `BadRequestException('Cannot delete product...')`
  → `ProductInCartException(id)`
  
- Line 461: `BadRequestException('Product is not deleted')`
  → Keep as is or create new exception
  
- Line 491: `BadRequestException('Stock cannot be negative')`
  → `InvalidPriceException` or keep as BadRequestException
  
- Line 518: `BadRequestException('Invalid price range')`
  → `InvalidPriceException`

#### NotFoundException → ProductNotFoundException
Replace ALL instances of:
```typescript
throw new NotFoundException(`Product with ID ${id} not found`);
```
With:
```typescript
throw new ProductNotFoundException(id);
```

Lines: 311, 334, 436, 457, 496

#### ConflictException → ProductAlreadyExistsException  
- Line 348: Already using ConflictException for name check
  Should use: `ProductAlreadyExistsException('name', updateProductDto.name)`

### 4. Update Method Enhancement
The update method needs:
- Slug regeneration if name changes
- SKU validation if SKU changes
- Handle all new fields (status, condition, visibility, discounts, SEO, etc.)

### 5. FindAll Method Enhancement
Add support for new query parameters:
- status filter
- condition filter
- visibility filter
- isFeatured filter
- isPublished filter
- Multiple category/brand filters
- Rating filter
- Sort by new fields (avgRating, viewCount, salesCount)

### 6. Add New Methods

#### Analytics Methods
```typescript
async incrementViewCount(id: number): Promise<void> {
  await this.productRepository.increment({ id }, 'viewCount', 1);
}

async incrementSalesCount(id: number, quantity: number = 1): Promise<void> {
  await this.productRepository.increment({ id }, 'salesCount', quantity);
}

async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
  return this.productRepository.find({
    where: {
      isFeatured: true,
      isPublished: true,
      status: ProductStatus.ACTIVE,
    },
    relations: ['category', 'brand', 'images'],
    order: { viewCount: 'DESC' },
    take: limit,
  });
}

async getPopularProducts(limit: number = 10): Promise<Product[]> {
  return this.productRepository.find({
    where: {
      isPublished: true,
      status: ProductStatus.ACTIVE,
    },
    relations: ['category', 'brand', 'images'],
    order: { viewCount: 'DESC' },
    take: limit,
  });
}

async getTrendingProducts(limit: number = 10): Promise<Product[]> {
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - PRODUCT_ANALYTICS.TRENDING_PERIOD_DAYS);
  
  return this.productRepository
    .createQueryBuilder('product')
    .leftJoinAndSelect('product.category', 'category')
    .leftJoinAndSelect('product.brand', 'brand')
    .leftJoinAndSelect('product.images', 'images')
    .where('product.isPublished = :isPublished', { isPublished: true })
    .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
    .andWhere('product.updatedAt >= :daysAgo', { daysAgo })
    .orderBy('product.salesCount', 'DESC')
    .addOrderBy('product.viewCount', 'DESC')
    .take(limit)
    .getMany();
}

async getRelatedProducts(productId: number, limit: number = 6): Promise<Product[]> {
  const product = await this.findOne(productId);
  
  return this.productRepository
    .createQueryBuilder('product')
    .leftJoinAndSelect('product.images', 'images')
    .where('product.id != :productId', { productId })
    .andWhere('product.categoryId = :categoryId', { categoryId: product.categoryId })
    .andWhere('product.isPublished = :isPublished', { isPublished: true })
    .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
    .orderBy('product.avgRating', 'DESC')
    .addOrderBy('product.viewCount', 'DESC')
    .take(limit)
    .getMany();
}
```

#### Bulk Operations
```typescript
async bulkUpdateStatus(
  productIds: number[],
  status: ProductStatus,
): Promise<void> {
  await this.productRepository.update(
    { id: In(productIds) },
    { status },
  );
}

async bulkUpdatePrice(
  updates: Array<{ id: number; price: number }>,
): Promise<void> {
  for (const update of updates) {
    await this.productRepository.update(update.id, { price: update.price });
  }
}

async bulkDelete(productIds: number[]): Promise<void> {
  await this.productRepository.softDelete(productIds);
}
```

#### Search Enhancement
```typescript
async searchProducts(searchTerm: string, limit: number = 20): Promise<Product[]> {
  return this.productRepository
    .createQueryBuilder('product')
    .leftJoinAndSelect('product.category', 'category')
    .leftJoinAndSelect('product.brand', 'brand')
    .leftJoinAndSelect('product.images', 'images')
    .where('product.isPublished = :isPublished', { isPublished: true })
    .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
    .andWhere(
      '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search OR product.keywords::text ILIKE :search)',
      { search: `%${searchTerm}%` },
    )
    .orderBy('product.avgRating', 'DESC')
    .addOrderBy('product.viewCount', 'DESC')
    .take(limit)
    .getMany();
}

async findBySlug(slug: string): Promise<Product> {
  const product = await this.productRepository.findOne({
    where: { slug },
    relations: [
      'category',
      'brand',
      'images',
      'attributeValues',
      'attributeValues.attributeValue',
      'attributeValues.attributeValue.attribute',
    ],
  });

  if (!product) {
    throw new ProductNotFoundException(slug);
  }

  // Increment view count
  await this.incrementViewCount(product.id);

  return product;
}

async findBySKU(sku: string): Promise<Product> {
  const product = await this.productRepository.findOne({
    where: { sku },
    relations: ['category', 'brand', 'images'],
  });

  if (!product) {
    throw new ProductNotFoundException(sku);
  }

  return product;
}
```

### 7. Type Fixes Required

Fix type mismatches:
```typescript
// Line 355, 373: Change from
let category: Category | null = existingProduct.category;
// To:
let category: Category | undefined | null = existingProduct.category || null;
```

## Implementation Steps

1. **Phase 1: Fix Exceptions** (15 min)
   - Replace all generic exceptions with custom ones
   - Fix type mismatches

2. **Phase 2: Enhance Existing Methods** (30 min)
   - Update `findAll` to support new filters
   - Update `update` to handle new fields
   - Update `remove` to check for orders (not just carts)

3. **Phase 3: Add New Methods** (45 min)
   - Add analytics methods
   - Add bulk operations
   - Add search enhancements
   - Add findBySlug and findBySKU

4. **Phase 4: Testing** (30 min)
   - Test product creation with auto-generated SKU/slug
   - Test all new filters
   - Test analytics methods
   - Test bulk operations

## Quick Fix Script

Run this command to replace common patterns:
```bash
# In product.service.ts, replace:
sed -i "s/throw new NotFoundException(\`Product with ID \${id} not found\`)/throw new ProductNotFoundException(id)/g" product.service.ts
```

## Priority Order

**HIGH PRIORITY** (Do First):
1. ✅ Fix import statements
2. ✅ Fix create method  
3. ⏳ Replace all exceptions
4. ⏳ Fix type mismatches
5. ⏳ Add findBySlug method (needed for SEO URLs)

**MEDIUM PRIORITY** (Do Next):
6. Enhance findAll with new filters
7. Add analytics methods (increment views/sales)
8. Add getFeaturedProducts, getPopularProducts

**LOW PRIORITY** (Nice to Have):
9. Add bulk operations
10. Add advanced search
11. Add getRelatedProducts
12. Add recommendation logic

## Testing Checklist

After updates, test:
- [ ] Create product without SKU/slug (should auto-generate)
- [ ] Create product with SKU/slug (should validate)
- [ ] Create product with duplicate SKU (should fail)
- [ ] Create product with invalid slug format (should fail)
- [ ] Update product name (should regenerate slug?)
- [ ] Find product by slug
- [ ] Find product by SKU
- [ ] Get featured products
- [ ] Get popular products
- [ ] Increment view count
- [ ] Filter by status/condition/visibility
- [ ] Filter by multiple categories/brands

## Estimated Total Time
- Full implementation: 2-3 hours
- High priority only: 1 hour
- Testing: 30-60 minutes

