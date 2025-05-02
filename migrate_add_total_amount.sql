-- Add total_amount column to orders table
ALTER TABLE orders ADD COLUMN total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0;

-- Update existing orders with calculated total_amount
UPDATE orders o
SET total_amount = o.subtotal + COALESCE(o.igst_amount, 0) + COALESCE(o.cgst_amount, 0) + COALESCE(o.sgst_amount, 0)
WHERE true;

-- Remove the default constraint after updating existing records
ALTER TABLE orders ALTER COLUMN total_amount DROP DEFAULT; 