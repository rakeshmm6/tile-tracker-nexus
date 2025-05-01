
// Dashboard statistics and reporting functionality
import { supabase } from "../../integrations/supabase/client";
import { calculateSquareFeet } from "./utils";

// --- Dashboard Stats ---
export const getDashboardStats = async () => {
  try {
    // Get total inventory value
    const { data: inventoryData, error: inventoryError } = await supabase
      .from("inventory")
      .select("*");
    
    if (inventoryError) {
      throw inventoryError;
    }
    
    let inventoryValue = 0;
    let boxesInStock = 0;
    
    if (inventoryData) {
      inventoryData.forEach(item => {
        const sqftPerBox = calculateSquareFeet(
          item.tile_width,
          item.tile_height,
          item.tiles_per_box
        );
        inventoryValue += item.boxes_on_hand * sqftPerBox * item.price_per_sqft;
        boxesInStock += item.boxes_on_hand;
      });
    }
    
    // Get order count
    const { count: orderCount, error: orderCountError } = await supabase
      .from("orders")
      .select("*", { count: 'exact', head: true });
    
    if (orderCountError) {
      throw orderCountError;
    }
    
    // Get total sales revenue
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("order_id");
    
    if (ordersError) {
      throw ordersError;
    }
    
    let salesRevenue = 0;
    
    // Calculate revenue from all orders
    if (orders && orders.length > 0) {
      // Get all order items with their associated inventory items
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          *,
          inventory:product_id(*)
        `);
      
      if (itemsError) {
        throw itemsError;
      }
      
      if (orderItems) {
        orderItems.forEach(item => {
          const product = item.inventory;
          const sqftPerBox = calculateSquareFeet(
            product.tile_width,
            product.tile_height,
            product.tiles_per_box
          );
          salesRevenue += item.boxes_sold * sqftPerBox * item.price_per_sqft;
        });
      }
    }
    
    return {
      inventory_value: inventoryValue,
      boxes_in_stock: boxesInStock,
      order_count: orderCount || 0,
      sales_revenue: salesRevenue
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    // Return default values in case of error
    return {
      inventory_value: 0,
      boxes_in_stock: 0,
      order_count: 0,
      sales_revenue: 0
    };
  }
};
