import { supabase } from "../../integrations/supabase/client";

// Add a new ledger entry
export const addLedgerEntry = async (entry: { order_id?: string, client_name: string, total_amount: number, products?: any }) => {
  const { data, error } = await supabase
    .from("ledger_entries")
    .insert(entry)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Add a payment to a ledger entry
export const addLedgerPayment = async (ledger_entry_id: number, payment: { payment_type: string, amount: number, payment_date?: string, note?: string }) => {
  const { data, error } = await supabase
    .from("ledger_payments")
    .insert({ ledger_entry_id, ...payment })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Get all ledger entries with payments
export const getLedgerEntries = async () => {
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("*, ledger_payments(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
};

// Delete a ledger entry by ID
export const deleteLedgerEntry = async (id: number) => {
  const { error } = await supabase
    .from("ledger_entries")
    .delete()
    .eq("id", id);
  if (error) throw error;
}; 