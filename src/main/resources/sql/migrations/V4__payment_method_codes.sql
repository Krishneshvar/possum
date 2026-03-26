-- V4: Invoice Sequences — Add `code` column + sequence table
-- Part 1 of 2: Schema changes
-- Adds the `code` column to payment_methods for invoice ID prefixes (CH, DC, CC, GC).

ALTER TABLE payment_methods ADD COLUMN code TEXT;
