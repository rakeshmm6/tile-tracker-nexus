import { supabase } from "../integrations/supabase/client";
import type { Database } from "../integrations/supabase/client";

// Type aliases for easier reference
type InventoryRow = Database["public"]["Tables"]["inventory"]["Row"];
type NewInventory = Database["public"]["Tables"]["inventory"]["Insert"];

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type NewOrder = Database["public"]["Tables"]["orders"]["Insert"];

// --- Inventory CRUD ---
export const getInventory = async (): Promise<InventoryRow[]> => {
  const { data, error } = await supabase
    .from<InventoryRow>("inventory")
    .select("*");
  if (error) throw error;
  return data ?? [];
};

export const addInventoryItem = async (
  item: NewInventory
): Promise<InventoryRow> => {
  const { data, error } = await supabase
    .from<NewInventory>("inventory")
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateInventoryItem = async (
  id: InventoryRow["id"],
  updates: Partial<NewInventory>
): Promise<InventoryRow> => {
  const { data, error } = await supabase
    .from<InventoryRow>("inventory")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteInventoryItem = async (
  id: InventoryRow["id"]
): Promise<void> => {
  const { error } = await supabase
    .from("inventory")
    .delete()
    .eq("id", id);
  if (error) throw error;
};

// --- Orders CRUD ---
export const getOrders = async (): Promise<OrderRow[]> => {
  const { data, error } = await supabase
    .from<OrderRow>("orders")
    .select("*");
  if (error) throw error;
  return data ?? [];
};

export const addOrder = async (
  order: NewOrder
): Promise<OrderRow> => {
  const { data, error } = await supabase
    .from<NewOrder>("orders")
    .insert(order)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateOrder = async (
  id: OrderRow["id"],
  updates: Partial<NewOrder>
): Promise<OrderRow> => {
  const { data, error } = await supabase
    .from<OrderRow>("orders")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteOrder = async (
  id: OrderRow["id"]
): Promise<void> => {
  const { error } = await supabase
    .from("orders")
    .delete()
    .eq("id", id);
  if (error) throw error;
};
