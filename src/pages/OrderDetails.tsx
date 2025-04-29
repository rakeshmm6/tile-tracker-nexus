
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Download, ArrowLeft, Printer } from "lucide-react";
import Layout from "@/components/Layout";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { Order, OrderItem } from "@/lib/types";
import { getOrder, getInventory } from "@/lib/database";
import { formatDate, formatCurrency, calculateSquareFeet, calculateTaxBreakdown } from "@/lib/utils";
import { cn } from "@/lib/utils";

const OrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [inventoryMap, setInventoryMap] = useState<Record<number, any>>({});

  useEffect(() => {
    fetchOrderData();
  }, [orderId]);

  const fetchOrderData = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      
      // Fetch order and inventory data
      const [orderData, inventoryData] = await Promise.all([
        getOrder(orderId),
        getInventory()
      ]);
      
      if (!orderData) {
        toast.error("Order not found");
        return;
      }
      
      // Create a map of inventory items for easy lookup
      const invMap = inventoryData.reduce((acc, item) => {
        if (item.product_id) {
          acc[item.product_id] = item;
        }
        return acc;
      }, {});
      
      setOrder(orderData);
      setInventoryMap(invMap);
    } catch (error) {
      console.error("Error fetching order data:", error);
      toast.error("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = () => {
    toast("Generating invoice...", {
      description: "Your invoice will be downloaded shortly.",
    });
    
    // In a real application, we'd make an API call here to generate the PDF
    setTimeout(() => {
      toast.success("Invoice downloaded successfully");
    }, 2000);
  };

  const printInvoice = () => {
    window.print();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-gray-500">Loading order details...</div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
          <p className="text-gray-500 mb-6">The order you're looking for doesn't exist or has been removed.</p>
          <Link to="/orders">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  // Calculate total items, boxes, and cost
  let totalBoxes = 0;
  let totalSqft = 0;
  let subtotal = 0;

  const enhancedItems = (order.items || []).map(item => {
    const product = inventoryMap[item.product_id];
    if (!product) return item;
    
    const sqftPerBox = calculateSquareFeet(
      product.tile_width,
      product.tile_height,
      product.tiles_per_box
    );
    
    const totalItemSqft = sqftPerBox * item.boxes_sold;
    const totalItemPrice = totalItemSqft * item.price_per_sqft;
    
    totalBoxes += item.boxes_sold;
    totalSqft += totalItemSqft;
    subtotal += totalItemPrice;
    
    return {
      ...item,
      brand: product.brand,
      size: `${product.tile_width}x${product.tile_height}`,
      sqftPerBox,
      totalSqft: totalItemSqft,
      totalPrice: totalItemPrice
    };
  });
  
  // Calculate tax based on state code and reverse charge
  const taxes = calculateTaxBreakdown(
    subtotal, 
    order.state_code, 
    order.is_reverse_charge
  );
  
  // Calculate grand total
  const grandTotal = taxes.totalAmount;

  return (
    <Layout>
      <PageHeader 
        title="Order Details" 
        description={`Order ${order.order_id} - ${formatDate(order.order_date)}`}
      >
        <div className="flex space-x-3">
          <Link to="/orders">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <Button variant="outline" onClick={printInvoice}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={downloadInvoice}>
            <Download className="h-4 w-4 mr-2" />
            Download Invoice
          </Button>
        </div>
      </PageHeader>

      <div className="bg-white shadow-sm rounded-lg border overflow-hidden mb-6">
        <div className="grid md:grid-cols-2 gap-6 p-6">
          <div>
            <h3 className="font-semibold text-lg mb-4">Order Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Order ID:</span>
                <span className="font-medium">{order.order_id}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Date:</span>
                <span>{formatDate(order.order_date)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">HSN Code:</span>
                <span>{order.hsn_code}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">E-Way Bill:</span>
                <span>{order.eway_bill || "N/A"}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Vehicle No:</span>
                <span>{order.vehicle_no || "N/A"}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-gray-500">Reverse Charge:</span>
                <span>{order.is_reverse_charge ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Client Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Name:</span>
                <span className="font-medium">{order.client_name}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Phone:</span>
                <span>{order.client_phone}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Address:</span>
                <span className="text-right">{order.client_address}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">GST Number:</span>
                <span>{order.client_gst || "N/A"}</span>
              </div>
              <div className="flex justify-between pb-2">
                <span className="text-gray-500">State Code:</span>
                <span>{order.state_code}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
        <h3 className="font-semibold text-lg p-6 pb-4">Order Items</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Product</th>
                <th scope="col" className="px-6 py-3">Size (mm)</th>
                <th scope="col" className="px-6 py-3">Boxes</th>
                <th scope="col" className="px-6 py-3">Sqft/Box</th>
                <th scope="col" className="px-6 py-3">Total Sqft</th>
                <th scope="col" className="px-6 py-3">Price/Sqft</th>
                <th scope="col" className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {enhancedItems.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="px-6 py-4 font-medium">{item.brand || `Product ${item.product_id}`}</td>
                  <td className="px-6 py-4">{item.size || "N/A"}</td>
                  <td className="px-6 py-4">{item.boxes_sold}</td>
                  <td className="px-6 py-4">{item.sqftPerBox?.toFixed(2) || "N/A"}</td>
                  <td className="px-6 py-4">{item.totalSqft?.toFixed(2) || "N/A"}</td>
                  <td className="px-6 py-4">₹{item.price_per_sqft}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(item.totalPrice || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 border-t">
          <div className="ml-auto md:w-1/2 lg:w-1/3 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            
            <div className={cn("flex justify-between", taxes.cgst === 0 && taxes.sgst === 0 && "hidden")}>
              <span className="text-gray-600">CGST (9%):</span>
              <span>{formatCurrency(taxes.cgst)}</span>
            </div>
            
            <div className={cn("flex justify-between", taxes.cgst === 0 && taxes.sgst === 0 && "hidden")}>
              <span className="text-gray-600">SGST (9%):</span>
              <span>{formatCurrency(taxes.sgst)}</span>
            </div>
            
            <div className={cn("flex justify-between", taxes.igst === 0 && "hidden")}>
              <span className="text-gray-600">IGST (18%):</span>
              <span>{formatCurrency(taxes.igst)}</span>
            </div>
            
            <div className={cn("flex justify-between", order.is_reverse_charge && "hidden")}>
              <span className="text-gray-600">Total Tax:</span>
              <span>{formatCurrency(taxes.totalTax)}</span>
            </div>
            
            <div className={cn("flex justify-between", !order.is_reverse_charge && "hidden")}>
              <span className="text-gray-600 italic">Reverse Charge Applicable</span>
            </div>
            
            <div className="flex justify-between pt-3 border-t font-semibold">
              <span>Total Amount:</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Total Boxes:</span>
              <span>{totalBoxes}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Total Area:</span>
              <span>{totalSqft.toFixed(2)} sq.ft.</span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetails;
