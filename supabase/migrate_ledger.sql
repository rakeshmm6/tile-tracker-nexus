-- Ledger entry for each sale/order
CREATE TABLE IF NOT EXISTS ledger_entries (
  id serial PRIMARY KEY,
  order_id text,
  client_name text,
  total_amount numeric NOT NULL,
  products jsonb,
  created_at timestamptz DEFAULT now()
);

-- Payments for each ledger entry
CREATE TABLE IF NOT EXISTS ledger_payments (
  id serial PRIMARY KEY,
  ledger_entry_id integer REFERENCES ledger_entries(id) ON DELETE CASCADE,
  payment_type text NOT NULL,
  amount numeric NOT NULL,
  payment_date date DEFAULT CURRENT_DATE,
  note text
); 