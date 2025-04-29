
import React, { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  FileText, 
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/sonner";
import OrderForm from "@/components/OrderForm";
import { getOrdersWithItems, deleteOrder, addOrder, getInventory } from "@/lib/database";
import { Order, OrderItem, InventoryItem } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<"date" | "client" | "amount">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const { isAdmin } = useAuth();
  
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
      const newOrder = await addOrder(order, items);
      toast.success("Order created successfully");
      
      // Add the new order to the state directly instead of refetching
      const enhancedOrder = { 
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
      
      setOrders(prev => [enhancedOrder, ...prev]);
      setIsDialogOpen(false);
      
      // Update inventory data
      await fetchData();
    } catch (error) {
      console.error("Error adding order:", error);
      toast.error("Failed to create order");
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

  return (
    <Layout>
      <PageHeader 
        title="Order Management" 
        description="Create and manage customer orders"
      >
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <OrderForm 
              inventory={inventory} 
              onSubmit={handleAddOrder} 
              onCancel={() => setIsDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
        <div className="p-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Order ID</th>
                <th 
                  scope="col" 
                  className="px-6 py-3 cursor-pointer" 
                  onClick={() => handleSort("date")}
                >
                  <div className="flex items-center">
                    Date
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 cursor-pointer"
                  onClick={() => handleSort("client")}
                >
                  <div className="flex items-center">
                    Client
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3">Phone</th>
                <th scope="col" className="px-6 py-3">Items</th>
                <th 
                  scope="col" 
                  className="px-6 py-3 cursor-pointer"
                  onClick={() => handleSort("amount")}
                >
                  <div className="flex items-center">
                    Amount
                    <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    Loading order data...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    {searchQuery ? "No matching orders found" : "No orders found. Create one!"}
                  </td>
                </tr>
              ) : (
                currentItems.map((order) => (
                  <tr key={order.order_id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{order.order_id}</td>
                    <td className="px-6 py-4">{formatDate(order.order_date)}</td>
                    <td className="px-6 py-4">{order.client_name}</td>
                    <td className="px-6 py-4">{order.client_phone}</td>
                    <td className="px-6 py-4">{order.items?.length || 0}</td>
                    <td className="px-6 py-4">
                      {order.total_amount ? formatCurrency(order.total_amount) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          asChild
                        >
                          <Link to={`/orders/${order.order_id}`}>
                            <FileText className="h-4 w-4" />
                          </Link>
                        </Button>
                        {isAdmin() && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => confirmDeleteOrder(order.order_id!)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t">
            <div className="text-sm text-gray-500">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} orders
            </div>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => paginate(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={i}
                    size="sm"
                    variant={currentPage === pageNum ? "default" : "outline"}
                    onClick={() => paginate(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                size="sm"
                variant="outline"
                onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected order and return all items to inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrder} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default Orders;
