
import { supabase } from "../integrations/supabase/client";
import type { Database } from "../integrations/supabase/types";
import { InventoryItem, Order, OrderItem } from "./types";

// --- Inventory CRUD ---
export const getInventory = async (): Promise<InventoryItem[]> => {
  const { data, error } = await supabase
    .from("inventory")
    .select("*");
  
  if (error) {
    console.error("Error fetching inventory:", error);
    throw error;
  }
  
  return data || [];
};

export const addInventoryItem = async (item: InventoryItem): Promise<InventoryItem> => {
  const { data, error } = await supabase
    .from("inventory")
    .insert(item)
    .select()
    .single();
  
  if (error) {
    console.error("Error adding inventory item:", error);
    throw error;
  }
  
  return data;
};

export const updateInventoryItem = async (id: number, updates: Partial<InventoryItem>): Promise<InventoryItem> => {
  const { data, error } = await supabase
    .from("inventory")
    .update(updates)
    .eq("product_id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating inventory item:", error);
    throw error;
  }
  
  return data;
};

export const deleteInventoryItem = async (id: number): Promise<void> => {
  const { error } = await supabase
    .from("inventory")
    .delete()
    .eq("product_id", id);
  
  if (error) {
    console.error("Error deleting inventory item:", error);
    throw error;
  }
};

// --- Orders CRUD ---
export const getOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from("orders")
    .select("*");
  
  if (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
  
  return data || [];
};

export const getOrdersWithItems = async (): Promise<Order[]> => {
  // First get all orders
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("*");
  
  if (ordersError) {
    console.error("Error fetching orders:", ordersError);
    throw ordersError;
  }
  
  if (!orders || orders.length === 0) {
    return [];
  }
  
  // For each order, fetch its items
  const ordersWithItems = await Promise.all(
    orders.map(async (order) => {
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          *,
          inventory:product_id(*)
        `)
        .eq("order_id", order.order_id);
      
      if (itemsError) {
        console.error(`Error fetching items for order ${order.order_id}:`, itemsError);
        return {
          ...order,
          items: [],
        };
      }
      
      // Calculate total amount
      let total_amount = 0;
      
      const formattedItems = items?.map(item => {
        const product = item.inventory;
        const sqftPerBox = calculateSquareFeet(
          product.tile_width,
          product.tile_height,
          product.tiles_per_box
        );
        
        const itemTotal = item.boxes_sold * sqftPerBox * item.price_per_sqft;
        total_amount += itemTotal;
        
        return {
          item_id: item.item_id,
          order_id: item.order_id,
          product_id: item.product_id,
          boxes_sold: item.boxes_sold,
          price_per_sqft: item.price_per_sqft,
          product_details: product
        };
      }) || [];
      
      return {
        ...order,
        items: formattedItems,
        total_amount
      };
    })
  );
  
  return ordersWithItems;
};

export const getOrder = async (orderId: string): Promise<Order | null> => {
  // Fetch the order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("order_id", orderId)
    .single();
  
  if (orderError) {
    if (orderError.code === "PGRST116") {
      // Order not found
      return null;
    }
    console.error(`Error fetching order ${orderId}:`, orderError);
    throw orderError;
  }
  
  // Fetch the order items
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select(`
      *,
      inventory:product_id(*)
    `)
    .eq("order_id", orderId);
  
  if (itemsError) {
    console.error(`Error fetching items for order ${orderId}:`, itemsError);
    throw itemsError;
  }
  
  // Format the items and calculate total
  let total_amount = 0;
  
  const formattedItems = items?.map(item => {
    const product = item.inventory;
    const sqftPerBox = calculateSquareFeet(
      product.tile_width,
      product.tile_height,
      product.tiles_per_box
    );
    
    const itemTotal = item.boxes_sold * sqftPerBox * item.price_per_sqft;
    total_amount += itemTotal;
    
    return {
      item_id: item.item_id,
      order_id: item.order_id,
      product_id: item.product_id,
      boxes_sold: item.boxes_sold,
      price_per_sqft: item.price_per_sqft,
      product_details: product
    };
  }) || [];
  
  return {
    ...order,
    items: formattedItems,
    total_amount
  };
};

export const addOrder = async (order: Order, items: OrderItem[]): Promise<Order> => {
  // Start a Supabase transaction using stored procedures
  const { data: newOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      client_name: order.client_name,
      client_phone: order.client_phone,
      client_address: order.client_address,
      client_gst: order.client_gst || null,
      vehicle_no: order.vehicle_no || null,
      is_reverse_charge: order.is_reverse_charge || false,
      eway_bill: order.eway_bill || null,
      order_date: order.order_date || new Date().toISOString(),
      hsn_code: order.hsn_code,
      state_code: order.state_code
    })
    .select()
    .single();
  
  if (orderError) {
    console.error("Error creating order:", orderError);
    throw orderError;
  }
  
  // Insert order items
  if (items.length > 0) {
    const orderItems = items.map(item => ({
      order_id: newOrder.order_id,
      product_id: item.product_id,
      boxes_sold: item.boxes_sold,
      price_per_sqft: item.price_per_sqft
    }));
    
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);
    
    if (itemsError) {
      console.error("Error adding order items:", itemsError);
      
      // Try to roll back by deleting the order
      await supabase
        .from("orders")
        .delete()
        .eq("order_id", newOrder.order_id);
      
      throw itemsError;
    }
    
    // Update inventory quantities
    for (const item of items) {
      // Get current inventory
      const { data: inventory, error: inventoryFetchError } = await supabase
        .from("inventory")
        .select("boxes_on_hand")
        .eq("product_id", item.product_id)
        .single();
      
      if (inventoryFetchError) {
        console.error(`Error fetching inventory for product ${item.product_id}:`, inventoryFetchError);
        continue;
      }
      
      // Update inventory
      const newBoxCount = Math.max(0, inventory.boxes_on_hand - item.boxes_sold);
      const { error: inventoryUpdateError } = await supabase
        .from("inventory")
        .update({ boxes_on_hand: newBoxCount })
        .eq("product_id", item.product_id);
      
      if (inventoryUpdateError) {
        console.error(`Error updating inventory for product ${item.product_id}:`, inventoryUpdateError);
      }
    }
  }
  
  return { ...newOrder, items };
};

export const updateOrder = async (id: string, updates: Partial<Order>): Promise<Order> => {
  const { data, error } = await supabase
    .from("orders")
    .update(updates)
    .eq("order_id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Error updating order:", error);
    throw error;
  }
  
  return data;
};

export const deleteOrder = async (id: string): Promise<void> => {
  // First, get the items to restore inventory
  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", id);
  
  if (itemsError) {
    console.error(`Error fetching items for order ${id}:`, itemsError);
    throw itemsError;
  }
  
  // Delete the order (cascade will delete items)
  const { error: deleteError } = await supabase
    .from("orders")
    .delete()
    .eq("order_id", id);
  
  if (deleteError) {
    console.error(`Error deleting order ${id}:`, deleteError);
    throw deleteError;
  }
  
  // Restore inventory quantities
  if (items && items.length > 0) {
    for (const item of items) {
      // Get current inventory
      const { data: inventory, error: inventoryFetchError } = await supabase
        .from("inventory")
        .select("boxes_on_hand")
        .eq("product_id", item.product_id)
        .single();
      
      if (inventoryFetchError) {
        console.error(`Error fetching inventory for product ${item.product_id}:`, inventoryFetchError);
        continue;
      }
      
      // Update inventory
      const newBoxCount = inventory.boxes_on_hand + item.boxes_sold;
      const { error: inventoryUpdateError } = await supabase
        .from("inventory")
        .update({ boxes_on_hand: newBoxCount })
        .eq("product_id", item.product_id);
      
      if (inventoryUpdateError) {
        console.error(`Error updating inventory for product ${item.product_id}:`, inventoryUpdateError);
      }
    }
  }
};

// Utility function to calculate square feet
const calculateSquareFeet = (width: number, height: number, tilesPerBox: number): number => {
  // Convert from millimeters to feet (1 mm = 1/304.8 feet)
  const widthInFeet = width / 304.8;
  const heightInFeet = height / 304.8;
  return widthInFeet * heightInFeet * tilesPerBox;
};
