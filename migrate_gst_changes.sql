-- Add new columns for GST handling
ALTER TABLE orders
ADD COLUMN order_type VARCHAR(20) NOT NULL DEFAULT 'tax_invoice',
ADD COLUMN client_state VARCHAR(100),
ADD COLUMN subtotal DECIMAL(10,2),
ADD COLUMN gst_type VARCHAR(20) DEFAULT 'none',
ADD COLUMN igst_rate DECIMAL(5,2) DEFAULT 18.0,
ADD COLUMN igst_amount DECIMAL(10,2),
ADD COLUMN cgst_rate DECIMAL(5,2) DEFAULT 9.0,
ADD COLUMN cgst_amount DECIMAL(10,2),
ADD COLUMN sgst_rate DECIMAL(5,2) DEFAULT 9.0,
ADD COLUMN sgst_amount DECIMAL(10,2);

-- Update existing orders to be tax invoices
UPDATE orders SET order_type = 'tax_invoice' WHERE order_type IS NULL; 