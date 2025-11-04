-- Product Management Module - Database Migration
-- This file contains all SQL commands to update the database schema

-- ============================================
-- PRODUCT TABLE ENHANCEMENTS
-- ============================================

-- Add new columns to product table
ALTER TABLE product
  -- Core identification fields
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100),
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
  
  -- Status and visibility
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS condition VARCHAR(20) DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public',
  
  -- Pricing fields
  ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS cost_per_item DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS discount_value DECIMAL(5,2) DEFAULT 0,
  
  -- SEO fields
  ADD COLUMN IF NOT EXISTS meta_title VARCHAR(60),
  ADD COLUMN IF NOT EXISTS meta_description VARCHAR(160),
  ADD COLUMN IF NOT EXISTS keywords TEXT[],
  
  -- Analytics fields
  ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sales_count INT DEFAULT 0,
  
  -- Feature flags
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
  
  -- Foreign key columns for indexes
  ADD COLUMN IF NOT EXISTS category_id INT,
  ADD COLUMN IF NOT EXISTS brand_id INT,
  ADD COLUMN IF NOT EXISTS vendor_id INT;

-- Update name column to have proper length constraint
ALTER TABLE product ALTER COLUMN name TYPE VARCHAR(255);
ALTER TABLE product ALTER COLUMN description TYPE TEXT;

-- Add unique constraints
ALTER TABLE product ADD CONSTRAINT uq_product_sku UNIQUE (sku);
ALTER TABLE product ADD CONSTRAINT uq_product_slug UNIQUE (slug);

-- Add check constraints
ALTER TABLE product ADD CONSTRAINT chk_product_price CHECK (price >= 0);
ALTER TABLE product ADD CONSTRAINT chk_product_stock CHECK (stock >= 0);
ALTER TABLE product ADD CONSTRAINT chk_product_avg_rating CHECK (avg_rating >= 0 AND avg_rating <= 5);
ALTER TABLE product ADD CONSTRAINT chk_product_discount_value CHECK (discount_value >= 0);

-- ============================================
-- PRODUCT TABLE INDEXES
-- ============================================

-- Single column indexes
CREATE INDEX IF NOT EXISTS idx_product_sku ON product(sku);
CREATE INDEX IF NOT EXISTS idx_product_slug ON product(slug);
CREATE INDEX IF NOT EXISTS idx_product_status ON product(status);
CREATE INDEX IF NOT EXISTS idx_product_category_id ON product(category_id);
CREATE INDEX IF NOT EXISTS idx_product_brand_id ON product(brand_id);
CREATE INDEX IF NOT EXISTS idx_product_vendor_id ON product(vendor_id);
CREATE INDEX IF NOT EXISTS idx_product_is_featured ON product(is_featured);
CREATE INDEX IF NOT EXISTS idx_product_is_published ON product(is_published);
CREATE INDEX IF NOT EXISTS idx_product_avg_rating ON product(avg_rating);
CREATE INDEX IF NOT EXISTS idx_product_view_count ON product(view_count);
CREATE INDEX IF NOT EXISTS idx_product_sales_count ON product(sales_count);
CREATE INDEX IF NOT EXISTS idx_product_created_at ON product(created_at);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_product_status_published ON product(status, is_published);
CREATE INDEX IF NOT EXISTS idx_product_category_status ON product(category_id, status);
CREATE INDEX IF NOT EXISTS idx_product_brand_status ON product(brand_id, status);
CREATE INDEX IF NOT EXISTS idx_product_vendor_status ON product(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_product_featured_status ON product(is_featured, status);
CREATE INDEX IF NOT EXISTS idx_product_rating_status ON product(avg_rating, status);
CREATE INDEX IF NOT EXISTS idx_product_price_status ON product(price, status);
CREATE INDEX IF NOT EXISTS idx_product_date_status ON product(created_at, status);

-- ============================================
-- CATEGORY TABLE ENHANCEMENTS
-- ============================================

ALTER TABLE category
  -- Add slug for SEO
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
  
  -- Add description
  ADD COLUMN IF NOT EXISTS description TEXT,
  
  -- Media fields
  ADD COLUMN IF NOT EXISTS image VARCHAR(500),
  ADD COLUMN IF NOT EXISTS icon VARCHAR(500),
  
  -- SEO fields
  ADD COLUMN IF NOT EXISTS meta_title VARCHAR(60),
  ADD COLUMN IF NOT EXISTS meta_description VARCHAR(160),
  
  -- Display configuration
  ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE,
  
  -- Statistics
  ADD COLUMN IF NOT EXISTS products_count INT DEFAULT 0;

-- Update name column
ALTER TABLE category ALTER COLUMN name TYPE VARCHAR(255);

-- Add unique constraint
ALTER TABLE category ADD CONSTRAINT uq_category_slug UNIQUE (slug);

-- Add check constraints
ALTER TABLE category ADD CONSTRAINT chk_category_display_order CHECK (display_order >= 0);

-- ============================================
-- CATEGORY TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_category_slug ON category(slug);
CREATE INDEX IF NOT EXISTS idx_category_is_visible ON category(is_visible);
CREATE INDEX IF NOT EXISTS idx_category_display_order ON category(display_order);
CREATE INDEX IF NOT EXISTS idx_category_visible_parent ON category(is_visible, parent_id);

-- ============================================
-- BRAND TABLE ENHANCEMENTS
-- ============================================

ALTER TABLE brand
  -- Add slug for SEO
  ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
  
  -- SEO fields
  ADD COLUMN IF NOT EXISTS meta_title VARCHAR(60),
  ADD COLUMN IF NOT EXISTS meta_description VARCHAR(160),
  
  -- Display configuration
  ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  
  -- Statistics
  ADD COLUMN IF NOT EXISTS products_count INT DEFAULT 0;

-- Add unique constraint
ALTER TABLE brand ADD CONSTRAINT uq_brand_slug UNIQUE (slug);

-- ============================================
-- BRAND TABLE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_brand_slug ON brand(slug);
CREATE INDEX IF NOT EXISTS idx_brand_is_active ON brand(is_active);
CREATE INDEX IF NOT EXISTS idx_brand_display_order ON brand(display_order);

-- ============================================
-- PRODUCT_IMAGE TABLE ENHANCEMENTS
-- ============================================

ALTER TABLE product_image
  -- Add foreign key column for index
  ADD COLUMN IF NOT EXISTS product_id INT;

-- ============================================
-- PRODUCT_IMAGE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_product_image_product_id ON product_image(product_id);
CREATE INDEX IF NOT EXISTS idx_product_image_is_primary ON product_image(is_primary);
CREATE INDEX IF NOT EXISTS idx_product_image_product_primary ON product_image(product_id, is_primary);

-- ============================================
-- PRODUCT_REVIEW TABLE ENHANCEMENTS
-- ============================================

ALTER TABLE product_review
  -- Add customer reference
  ADD COLUMN IF NOT EXISTS customer_id INT,
  
  -- Add verification and helpful features
  ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS helpful_count INT DEFAULT 0,
  
  -- Add images support
  ADD COLUMN IF NOT EXISTS images TEXT[],
  
  -- Add status for moderation
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending',
  
  -- Add foreign key column for product
  ADD COLUMN IF NOT EXISTS product_id INT;

-- Add check constraint
ALTER TABLE product_review ADD CONSTRAINT chk_review_helpful_count CHECK (helpful_count >= 0);

-- ============================================
-- PRODUCT_REVIEW INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_product_review_product_id ON product_review(product_id);
CREATE INDEX IF NOT EXISTS idx_product_review_customer_id ON product_review(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_review_rating ON product_review(rating);
CREATE INDEX IF NOT EXISTS idx_product_review_status ON product_review(status);
CREATE INDEX IF NOT EXISTS idx_product_review_verified ON product_review(is_verified_purchase);

-- ============================================
-- CART TABLE ENHANCEMENTS
-- ============================================

ALTER TABLE cart
  -- Add variant support
  ADD COLUMN IF NOT EXISTS variant_id INT,
  
  -- Add selected attributes as JSON
  ADD COLUMN IF NOT EXISTS selected_attributes JSONB;

-- ============================================
-- CART INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_cart_customer_id ON cart("customerId");
CREATE INDEX IF NOT EXISTS idx_cart_product_id ON cart("productId");
CREATE INDEX IF NOT EXISTS idx_cart_variant_id ON cart(variant_id);

-- ============================================
-- DATA MIGRATION SCRIPTS
-- ============================================

-- Generate SKU for existing products (simple format)
UPDATE product 
SET sku = CONCAT('PROD-', LPAD(id::TEXT, 6, '0'))
WHERE sku IS NULL;

-- Generate slug for existing products
UPDATE product 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Set default status for existing products
UPDATE product 
SET status = 'active', is_published = TRUE
WHERE status IS NULL AND stock > 0;

-- Generate slug for existing categories
UPDATE category 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Set display order for categories (by creation date)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 AS rn
  FROM category
)
UPDATE category 
SET display_order = ranked.rn
FROM ranked
WHERE category.id = ranked.id AND category.display_order = 0;

-- Generate slug for existing brands
UPDATE brand 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Update category products_count
UPDATE category c
SET products_count = (
  SELECT COUNT(*) 
  FROM product p 
  WHERE p.category_id = c.id 
  AND p.deleted_at IS NULL
);

-- Update brand products_count
UPDATE brand b
SET products_count = (
  SELECT COUNT(*) 
  FROM product p 
  WHERE p.brand_id = b.id 
  AND p.deleted_at IS NULL
);

-- ============================================
-- FOREIGN KEY CONSTRAINTS (Optional - Add if not exists)
-- ============================================

-- Add foreign keys for product
ALTER TABLE product ADD CONSTRAINT fk_product_category 
  FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE SET NULL;

ALTER TABLE product ADD CONSTRAINT fk_product_brand 
  FOREIGN KEY (brand_id) REFERENCES brand(id) ON DELETE SET NULL;

ALTER TABLE product ADD CONSTRAINT fk_product_vendor 
  FOREIGN KEY (vendor_id) REFERENCES vendor(id) ON DELETE SET NULL;

-- Add foreign key for product_image
ALTER TABLE product_image ADD CONSTRAINT fk_product_image_product 
  FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE;

-- Add foreign keys for product_review
ALTER TABLE product_review ADD CONSTRAINT fk_product_review_product 
  FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE;

ALTER TABLE product_review ADD CONSTRAINT fk_product_review_customer 
  FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE CASCADE;

-- ============================================
-- TRIGGERS FOR AUTO-UPDATE (Optional)
-- ============================================

-- Trigger to update category products_count
CREATE OR REPLACE FUNCTION update_category_products_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE category SET products_count = products_count + 1 WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE category SET products_count = products_count - 1 WHERE id = OLD.category_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.category_id != OLD.category_id THEN
    UPDATE category SET products_count = products_count - 1 WHERE id = OLD.category_id;
    UPDATE category SET products_count = products_count + 1 WHERE id = NEW.category_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_category_products_count
AFTER INSERT OR DELETE OR UPDATE OF category_id ON product
FOR EACH ROW EXECUTE FUNCTION update_category_products_count();

-- Trigger to update product avg_rating and review_count
CREATE OR REPLACE FUNCTION update_product_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE product 
  SET 
    avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM product_review WHERE product_id = NEW.product_id AND deleted_at IS NULL),
    review_count = (SELECT COUNT(*) FROM product_review WHERE product_id = NEW.product_id AND deleted_at IS NULL)
  WHERE id = NEW.product_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_product_review_stats
AFTER INSERT OR UPDATE OR DELETE ON product_review
FOR EACH ROW EXECUTE FUNCTION update_product_review_stats();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check product table structure
-- SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'product'
-- ORDER BY ordinal_position;

-- Check category table structure
-- SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'category'
-- ORDER BY ordinal_position;

-- Check indexes
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('product', 'category', 'brand', 'product_image', 'product_review', 'cart')
-- ORDER BY tablename, indexname;

-- Check constraints
-- SELECT conname, contype, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid IN ('product'::regclass, 'category'::regclass, 'brand'::regclass)
-- ORDER BY conrelid, contype, conname;
