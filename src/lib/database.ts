import { InventoryItem, Order, OrderItem } from "./types";

// Mock database functions to simulate API calls
// In a real application, these would be replaced with actual API calls

// Mock data storage
let inventoryData: InventoryItem[] = [
  {
    product_id: 1,
    brand: "Johnson Tiles",
    tile_width: 600,
    tile_height: 600,
    tiles_per_box: 4,
    boxes_on_hand: 120,
    price_per_sqft: 85,
  },
  {
    product_id: 2,
    brand: "Kajaria",
    tile_width: 300,
    tile_height: 600,
    tiles_per_box: 8,
    boxes_on_hand: 85,
    price_per_sqft: 65,
  },
  {
    product_id: 3,
    brand: "Somany",
    tile_width: 800,
    tile_height: 800,
    tiles_per_box: 3,
    boxes_on_hand: 42,
    price_per_sqft: 120,
  },
  {
    product_id: 4,
    brand: "RAK Ceramics",
    tile_width: 400,
    tile_height: 400,
    tiles_per_box: 10,
    boxes_on_hand: 75,
    price_per_sqft: 72,
  },
  {
    product_id: 5,
    brand: "Orient Bell",
    tile_width: 1200,
    tile_height: 600,
    tiles_per_box: 2,
    boxes_on_hand: 30,
    price_per_sqft: 145,
  },
];

let ordersData: Order[] = [
  {
    order_id: "ORD-12345-001",
    client_name: "Sharma Construction",
    client_phone: "9876543210",
    client_address: "123, MG Road, Bangalore",
    client_gst: "29AABCS1234Z1ZA",
    vehicle_no: "KA01AB1234",
    is_reverse_charge: false,
    eway_bill: "E123456789",
    order_date: "2023-06-15",
    hsn_code: "6908",
    state_code: "29",
  }
];

let orderItemsData: OrderItem[] = [
  {
    item_id: 1,
    order_id: "ORD-12345-001",
    product_id: 1,
    boxes_sold: 15,
    price_per_sqft: 85,
  },
  {
    item_id: 2,
    order_id: "ORD-12345-001",
    product_id: 3,
    boxes_sold: 8,
    price_per_sqft: 120,
  }
];

// Mock user data for authentication
export const usersData = [
  {
    id: 1,
    username: "admin",
    password: "admin123", // In a real app, this would be hashed
    role: "admin"
  },
  {
    id: 2,
    username: "guest",
    password: "guest123", // In a real app, this would be hashed
    role: "guest"
  }
];

// Inventory operations
export const getInventory = async (): Promise<InventoryItem[]> => {
  return [...inventoryData];
};

export const getInventoryItem = async (productId: number): Promise<InventoryItem | undefined> => {
  return inventoryData.find(item => item.product_id === productId);
};

export const addInventoryItem = async (item: InventoryItem): Promise<InventoryItem> => {
  const newItem = {
    ...item,
    product_id: Math.max(0, ...inventoryData.map(i => i.product_id || 0)) + 1,
  };
  inventoryData.push(newItem);
  return newItem;
};

export const updateInventoryItem = async (item: InventoryItem): Promise<InventoryItem> => {
  const index = inventoryData.findIndex(i => i.product_id === item.product_id);
  if (index >= 0) {
    inventoryData[index] = item;
    return item;
  }
  throw new Error("Item not found");
};

export const deleteInventoryItem = async (productId: number): Promise<void> => {
  inventoryData = inventoryData.filter(item => item.product_id !== productId);
};

export const decrementInventory = async (productId: number, quantity: number): Promise<void> => {
  const index = inventoryData.findIndex(item => item.product_id === productId);
  if (index >= 0) {
    inventoryData[index].boxes_on_hand -= quantity;
    if (inventoryData[index].boxes_on_hand < 0) {
      inventoryData[index].boxes_on_hand = 0;
    }
  }
};

export const incrementInventory = async (productId: number, quantity: number): Promise<void> => {
  const index = inventoryData.findIndex(item => item.product_id === productId);
  if (index >= 0) {
    inventoryData[index].boxes_on_hand += quantity;
  }
};

// Order operations
export const getOrders = async (): Promise<Order[]> => {
  return [...ordersData];
};

export const getOrdersWithItems = async (): Promise<Order[]> => {
  return ordersData.map(order => {
    const items = orderItemsData.filter(item => item.order_id === order.order_id);
    
    // Calculate the total amount
    let totalAmount = 0;
    for (const item of items) {
      const inventoryItem = inventoryData.find(inv => inv.product_id === item.product_id);
      if (inventoryItem) {
        const sqftPerBox = (inventoryItem.tile_width * inventoryItem.tile_height * inventoryItem.tiles_per_box) / (304.8 * 304.8);
        totalAmount += item.boxes_sold * sqftPerBox * item.price_per_sqft;
      }
    }
    
    return {
      ...order,
      items,
      total_amount: totalAmount
    };
  });
};

export const getOrder = async (orderId: string): Promise<Order | undefined> => {
  const order = ordersData.find(order => order.order_id === orderId);
  if (order) {
    const items = orderItemsData.filter(item => item.order_id === orderId).map(item => {
      // Enhance items with product details
      const product = inventoryData.find(p => p.product_id === item.product_id);
      return {
        ...item,
        product_details: product
      };
    });
    return { ...order, items };
  }
  return undefined;
};

export const addOrder = async (order: Order, items: OrderItem[]): Promise<Order> => {
  const newOrder = {
    ...order,
    order_id: order.order_id || `ORD-${Date.now()}`
  };
  
  ordersData.push(newOrder);
  
  // Add order items
  for (const item of items) {
    const newItem = {
      ...item,
      item_id: Math.max(0, ...orderItemsData.map(i => i.item_id || 0)) + 1,
      order_id: newOrder.order_id
    };
    orderItemsData.push(newItem);
    
    // Decrement inventory
    await decrementInventory(item.product_id, item.boxes_sold);
  }
  
  return newOrder;
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  // Get order items before deletion to restore inventory
  const orderItems = orderItemsData.filter(item => item.order_id === orderId);
  
  // Return inventory items back to stock
  for (const item of orderItems) {
    await incrementInventory(item.product_id, item.boxes_sold);
  }
  
  // Delete order items
  orderItemsData = orderItemsData.filter(item => item.order_id !== orderId);
  
  // Delete order
  ordersData = ordersData.filter(order => order.order_id !== orderId);
};

// Dashboard statistics
export const getDashboardStats = async (): Promise<any> => {
  const inventory = await getInventory();
  const orders = await getOrdersWithItems();
  
  // Total inventory value
  let totalInventoryValue = 0;
  let totalBoxes = 0;
  
  for (const item of inventory) {
    const sqftPerBox = (item.tile_width * item.tile_height * item.tiles_per_box) / (304.8 * 304.8);
    totalInventoryValue += item.boxes_on_hand * sqftPerBox * item.price_per_sqft;
    totalBoxes += item.boxes_on_hand;
  }
  
  // Total sales revenue
  let totalSalesRevenue = 0;
  for (const order of orders) {
    if (order.total_amount) {
      totalSalesRevenue += order.total_amount;
    }
  }
  
  return {
    inventory_value: totalInventoryValue,
    boxes_in_stock: totalBoxes,
    order_count: orders.length,
    sales_revenue: totalSalesRevenue
  };
};

// Authentication
export const authenticateUser = async (username: string, password: string): Promise<{id: number, username: string, role: string} | null> => {
  const user = usersData.find(u => u.username === username && u.password === password);
  if (user) {
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
};
