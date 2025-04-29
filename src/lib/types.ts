
export interface InventoryItem {
  product_id?: number;
  brand: string;
  tile_width: number;
  tile_height: number;
  tiles_per_box: number;
  boxes_on_hand: number;
  price_per_sqft: number;
}

export interface Order {
  order_id?: string;
  client_name: string;
  client_phone: string;
  client_address: string;
  client_gst: string;
  vehicle_no: string;
  is_reverse_charge: boolean;
  eway_bill: string;
  order_date: string;
  hsn_code: string;
  state_code: string;
  items?: OrderItem[];
  total_amount?: number;
}

export interface OrderItem {
  item_id?: number;
  order_id?: string;
  product_id: number;
  product_details?: InventoryItem;
  boxes_sold: number;
  price_per_sqft: number;
}

export interface CartItem extends OrderItem {
  brand: string;
  sqft_per_box: number;
  total_sqft: number;
  total_price: number;
}

export interface DashboardStat {
  title: string;
  value: string | number;
  description: string;
  trend?: number;
  icon: React.ComponentType<any>;
}

export interface User {
  id: number;
  username: string;
  role: string;
  password?: string; // Only used in mock database, excluded from auth context
}

export type UserRole = 'admin' | 'guest';
