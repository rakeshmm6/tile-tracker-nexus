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
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";

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
    price_per_sqft: number;
    price_per_box?: number;
    usePricePerBox?: boolean;
  }>({
    product_id: 0,
    boxes_sold: 1,
    price_per_sqft: 0,
    price_per_box: 0,
    usePricePerBox: false,
  });

  const [cart, setCart] = React.useState<CartItem[]>([]);

  // Add state to track CommandInput value
  const [productQuery, setProductQuery] = React.useState("");

  // Add state to control product list visibility
  const [showProductList, setShowProductList] = React.useState(false);

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
      [name]: Number(value),
    }));
  };

  const handleProductSelect = (value: string) => {
    setCurrentItem((prev) => ({
      ...prev,
      product_id: Number(value),
    }));
    setShowProductList(false); // Close the list after selection
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

    // Use price per box if selected, otherwise price per sqft
    let price_per_sqft = currentItem.price_per_sqft;
    let price_per_box = undefined;
    if (currentItem.usePricePerBox && currentItem.price_per_box) {
      price_per_box = currentItem.price_per_box;
      price_per_sqft = sqftPerBox > 0 ? price_per_box / sqftPerBox : 0;
    }

    const total_sqft = sqftPerBox * currentItem.boxes_sold;
    const total_price = total_sqft * price_per_sqft;

    setCart((prev) => [
      ...prev,
      {
        product_id: currentItem.product_id,
      brand: product.brand,
      boxes_sold: currentItem.boxes_sold,
        price_per_sqft,
        price_per_box,
        usePricePerBox: currentItem.usePricePerBox,
      sqft_per_box: sqftPerBox,
        total_sqft,
        total_price,
        product_details: product,
      },
    ]);

    setCurrentItem({
      product_id: 0,
      boxes_sold: 1,
      price_per_sqft: 0,
      price_per_box: 0,
      usePricePerBox: false,
    });
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

  // Before the return statement in the component
  const selectedProductDetails = (() => {
    if (currentItem.product_id === 0) return null;
    const selected = inventory.find(item => item.product_id === currentItem.product_id);
    if (!selected) return null;
    return (
      <div className="mt-2 p-2 rounded border bg-gray-50 text-sm">
        <div><span className="font-medium">{selected.brand}</span> - {selected.product_name}</div>
        <div>Size: {selected.tile_width}x{selected.tile_height} ft, {selected.tiles_per_box} tiles/box</div>
        <div>HSN: {selected.hsn_code} | In stock: {selected.boxes_on_hand} boxes</div>
      </div>
    );
  })();

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
        <div className="space-y-6">
          {/* Main Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Order Information */}
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="text-lg font-medium mb-4">Order Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="order_type">Order Type</Label>
                  <Select value={orderData.order_type} onValueChange={handleOrderTypeChange}>
                    <SelectTrigger id="order_type">
                      <SelectValue placeholder="Select order type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quotation">Quotation</SelectItem>
                      <SelectItem value="tax_invoice">Tax Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  name="client_name"
                  value={orderData.client_name}
                  onChange={handleOrderChange}
                  required
                />
              </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="client_state">State</Label>
                  <Select value={orderData.client_state} onValueChange={handleStateChange}>
                    <SelectTrigger id="client_state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-1">
                  <Label htmlFor="client_phone">Client Phone</Label>
                <Input
                  id="client_phone"
                  name="client_phone"
                  value={orderData.client_phone}
                  onChange={handleOrderChange}
                  required
                />
              </div>

                <div className="sm:col-span-1">
                  <Label htmlFor="client_gst">Client GST Number</Label>
                  <Input
                    id="client_gst"
                    name="client_gst"
                    value={orderData.client_gst || ''}
                    onChange={handleOrderChange}
                  />
            </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="client_address">Client Address</Label>
              <Input
                id="client_address"
                name="client_address"
                value={orderData.client_address}
                onChange={handleOrderChange}
                required
              />
            </div>

                <div className="sm:col-span-2 flex items-center space-x-2">
                  <Switch
                    checked={orderData.is_reverse_charge}
                    onCheckedChange={handleSwitchChange}
                    id="is_reverse_charge"
                />
                  <Label htmlFor="is_reverse_charge">Reverse Charge</Label>
              </div>
              </div>
            </div>

            {/* Right Column - Product Selection and Cart */}
            <div className="space-y-6">
              {/* Product Selection */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-lg font-medium mb-4">Add Items</h3>
                <div className="space-y-4">
        <div>
              <Label htmlFor="product">Product</Label>
              <Command>
                <CommandInput
                  placeholder="Type product name or brand..."
                  value={productQuery}
                  onValueChange={setProductQuery}
                  onFocus={() => setShowProductList(true)}
                />
                {showProductList && (
                  <CommandList>
                    {productQuery ? (
                      <>
                        {inventory.filter(item =>
                          item.product_name.toLowerCase().includes(productQuery.toLowerCase()) ||
                          item.brand.toLowerCase().includes(productQuery.toLowerCase())
                        ).length === 0 ? (
                          <CommandEmpty>No products found.</CommandEmpty>
                        ) : (
                          inventory.filter(item =>
                            item.product_name.toLowerCase().includes(productQuery.toLowerCase()) ||
                            item.brand.toLowerCase().includes(productQuery.toLowerCase())
                          ).map(item => (
                            <CommandItem
                              key={item.product_id}
                              value={`${item.brand} - ${item.product_name}`}
                              onSelect={() => handleProductSelect(item.product_id.toString())}
                              disabled={item.boxes_on_hand === 0}
                            >
                              {item.brand} - {item.product_name} ({item.tile_width}x{item.tile_height}ft) - {item.boxes_on_hand} boxes left
                            </CommandItem>
                          ))
                        )}
                      </>
                    ) : null}
                  </CommandList>
                )}
              </Command>
            </div>

                  {/* Show selected product details below the search input */}
                  {selectedProductDetails}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
              <Label htmlFor="boxes_sold">Quantity (Boxes)</Label>
              <Input
                id="boxes_sold"
                name="boxes_sold"
                type="number"
                value={currentItem.boxes_sold}
                onChange={handleItemChange}
                min="1"
                className="number-input"
              />
            </div>
                  </div>

                  <div className="col-span-full flex items-center gap-4">
                    <label className="text-sm font-medium">Price Mode:</label>
                    <button
                      type="button"
                      className={`px-2 py-1 rounded border ${currentItem.usePricePerBox ? '' : 'bg-blue-100 border-blue-400'}`}
                      onClick={() => setCurrentItem((prev) => ({ ...prev, usePricePerBox: false }))}
                    >
                      Per Sqft
                    </button>
                    <button
                      type="button"
                      className={`px-2 py-1 rounded border ${currentItem.usePricePerBox ? 'bg-blue-100 border-blue-400' : ''}`}
                      onClick={() => setCurrentItem((prev) => ({ ...prev, usePricePerBox: true }))}
                    >
                      Per Box
                    </button>
                  </div>
                  {currentItem.usePricePerBox ? (
                    <div className="col-span-full">
                      <Label htmlFor="price_per_box">Price per Box</Label>
                      <Input
                        id="price_per_box"
                        type="number"
                        min={0}
                        value={currentItem.price_per_box || ''}
                        onChange={e => {
                          const price_per_box = parseFloat(e.target.value) || 0;
                          // Calculate price per sqft based on selected product
                          const product = inventory.find(item => item.product_id === currentItem.product_id);
                          let price_per_sqft = 0;
                          if (product) {
                            const sqftPerBox = calculateSquareFeet(product.tile_width, product.tile_height, product.tiles_per_box);
                            price_per_sqft = sqftPerBox > 0 ? price_per_box / sqftPerBox : 0;
                          }
                          setCurrentItem(prev => ({ ...prev, price_per_box, price_per_sqft }));
                        }}
                      />
                    </div>
                  ) : (
                    <div className="col-span-full">
                      <Label htmlFor="price_per_sqft">Price per Sqft</Label>
                      <Input
                        id="price_per_sqft"
                        type="number"
                        min={0}
                        value={currentItem.price_per_sqft || ''}
                        onChange={e => setCurrentItem(prev => ({ ...prev, price_per_sqft: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  )}

            <Button 
              type="button" 
              onClick={addToCart}
              disabled={currentItem.product_id === 0}
              className="w-full"
            >
              Add to Cart
            </Button>
          </div>
              </div>

              {/* Cart */}
              <div className="bg-gray-50 rounded-lg border">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-medium">Cart ({cart.length} items)</h3>
                </div>
                
            {cart.length > 0 ? (
                  <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
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
                              {item.usePricePerBox ? (
                                <div className="text-sm text-gray-900">₹{formatCurrency(item.price_per_box)}/box</div>
                              ) : (
                                <div className="text-sm text-gray-900">₹{formatCurrency(item.price_per_sqft)}/sq.ft.</div>
                              )}
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
            ) : (
                  <div className="text-center py-8">
                <p className="text-gray-500">No items in cart</p>
              </div>
            )}

            {cart.length > 0 && (
                  <div className="border-t">
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                  <span>Total Boxes:</span>
                  <span className="font-medium">{totalBoxes}</span>
                </div>
                      <div className="flex justify-between text-sm">
                  <span>Total Area:</span>
                  <span className="font-medium">{totalSqft.toFixed(2)} sq.ft.</span>
                </div>
                      <div className="flex justify-between text-base font-medium pt-2 border-t">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                      </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="text-lg font-medium mb-4">Order Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Boxes</p>
                <p className="font-medium">{totalBoxes}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Square Feet</p>
                <p className="font-medium">{totalSqft.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subtotal</p>
                <p className="font-medium">{formatCurrency(subtotal)}</p>
              </div>
              {/* Only show GST and total if tax_invoice */}
              {orderData.order_type === 'tax_invoice' ? (
                <>
                  {gstAmounts.gst_type === 'igst' ? (
                    <div>
                      <p className="text-sm text-gray-600">IGST (18%)</p>
                      <p className="font-medium">{formatCurrency(gstAmounts.igst_amount)}</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">CGST (9%)</p>
                        <p className="font-medium">{formatCurrency(gstAmounts.cgst_amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">SGST (9%)</p>
                        <p className="font-medium">{formatCurrency(gstAmounts.sgst_amount)}</p>
                      </div>
                    </>
                  )}
                  <div className="sm:col-span-2 md:col-span-3">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-lg font-bold">{formatCurrency(gstAmounts.total)}</p>
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2 md:col-span-3">
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-lg font-bold">{formatCurrency(subtotal)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                orderData.order_type === 'quotation' ? 'Create Quotation' : 'Create Invoice'
              )}
        </Button>
      </div>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </form>
    </div>
  );
}
