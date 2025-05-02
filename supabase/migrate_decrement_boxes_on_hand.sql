-- Add a Postgres function to decrement boxes_on_hand atomically
CREATE OR REPLACE FUNCTION decrement_boxes_on_hand(product_id integer, boxes_sold integer)
RETURNS void AS $$
BEGIN
  UPDATE inventory
  SET boxes_on_hand = boxes_on_hand - boxes_sold
  WHERE inventory.product_id = product_id;
END;
$$ LANGUAGE plpgsql; 