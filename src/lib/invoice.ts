
// This file will contain logic for generating PDFs using react-pdf
import { Order, OrderItem } from "./types";
import { calculateSquareFeet, calculateTaxBreakdown, formatCurrency, numberToWords } from "./utils";

export interface InvoiceData {
  order: Order;
  items: OrderItem[];
  companyName: string;
  companyAddress: string;
  companyGST: string;
  companyPhone: string;
  companyEmail: string;
  invoiceDate: string;
  invoiceNumber: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branch: string;
    ifsc: string;
  };
}

export const generateInvoiceData = (
  order: Order, 
  items: OrderItem[],
  inventoryItems: Record<number, any>
): InvoiceData => {
  // Prepare all data needed for invoice
  
  const enhancedItems = items.map(item => {
    const product = inventoryItems[item.product_id];
    return {
      ...item,
      product_details: product
    };
  });
  
  return {
    order,
    items: enhancedItems,
    companyName: "Tile Tracker Co.",
    companyAddress: "123 Ceramic Street, Tileville, Maharashtra 400001",
    companyGST: "27AABCT1234Z1ZA",
    companyPhone: "022-12345678",
    companyEmail: "sales@tiletracker.com",
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceNumber: `INV-${order.order_id?.slice(4)}`,
    bankDetails: {
      accountName: "Tile Tracker Co.",
      accountNumber: "1234567890123456",
      bankName: "State Bank of India",
      branch: "Tileville",
      ifsc: "SBIN0001234"
    }
  };
};

export const calculateInvoiceTotals = (
  order: Order,
  items: OrderItem[],
  inventoryItems: Record<number, any>
) => {
  let subtotal = 0;
  let totalSqft = 0;
  
  const itemsWithCalculations = items.map(item => {
    const product = inventoryItems[item.product_id];
    if (!product) return item;
    
    const sqftPerBox = calculateSquareFeet(
      product.tile_width,
      product.tile_height,
      product.tiles_per_box
    );
    
    const totalItemSqft = sqftPerBox * item.boxes_sold;
    const totalItemPrice = totalItemSqft * item.price_per_sqft;
    
    subtotal += totalItemPrice;
    totalSqft += totalItemSqft;
    
    return {
      ...item,
      sqftPerBox,
      totalSqft: totalItemSqft,
      totalPrice: totalItemPrice
    };
  });
  
  // Calculate tax based on state code and reverse charge
  const taxes = calculateTaxBreakdown(
    subtotal, 
    order.state_code, 
    order.is_reverse_charge
  );
  
  // Calculate grand total
  const grandTotal = taxes.totalAmount;
  
  // Amount in words
  const amountInWords = numberToWords(grandTotal);
  
  return {
    items: itemsWithCalculations,
    subtotal,
    totalSqft,
    taxes,
    grandTotal,
    amountInWords
  };
};
