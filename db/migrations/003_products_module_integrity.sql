-- Migration: Products Module Integrity Improvements
-- Date: 2024
-- Description: Add missing indexes for soft delete queries and improve query performance

-- Add indexes on deleted_at columns for better soft delete query performance
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at);
CREATE INDEX IF NOT EXISTS idx_variants_deleted_at ON variants(deleted_at);
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at);

-- Verify foreign key constraints are properly enforced
-- (SQLite foreign keys are enabled at runtime, not schema level)

-- Add composite index for common product queries
CREATE INDEX IF NOT EXISTS idx_products_status_deleted ON products(status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_variants_product_status ON variants(product_id, status, deleted_at);
