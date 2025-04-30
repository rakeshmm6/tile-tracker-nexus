
import { supabase } from '@/integrations/supabase/client';
import { User, Order, OrderItem, InventoryItem } from './types';

// Authentication
export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  try {
    // Convert username to email format for standard users
    const email = username.includes('@') ? username : `${username}@tiletracker.com`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error || !data.user) {
      console.error('Authentication error:', error);
      return null;
    }

    // Get user profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, role')
      .eq('id', data.user.id)
      .single();
    
    if (!profile) {
      console.error('Profile not found');
      return null;
    }
    
    return {
      id: parseInt(profile.id, 10),
      username: profile.username,
      role: profile.role,
    };
    
  } catch (error) {
    console.error('Error in authenticateUser:', error);
    return null;
  }
};

// Mock inventory data - preserved for now until we migrate to Supabase
export const inventoryData: InventoryItem[] = [
  {
    product_id: 1,
    brand: "Kajaria",
    tile_width: 600,
    tile_height: 600,
    tiles_per_box: 4,
    boxes_on_hand: 120,
    price_per_sqft: 65
  },
  {
    product_id: 2,
    brand: "Somany",
    tile_width: 300,
    tile_height: 600,
    tiles_per_box: 8,
    boxes_on_hand: 85,
    price_per_sqft: 55
  },
  {
    product_id: 3,
    brand: "Johnson",
    tile_width: 300,
    tile_height: 300,
    tiles_per_box: 12,
    boxes_on_hand: 200,
    price_per_sqft: 45
  },
  {
    product_id: 4,
    brand: "Nitco",
    tile_width: 800,
    tile_height: 800,
    tiles_per_box: 3,
    boxes_on_hand: 60,
    price_per_sqft: 85
  },
  {
    product_id: 5,
    brand: "RAK",
    tile_width: 600,
    tile_height: 1200,
    tiles_per_box: 2,
    boxes_on_hand: 45,
    price_per_sqft: 95
  }
];

// Mock orders data - preserved for now until we migrate to Supabase
export const ordersData: Order[] = [
  {
    order_id: "ORD-2023-001",
    client_name: "Rahul Sharma",
    client_phone: "9876543210",
    client_address: "123 Main St, Mumbai",
    client_gst: "27AADCB2230M1Z3",
    vehicle_no: "MH01AB1234",
    is_reverse_charge: false,
    eway_bill: "E123456789",
    order_date: "2023-05-15",
    hsn_code: "6908",
    state_code: "27",
    items: [
      {
        item_id: 1,
        order_id: "ORD-2023-001",
        product_id: 1,
        boxes_sold: 20,
        price_per_sqft: 65
      },
      {
        item_id: 2,
        order_id: "ORD-2023-001",
        product_id: 3,
        boxes_sold: 15,
        price_per_sqft: 45
      }
    ],
    total_amount: 15600
  },
  {
    order_id: "ORD-2023-002",
    client_name: "Priya Patel",
    client_phone: "8765432109",
    client_address: "456 Park Ave, Delhi",
    client_gst: "07AAACN0724R1Z3",
    vehicle_no: "DL01CD5678",
    is_reverse_charge: true,
    eway_bill: "E987654321",
    order_date: "2023-06-02",
    hsn_code: "6908",
    state_code: "07",
    items: [
      {
        item_id: 3,
        order_id: "ORD-2023-002",
        product_id: 2,
        boxes_sold: 30,
        price_per_sqft: 55
      },
      {
        item_id: 4,
        order_id: "ORD-2023-002",
        product_id: 5,
        boxes_sold: 10,
        price_per_sqft: 95
      }
    ],
    total_amount: 19800
  },
  {
    order_id: "ORD-2023-003",
    client_name: "Amit Singh",
    client_phone: "7654321098",
    client_address: "789 Lake View, Bangalore",
    client_gst: "29AAACR5055K1Z5",
    vehicle_no: "KA01EF9012",
    is_reverse_charge: false,
    eway_bill: "E567891234",
    order_date: "2023-06-20",
    hsn_code: "6908",
    state_code: "29",
    items: [
      {
        item_id: 5,
        order_id: "ORD-2023-003",
        product_id: 4,
        boxes_sold: 15,
        price_per_sqft: 85
      }
    ],
    total_amount: 30600
  }
];

// Implementing all the missing functions that other components need

// Inventory functions
export const getInventory = async (): Promise<InventoryItem[]> => {
  // For now, return mock data. Later we'll migrate this to Supabase
  return inventoryData;
};

export const addInventoryItem = async (item: InventoryItem): Promise<InventoryItem> => {
  console.log('Adding inventory item:', item);
  // Mock implementation - we'll replace with Supabase later
  const newId = Math.max(...inventoryData.map(i => i.product_id || 0)) + 1;
  const newItem: InventoryItem = { 
    ...item, 
    product_id: newId 
  };
  inventoryData.push(newItem);
  return newItem;
};

export const updateInventoryItem = async (item: InventoryItem): Promise<InventoryItem> => {
  console.log('Updating inventory item:', item);
  // Mock implementation - we'll replace with Supabase later
  const index = inventoryData.findIndex(i => i.product_id === item.product_id);
  if (index !== -1) {
    inventoryData[index] = item;
    return item;
  }
  throw new Error('Item not found');
};

export const deleteInventoryItem = async (productId: number): Promise<void> => {
  console.log('Deleting inventory item:', productId);
  // Mock implementation - we'll replace with Supabase later
  const index = inventoryData.findIndex(i => i.product_id === productId);
  if (index !== -1) {
    inventoryData.splice(index, 1);
    return;
  }
  throw new Error('Item not found');
};

// Order functions
export const getOrdersWithItems = async (): Promise<Order[]> => {
  // For now, return mock data. Later we'll migrate this to Supabase
  return ordersData;
};

export const getOrder = async (orderId: string): Promise<Order | null> => {
  // Mock implementation - we'll replace with Supabase later
  const order = ordersData.find(o => o.order_id === orderId);
  return order || null;
};

export const addOrder = async (order: Order, items: OrderItem[]): Promise<Order> => {
  console.log('Adding order:', order, 'with items:', items);
  // Mock implementation - we'll replace with Supabase later
  const newOrder = { ...order, items };
  if (!newOrder.order_id) {
    const lastOrderId = parseInt(ordersData[ordersData.length - 1]?.order_id?.split('-')[2] || '0');
    newOrder.order_id = `ORD-2023-${(lastOrderId + 1).toString().padStart(3, '0')}`;
  }
  ordersData.push(newOrder as any);
  return newOrder;
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  console.log('Deleting order:', orderId);
  // Mock implementation - we'll replace with Supabase later
  const index = ordersData.findIndex(o => o.order_id === orderId);
  if (index !== -1) {
    ordersData.splice(index, 1);
    return;
  }
  throw new Error('Order not found');
};

// Dashboard
export const getDashboardStats = async () => {
  // Calculate stats from mock data for now
  let totalInventoryValue = 0;
  let totalBoxes = 0;

  for (const item of inventoryData) {
    // Calculate square feet per box
    const sqftPerBox = (item.tile_width * item.tile_height * item.tiles_per_box) / (304.8 * 304.8);
    // Calculate box value
    const boxValue = sqftPerBox * item.price_per_sqft;
    // Add to total
    totalInventoryValue += boxValue * item.boxes_on_hand;
    totalBoxes += item.boxes_on_hand;
  }

  const totalSales = ordersData.reduce((sum, order) => sum + (order.total_amount || 0), 0);

  return {
    inventory_value: totalInventoryValue,
    boxes_in_stock: totalBoxes,
    order_count: ordersData.length,
    sales_revenue: totalSales
  };
};

// Mock users data - now only used for reference
export const usersData = [
  {
    id: 1,
    username: "admin",
    password: "admin123",
    role: "admin"
  },
  {
    id: 2,
    username: "guest",
    password: "guest123",
    role: "guest"
  }
];
