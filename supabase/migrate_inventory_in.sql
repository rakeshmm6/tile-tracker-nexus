-- Table for each truck entry
CREATE TABLE IF NOT EXISTS inventory_in (
  id serial PRIMARY KEY,
  truck_number text NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table for products in each truck entry
CREATE TABLE IF NOT EXISTS inventory_in_products (
  id serial PRIMARY KEY,
  inventory_in_id integer REFERENCES inventory_in(id) ON DELETE CASCADE,
  product_id integer REFERENCES inventory(product_id) ON DELETE CASCADE,
  quantity integer NOT NULL
);

-- Function to increment boxes_on_hand
create or replace function increment_boxes_on_hand(product_id_input integer, increment_by integer)
returns void as $$
begin
  update inventory set boxes_on_hand = boxes_on_hand + increment_by where product_id = product_id_input;
end;
$$ language plpgsql; 