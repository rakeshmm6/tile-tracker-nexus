import { useState, useEffect } from "react";
import { Order, OrderItem } from "@/lib/types";
import { getOrdersWithItems, deleteOrder, addOrder, getInventory } from "@/lib/database";
import { toast } from "@/components/ui/sonner";

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<"date" | "client" | "amount">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersData, inventoryData] = await Promise.all([
        getOrdersWithItems(),
        getInventory()
      ]);
      setOrders(ordersData);
      setInventory(inventoryData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrder = async (order: Order, items: OrderItem[]) => {
    try {
      console.log("Starting order creation in useOrders:", { order, items });
      
      // Validate order data
      if (!order.client_state) {
        throw new Error("Client state is required");
      }
      
      // Add order type and GST type if not present
      const enhancedOrder = {
        ...order,
        order_type: order.order_type || 'tax_invoice',
        gst_type: order.client_state === 'Maharashtra' ? 'cgst_sgst' : 'igst'
      };
      
      console.log("Calling addOrder with:", JSON.stringify(enhancedOrder, null, 2));
      const newOrder = await addOrder(enhancedOrder, items);
      console.log("Order created successfully:", newOrder);
      
      toast.success("Order created successfully");
      
      // Add the new order to the state directly instead of refetching
      const enhancedOrderWithItems = { 
        ...newOrder, 
        items, 
        total_amount: items.reduce((sum, item) => {
          const sqftPerBox = (item.product_details?.tile_width || 0) * 
                            (item.product_details?.tile_height || 0) * 
                            (item.product_details?.tiles_per_box || 0) / 
                            (304.8 * 304.8);
          return sum + (item.boxes_sold * sqftPerBox * item.price_per_sqft);
        }, 0)
      };
      
      setOrders(prev => [enhancedOrderWithItems, ...prev]);
      
      // Update inventory data
      await fetchData();
    } catch (error) {
      console.error("Detailed error in handleAddOrder:", error);
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      } else if (typeof error === 'object' && error !== null) {
        console.error("Error details:", JSON.stringify(error, null, 2));
      }
      toast.error(error instanceof Error ? error.message : "Failed to create order. Check console for details.");
      throw error; // Re-throw to be caught by the form handler
    }
  };

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    try {
      await deleteOrder(orderToDelete);
      toast.success("Order deleted successfully");
      setOrders(prev => prev.filter(order => order.order_id !== orderToDelete));
      
      // Update inventory data after deleting an order
      await fetchData();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    } finally {
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
    }
  };

  const confirmDeleteOrder = (orderId: string) => {
    setOrderToDelete(orderId);
    setIsDeleteDialogOpen(true);
  };

  const handleSort = (field: "date" | "client" | "amount") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort orders
  const filteredOrders = orders
    .filter((order) => 
      order.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_id?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const multiplier = sortDirection === "asc" ? 1 : -1;
      
      if (sortField === "date") {
        return multiplier * (new Date(a.order_date).getTime() - new Date(b.order_date).getTime());
      } else if (sortField === "client") {
        return multiplier * a.client_name.localeCompare(b.client_name);
      } else if (sortField === "amount") {
        const aAmount = a.total_amount || 0;
        const bAmount = b.total_amount || 0;
        return multiplier * (aAmount - bAmount);
      }
      
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return {
    orders: filteredOrders,
    currentItems,
    inventory,
    loading,
    searchQuery,
    setSearchQuery,
    handleAddOrder,
    handleDeleteOrder,
    confirmDeleteOrder,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    orderToDelete,
    handleSort,
    sortField,
    sortDirection,
    currentPage,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,
    paginate,
    itemsPerPage
  };
}
