// Order-related database operations
import { supabase } from "../../integrations/supabase/client";
import { Order, OrderItem, InventoryItem } from "../types";
import { calculateSquareFeet } from "./utils";

// Database response types
interface DatabaseOrder {
  order_id: string;
  client_name: string;
  client_phone: string;
  client_address: string;
  client_state: string;
  client_gst: string | null;
  vehicle_no: string | null;
  is_reverse_charge: boolean;
  eway_bill: string | null;
  order_date: string;
  hsn_code: string;
  state_code: string;
  order_type: 'quotation' | 'tax_invoice';
  gst_type: 'none' | 'igst' | 'cgst_sgst';
  subtotal: number;
  igst_rate: number;
  igst_amount: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  total_amount: number;
}

interface DatabaseOrderItem {
  item_id: number;
  order_id: string;
  product_id: number;
  boxes_sold: number;
  price_per_sqft: number;
  inventory: InventoryItem;
}

const mapDatabaseOrderToOrder = (dbOrder: DatabaseOrder): Order => {
  return {
    ...dbOrder,
    order_type: dbOrder.order_type || 'tax_invoice',
    client_state: dbOrder.client_state || '',
    gst_type: dbOrder.gst_type || 'none'
  };
};

const mapDatabaseOrderItemToOrderItem = (dbItem: DatabaseOrderItem): OrderItem => {
  return {
    item_id: dbItem.item_id,
    order_id: dbItem.order_id,
    product_id: dbItem.product_id,
    boxes_sold: dbItem.boxes_sold,
    price_per_sqft: dbItem.price_per_sqft,
    product_details: dbItem.inventory
  };
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
  
  return (data as DatabaseOrder[] || []).map(mapDatabaseOrderToOrder);
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
    (orders as DatabaseOrder[]).map(async (order) => {
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          *,
          inventory:product_id(*)
        `)
        .eq("order_id", order.order_id);
      
      if (itemsError) {
        console.error(`Error fetching items for order ${order.order_id}:`, itemsError);
        return mapDatabaseOrderToOrder(order);
      }
      
      // Calculate total amount
      let total_amount = 0;
      
      const formattedItems = (items as DatabaseOrderItem[] || []).map(item => {
        const product = item.inventory;
        const sqftPerBox = calculateSquareFeet(
          product.tile_width,
          product.tile_height,
          product.tiles_per_box
        );
        
        const itemTotal = item.boxes_sold * sqftPerBox * item.price_per_sqft;
        total_amount += itemTotal;
        
        return mapDatabaseOrderItemToOrderItem(item);
      });
      
      return {
        ...mapDatabaseOrderToOrder(order),
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
  // Create the database order object with total_amount
  const dbOrderData = {
    client_name: order.client_name,
    client_phone: order.client_phone,
    client_address: order.client_address,
    client_state: order.client_state,
    client_gst: order.client_gst || null,
    vehicle_no: order.vehicle_no || null,
    is_reverse_charge: order.is_reverse_charge || false,
    eway_bill: order.eway_bill || null,
    order_date: order.order_date,
    hsn_code: order.hsn_code,
    state_code: order.state_code,
    order_type: order.order_type,
    gst_type: order.gst_type,
    subtotal: order.subtotal,
    igst_rate: order.gst_type === 'igst' ? 18 : 0,
    igst_amount: order.igst_amount || 0,
    cgst_rate: order.gst_type === 'cgst_sgst' ? 9 : 0,
    cgst_amount: order.cgst_amount || 0,
    sgst_rate: order.gst_type === 'cgst_sgst' ? 9 : 0,
    sgst_amount: order.sgst_amount || 0,
    total_amount: order.subtotal + (order.igst_amount || 0) + (order.cgst_amount || 0) + (order.sgst_amount || 0)
  };

  console.log("Starting database addOrder with payload:", JSON.stringify({
    order: dbOrderData,
    items
  }, null, 2));
  
  try {
    // First, insert the order
    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert(dbOrderData)
      .select()
      .single();
    
    if (orderError) {
      console.error("Database error creating order:", {
        error: orderError,
        code: orderError.code,
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint
      });
      throw orderError;
    }

    console.log("Order created successfully:", newOrder);
    
    // Insert order items
    if (items.length > 0) {
      console.log("Adding order items:", items);
      const orderItems = items.map(item => ({
        order_id: (newOrder as DatabaseOrder).order_id,
        product_id: item.product_id,
        boxes_sold: item.boxes_sold,
        price_per_sqft: item.price_per_sqft
      }));
      
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);
      
      if (itemsError) {
        console.error("Database error adding order items:", {
          error: itemsError,
          code: itemsError.code,
          message: itemsError.message,
          details: itemsError.details,
          hint: itemsError.hint
        });
        
        // Try to roll back by deleting the order
        console.log("Attempting to roll back order creation...");
        await supabase
          .from("orders")
          .delete()
          .eq("order_id", (newOrder as DatabaseOrder).order_id);
        
        throw itemsError;
      }
      
      console.log("Order items added successfully");
    }
    
    // Calculate total amount from GST components and subtotal
    const dbOrder = newOrder as DatabaseOrder;
    const total_amount = (dbOrder.subtotal || 0) + 
                        (dbOrder.igst_amount || 0) + 
                        (dbOrder.cgst_amount || 0) + 
                        (dbOrder.sgst_amount || 0);
    
    // Return the complete order object with calculated total_amount
    return {
      ...mapDatabaseOrderToOrder(dbOrder),
      items: items,
      total_amount: total_amount
    };
  } catch (error) {
    console.error("Detailed database error:", error);
    if (error instanceof Error) {
      console.error("Database error name:", error.name);
      console.error("Database error message:", error.message);
      console.error("Database error stack:", error.stack);
    } else if (typeof error === 'object' && error !== null) {
      console.error("Database error details:", JSON.stringify(error, null, 2));
    }
    throw error;
  }
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
