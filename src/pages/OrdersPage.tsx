import React from "react";
import OrderTabs from "@/components/orders/OrderTabs";
import OrderForm from "@/components/OrderForm";
import { Order, OrderItem, InventoryItem } from "@/lib/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useOrders } from "@/hooks/useOrders";
import { supabase } from "@/lib/supabase";
import Layout from "@/components/Layout";
import { toast } from "@/components/ui/sonner";

export default function OrdersPage() {
  const { orders, createOrder, deleteOrder, loading } = useOrders();
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [orderType, setOrderType] = React.useState<'quotation' | 'tax_invoice'>('tax_invoice');
  const [inventory, setInventory] = React.useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = React.useState(true);

  // Fetch inventory data
  React.useEffect(() => {
    async function fetchInventory() {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .order('brand');

        if (error) throw error;
        setInventory(data || []);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      } finally {
        setInventoryLoading(false);
      }
    }

    fetchInventory();
  }, []);

  const handleCreateOrder = (type: 'quotation' | 'tax_invoice') => {
    setOrderType(type);
    setIsCreateModalOpen(true);
  };

  const handleSubmitOrder = async (order: Order, items: OrderItem[]) => {
    try {
      // Validate required fields
      if (!order.client_name || !order.client_phone || !order.client_address) {
        throw new Error("Missing required client information");
      }

      if (!order.hsn_code) {
        throw new Error("Missing HSN code");
      }

      if (items.length === 0) {
        throw new Error("Order must contain at least one item");
      }

      // Log order data for debugging
      console.log("Submitting order:", {
        order: {
          ...order,
          items: items.map(item => ({
            product_id: item.product_id,
            boxes_sold: item.boxes_sold,
            price_per_sqft: item.price_per_sqft
          }))
        }
      });

      await createOrder(order, items);
      setIsCreateModalOpen(false);
      toast.success("Order created successfully");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create order");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <OrderTabs 
          orders={orders} 
          onCreateOrder={handleCreateOrder}
          onDeleteOrder={deleteOrder}
          loading={loading}
        />

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogTitle>
              {orderType === 'quotation' ? 'Create Quotation' : 'Create Tax Invoice'}
            </DialogTitle>
            <OrderForm
              inventory={inventory}
              onSubmit={handleSubmitOrder}
              onCancel={() => setIsCreateModalOpen(false)}
              defaultOrderType={orderType}
              loading={inventoryLoading}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
} 