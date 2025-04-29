
import React, { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  FileText,
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import { Order } from "@/lib/types";
import { getOrdersWithItems, getInventory, addOrder } from "@/lib/database";
import { formatDate, formatCurrency, generateOrderNumber } from "@/lib/utils";
import OrderForm from "@/components/OrderForm";

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
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
      toast.error("Failed to load order data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (orderData: Order, orderItems: any[]) => {
    try {
      // Generate an order ID if not provided
      if (!orderData.order_id) {
        orderData.order_id = generateOrderNumber();
      }
      
      // Call the addOrder function from database.ts
      const newOrder = await addOrder(orderData, orderItems);

      // Update the orders list immediately without refetching everything
      const updatedOrder = {
        ...newOrder,
        items: orderItems,
        total_amount: orderItems.reduce((total, item) => {
          const inventoryItem = inventory.find(inv => inv.product_id === item.product_id);
          if (inventoryItem) {
            const sqftPerBox = (inventoryItem.tile_width * inventoryItem.tile_height * 
                               inventoryItem.tiles_per_box) / (304.8 * 304.8);
            return total + (sqftPerBox * item.boxes_sold * item.price_per_sqft);
          }
          return total;
        }, 0)
      };
      
      setOrders(prevOrders => [updatedOrder, ...prevOrders]);
      toast.success("Order created successfully");
      setIsFormDialogOpen(false);
      
      // Refetch inventory as it has been updated
      getInventory().then(data => setInventory(data));
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create order");
    }
  };

  // Filter orders based on search query
  const filteredOrders = orders.filter((order) =>
    order.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.client_phone.includes(searchQuery)
  );

  // Calculate total pages
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  
  // Get current items
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Calculate total square feet sold
  const totalSqftSold = filteredOrders.reduce((acc, order) => {
    if (!order.items) return acc;
    
    return acc + order.items.reduce((itemAcc, item) => {
      // Find the corresponding inventory item
      const inventoryItem = inventory.find(invItem => invItem.product_id === item.product_id);
      if (!inventoryItem) return itemAcc;
      
      const sqftPerBox = (inventoryItem.tile_width * inventoryItem.tile_height * inventoryItem.tiles_per_box) / (304.8 * 304.8);
      return itemAcc + (sqftPerBox * item.boxes_sold);
    }, 0);
  }, 0);

  return (
    <Layout>
      <PageHeader 
        title="Orders Management" 
        description="View and manage customer orders"
      >
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <Button onClick={() => setIsFormDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Order
          </Button>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new customer order
              </DialogDescription>
            </DialogHeader>
            <OrderForm 
              inventory={inventory}
              onSubmit={handleCreateOrder}
              onCancel={() => setIsFormDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
        <div className="p-4 flex flex-col md:flex-row gap-4 justify-between border-b">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="text-sm text-gray-500">
            Total Area Sold: <span className="font-medium">{totalSqftSold.toFixed(2)} sqft</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Order ID</th>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3">Client</th>
                <th scope="col" className="px-6 py-3">Phone</th>
                <th scope="col" className="px-6 py-3">Items</th>
                <th scope="col" className="px-6 py-3">Total Amount</th>
                <th scope="col" className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    Loading orders data...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center">
                    {searchQuery ? "No matching orders found" : "No orders found. Create some!"}
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
                    <td className="px-6 py-4">{formatCurrency(order.total_amount || 0)}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Link to={`/orders/${order.order_id}`}>
                          <Button size="sm" variant="outline">
                            <FileText className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-2" />
                          Invoice
                        </Button>
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
    </Layout>
  );
};

export default Orders;
