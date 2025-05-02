import { supabase } from "../../integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

export const checkGSTColumns = async () => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        order_type,
        client_state,
        subtotal,
        gst_type,
        igst_rate,
        igst_amount,
        cgst_rate,
        cgst_amount,
        sgst_rate,
        sgst_amount
      `)
      .limit(1);

    if (error) {
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      if (error.message.includes("column") && error.message.includes("does not exist")) {
        console.log(`
Please execute the following SQL in your Supabase dashboard SQL editor to add GST columns:

-- Add new columns for GST handling
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_type VARCHAR(20) NOT NULL DEFAULT 'tax_invoice',
ADD COLUMN IF NOT EXISTS client_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS gst_type VARCHAR(20) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS igst_rate DECIMAL(5,2) DEFAULT 18.0,
ADD COLUMN IF NOT EXISTS igst_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS cgst_rate DECIMAL(5,2) DEFAULT 9.0,
ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS sgst_rate DECIMAL(5,2) DEFAULT 9.0,
ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(10,2);

-- Update existing orders to be tax invoices
UPDATE orders SET order_type = 'tax_invoice' WHERE order_type IS NULL;
        `);
        return false;
      }
      throw error;
    }

    console.log("GST columns check result:", data);
    return true;
  } catch (error) {
    console.error("Migration check failed:", error);
    throw error;
  }
};

export const applyGSTMigration = async () => {
  try {
    const hasGSTColumns = await checkGSTColumns();
    if (!hasGSTColumns) {
      toast.error("GST columns are missing. Please run the SQL migration in Supabase dashboard.");
      return false;
    }

    toast.success("GST columns are already set up!");
    return true;
  } catch (error) {
    console.error("Migration check failed:", error);
    toast.error("Failed to check database status");
    throw error;
  }
}; 