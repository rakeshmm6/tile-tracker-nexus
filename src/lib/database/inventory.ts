
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
