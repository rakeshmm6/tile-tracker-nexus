// Inventory-related database operations
import { supabase } from "../../integrations/supabase/client";
import type { InventoryItem } from "../types";

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

// Add a new inventory in entry and update inventory quantities
export const addInventoryInEntry = async (truckNumber: string, date: string, products: { product_id: number, quantity: number }[]) => {
  const { data: entry, error: entryError } = await supabase
    .from("inventory_in")
    .insert({ truck_number: truckNumber, date })
    .select()
    .single();
  if (entryError) throw entryError;

  // Insert products
  const productsToInsert = products.map(p => ({
    inventory_in_id: entry.id,
    product_id: p.product_id,
    quantity: p.quantity,
  }));
  const { error: prodError } = await supabase
    .from("inventory_in_products")
    .insert(productsToInsert);
  if (prodError) throw prodError;

  // Update inventory quantities
  for (const p of products) {
    await supabase.rpc('increment_boxes_on_hand', { product_id_input: p.product_id, increment_by: p.quantity });
  }
  return entry;
};

// Fetch all inventory in entries with products and product details
export const getInventoryInHistory = async () => {
  const { data, error } = await supabase
    .from("inventory_in")
    .select("*, inventory_in_products(*, inventory:product_id(*))")
    .order("date", { ascending: false });
  if (error) throw error;
  return data;
};
