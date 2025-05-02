import { useState, useEffect } from 'react';
import { Order, OrderItem } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .order('order_date', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (order: Order, items: OrderItem[]) => {
    try {
      setLoading(true);
      // First create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          client_name: order.client_name,
          client_phone: order.client_phone,
          client_address: order.client_address,
          client_state: order.client_state,
          client_gst: order.client_gst,
          vehicle_no: order.vehicle_no,
          is_reverse_charge: order.is_reverse_charge,
          eway_bill: order.eway_bill,
          order_date: order.order_date,
          hsn_code: order.hsn_code,
          state_code: order.state_code,
          order_type: order.order_type,
          gst_type: order.gst_type,
          subtotal: order.subtotal,
          igst_rate: order.igst_rate,
          igst_amount: order.igst_amount,
          cgst_rate: order.cgst_rate,
          cgst_amount: order.cgst_amount,
          sgst_rate: order.sgst_rate,
          sgst_amount: order.sgst_amount,
          total_amount: order.total_amount
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Then create the order items
      const orderItems = items.map(item => ({
        order_id: orderData.order_id,
        product_id: item.product_id,
        boxes_sold: item.boxes_sold,
        price_per_sqft: item.price_per_sqft,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Atomically decrement inventory for each item, only for tax_invoice
      if (order.order_type === 'tax_invoice') {
        for (const item of items) {
          const { error: rpcError } = await supabase.rpc('decrement_boxes_on_hand', {
            p_product_id: item.product_id,
            p_boxes_sold: item.boxes_sold
          });
          if (rpcError) throw rpcError;
        }
      }

      // Calculate total amount
      const total_amount = (order.subtotal || 0) + 
                         (order.igst_amount || 0) + 
                         (order.cgst_amount || 0) + 
                         (order.sgst_amount || 0);

      // Update orders list with calculated total
      const newOrder = {
        ...orderData,
        items,
        total_amount
      };
      setOrders(prev => [newOrder, ...prev]);
      toast.success('Order created successfully');

    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId: string) => {
    try {
      setLoading(true);
      
      // First delete the order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // Then delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('order_id', orderId);

      if (orderError) throw orderError;

      // Update the local state
      setOrders(prev => prev.filter(order => order.order_id !== orderId));
      toast.success('Order deleted successfully');

    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    orders,
    loading,
    createOrder,
    deleteOrder,
  };
} 