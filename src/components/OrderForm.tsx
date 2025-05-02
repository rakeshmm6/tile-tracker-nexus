import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { formatCurrency } from "@/lib/utils";
import { CartItem, InventoryItem, Order, OrderItem } from "@/lib/types";
import { calculateSquareFeet } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { X } from "lucide-react";

interface OrderFormProps {
  inventory: InventoryItem[];
  onSubmit: (order: Order, items: OrderItem[]) => void;
  onCancel: () => void;
  defaultOrderType?: 'quotation' | 'tax_invoice';
  loading?: boolean;
}

export default function OrderForm({ 
  inventory, 
  onSubmit, 
  onCancel,
  defaultOrderType = 'tax_invoice',
  loading = false
}: OrderFormProps) {
  const [orderData, setOrderData] = React.useState<Order>({
    client_name: "",
    client_phone: "",
    client_address: "",
    client_state: "Maharashtra", // Default state
    client_gst: "",
    vehicle_no: "",
    is_reverse_charge: false,
    eway_bill: "",
    order_date: new Date().toISOString().split("T")[0],
    hsn_code: "6908", // Default HSN code for tiles
    state_code: "",
    order_type: defaultOrderType,
    gst_type: defaultOrderType === 'quotation' ? 'none' : 'cgst_sgst', // Default to CGST+SGST for Maharashtra
  });

  const [currentItem, setCurrentItem] = React.useState<{
    product_id: number;
    boxes_sold: number;
    price_per_box?: number;
  }>({
    product_id: 0,
    boxes_sold: 1,
    price_per_box: undefined,
  });

  const [cart, setCart] = React.useState<CartItem[]>([]);

  const handleOrderChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setOrderData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setOrderData((prev) => ({
      ...prev,
      is_reverse_charge: checked,
    }));
  };

  const handleItemChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCurrentItem((prev) => ({
      ...prev,
      [name]: name === "product_id" ? Number(value) : Number(value),
    }));
  };

  const handleProductSelect = (value: string) => {
    setCurrentItem((prev) => ({
      ...prev,
      product_id: Number(value),
    }));
  };

  const addToCart = () => {
    const product = inventory.find(
      (item) => item.product_id === currentItem.product_id
    );

    if (!product) {
      toast.error("Please select a product");
      return;
    }

    if (currentItem.boxes_sold <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    if (currentItem.boxes_sold > product.boxes_on_hand) {
      toast.error(`Only ${product.boxes_on_hand} boxes available in stock`);
      return;
    }

    // Calculate square feet per box
    const sqftPerBox = calculateSquareFeet(
      product.tile_width,
      product.tile_height,
      product.tiles_per_box
    );

    // Calculate total square feet
    const totalSqft = sqftPerBox * currentItem.boxes_sold;

    // Calculate price per sqft based on price per box if provided
    const effectivePricePerSqft = currentItem.price_per_box 
      ? currentItem.price_per_box / sqftPerBox 
      : product.price_per_sqft;

    // Calculate total price
    const totalPrice = totalSqft * effectivePricePerSqft;

    const cartItem: CartItem = {
      product_id: product.product_id!,
      brand: product.brand,
      boxes_sold: currentItem.boxes_sold,
      price_per_sqft: effectivePricePerSqft,
      sqft_per_box: sqftPerBox,
      total_sqft: totalSqft,
      total_price: totalPrice,
    };

    // Check if product already exists in cart
    const existingItemIndex = cart.findIndex(
      (item) => item.product_id === cartItem.product_id
    );

    if (existingItemIndex >= 0) {
      // Update quantity if product already in cart
      const updatedCart = [...cart];
      const existingItem = updatedCart[existingItemIndex];
      
      // Check if adding would exceed stock
      const newQuantity = existingItem.boxes_sold + cartItem.boxes_sold;
      if (newQuantity > product.boxes_on_hand) {
        toast.error(`Cannot add more boxes than available in stock (${product.boxes_on_hand})`);
        return;
      }
      
      updatedCart[existingItemIndex] = {
        ...existingItem,
        boxes_sold: newQuantity,
        total_sqft: sqftPerBox * newQuantity,
        total_price: sqftPerBox * newQuantity * cartItem.price_per_sqft,
      };
      
      setCart(updatedCart);
    } else {
      // Add new item to cart
      setCart((prev) => [...prev, cartItem]);
    }

    // Reset the current item form
    setCurrentItem({
      product_id: 0,
      boxes_sold: 1,
      price_per_box: undefined,
    });
    
    toast.success(`Added ${currentItem.boxes_sold} boxes of ${product.brand} to cart`);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const calculateGSTAmounts = (subtotal: number) => {
    if (orderData.order_type === "quotation") {
      return {
        gst_type: "none" as const,
        igst_amount: 0,
        cgst_amount: 0,
        sgst_amount: 0,
        total: subtotal
      };
    }

    // For tax invoices
    if (orderData.client_state === "Maharashtra") {
      // Within Maharashtra: CGST + SGST
      const cgstAmount = (subtotal * 9) / 100; // 9% CGST
      const sgstAmount = (subtotal * 9) / 100; // 9% SGST
      return {
        gst_type: "cgst_sgst" as const,
        igst_amount: 0,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        total: subtotal + cgstAmount + sgstAmount
      };
    } else {
      // For other states: IGST
      const igstAmount = (subtotal * 18) / 100; // 18% IGST
      return {
        gst_type: "igst" as const,
        igst_amount: igstAmount,
        cgst_amount: 0,
        sgst_amount: 0,
        total: subtotal + igstAmount
      };
    }
  };

  const handleOrderTypeChange = (value: string) => {
    setOrderData(prev => ({
      ...prev,
      order_type: value as 'quotation' | 'tax_invoice',
      gst_type: value === 'quotation' ? 'none' : 
                (prev.client_state === 'Maharashtra' ? 'cgst_sgst' : 'igst')
    }));
  };

  const handleStateChange = (value: string) => {
    setOrderData(prev => ({
      ...prev,
      client_state: value,
      gst_type: prev.order_type === 'quotation' ? 'none' :
                (value === 'Maharashtra' ? 'cgst_sgst' : 'igst')
    }));
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Basic validation
      if (!orderData.client_name.trim()) {
        toast.error("Please enter client name");
        return;
      }
      
      if (!orderData.client_phone.trim()) {
        toast.error("Please enter client phone number");
        return;
      }
      
      if (!orderData.client_address.trim()) {
        toast.error("Please enter client address");
        return;
      }

      if (!orderData.client_state) {
        toast.error("Please select client state");
        return;
      }
      
      if (cart.length === 0) {
        toast.error("Please add at least one item to the cart");
        return;
      }

      // Calculate subtotal
      const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
      
      // Calculate GST amounts
      const gstData = calculateGSTAmounts(subtotal);
      
      // Prepare order items for submission
      const orderItems: OrderItem[] = cart.map((item) => ({
        product_id: item.product_id,
        boxes_sold: item.boxes_sold,
        price_per_sqft: item.price_per_sqft,
      }));
      
      // Create the complete order object with all required fields
      const finalOrder: Order = {
        ...orderData,
        order_type: orderData.order_type || 'tax_invoice',
        client_state: orderData.client_state,
        hsn_code: orderData.hsn_code || "6908", // Default HSN code for tiles
        state_code: orderData.state_code || orderData.client_state.substring(0, 2).toUpperCase(), // First 2 letters of state
        order_date: orderData.order_date || new Date().toISOString().split('T')[0],
        is_reverse_charge: orderData.is_reverse_charge || false,
        client_gst: orderData.client_gst || null,
        vehicle_no: orderData.vehicle_no || null,
        eway_bill: orderData.eway_bill || null,
        gst_type: gstData.gst_type,
        subtotal: subtotal,
        igst_amount: gstData.igst_amount,
        cgst_amount: gstData.cgst_amount,
        sgst_amount: gstData.sgst_amount,
        total_amount: gstData.total
      };

      console.log("Submitting order with data:", { finalOrder, orderItems });
      
      onSubmit(finalOrder, orderItems);
    } catch (error) {
      console.error("Error preparing order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to prepare order");
    }
  };

  // Calculate order summary with GST
  const totalBoxes = cart.reduce((sum, item) => sum + item.boxes_sold, 0);
  const totalSqft = cart.reduce((sum, item) => sum + item.total_sqft, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
  const gstAmounts = calculateGSTAmounts(subtotal);

  return (
    <div className="min-h-full flex flex-col bg-white">
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white">
        <h2 className="text-lg font-semibold">
          {orderData.order_type === 'quotation' ? 'Create Quotation' : 'Create Tax Invoice'}
        </h2>
        <button
          onClick={onCancel}
          className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>

      <form onSubmit={handleSubmitOrder} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Order Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name</Label>
              <Input
                id="client_name"
                name="client_name"
                value={orderData.client_name}
                onChange={handleOrderChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_phone">Client Phone</Label>
              <Input
                id="client_phone"
                name="client_phone"
                value={orderData.client_phone}
                onChange={handleOrderChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_gst">GST Number</Label>
              <Input
                id="client_gst"
                name="client_gst"
                value={orderData.client_gst}
                onChange={handleOrderChange}
              />
            </div>

            <div className="space-y-2 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="client_address">Client Address</Label>
              <Input
                id="client_address"
                name="client_address"
                value={orderData.client_address}
                onChange={handleOrderChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_state">State</Label>
              <Select
                value={orderData.client_state}
                onValueChange={(value) => handleStateChange(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="state_code">State Code</Label>
              <Input
                id="state_code"
                name="state_code"
                value={orderData.state_code}
                onChange={handleOrderChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle_no">Vehicle Number</Label>
              <Input
                id="vehicle_no"
                name="vehicle_no"
                value={orderData.vehicle_no}
                onChange={handleOrderChange}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Add Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select
                value={currentItem.product_id.toString()}
                onValueChange={handleProductSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0" disabled>Select a product</SelectItem>
                  {inventory.map((item) => (
                    <SelectItem 
                      key={item.product_id} 
                      value={item.product_id?.toString() || "0"}
                      disabled={item.boxes_on_hand === 0}
                    >
                      {item.brand} ({item.tile_width}x{item.tile_height}ft) - {item.boxes_on_hand} boxes left
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="boxes_sold">Boxes</Label>
              <Input
                id="boxes_sold"
                name="boxes_sold"
                type="number"
                min="1"
                value={currentItem.boxes_sold}
                onChange={handleItemChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_per_box">Price Per Box (Optional)</Label>
              <Input
                id="price_per_box"
                name="price_per_box"
                type="number"
                min="0"
                step="0.01"
                value={currentItem.price_per_box || ''}
                onChange={handleItemChange}
              />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                onClick={addToCart}
                className="w-full"
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Cart</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Boxes
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="relative px-4 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cart.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.brand}</div>
                      <div className="text-xs text-gray-500">{item.total_sqft.toFixed(2)} sq.ft.</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.boxes_sold}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{formatCurrency(item.price_per_sqft * item.sqft_per_box)}/box</div>
                      <div className="text-xs text-gray-500">₹{formatCurrency(item.price_per_sqft)}/sq.ft.</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(item.total_price)}</div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Order Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Order Type</Label>
              <Select
                value={orderData.order_type}
                onValueChange={handleOrderTypeChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quotation">Quotation</SelectItem>
                  <SelectItem value="tax_invoice">Tax Invoice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>GST Type</Label>
              <Select
                value={orderData.gst_type}
                onValueChange={(value) => {
                  const event = {
                    target: {
                      name: 'gst_type',
                      value
                    }
                  } as React.ChangeEvent<HTMLSelectElement>;
                  handleOrderChange(event);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="igst">IGST</SelectItem>
                  <SelectItem value="cgst_sgst">CGST + SGST</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_reverse_charge"
                checked={orderData.is_reverse_charge}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="is_reverse_charge">Reverse Charge</Label>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-end mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || cart.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing
              </>
            ) : (
              `Create ${orderData.order_type === 'quotation' ? 'Quotation' : 'Tax Invoice'}`
            )}
          </Button>
        </div>
      </form>

      {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
