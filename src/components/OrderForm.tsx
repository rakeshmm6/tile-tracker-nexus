
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

interface OrderFormProps {
  inventory: InventoryItem[];
  onSubmit: (order: Order, items: OrderItem[]) => void;
  onCancel: () => void;
}

export default function OrderForm({ inventory, onSubmit, onCancel }: OrderFormProps) {
  const [orderData, setOrderData] = React.useState<Order>({
    client_name: "",
    client_phone: "",
    client_address: "",
    client_gst: "",
    vehicle_no: "",
    is_reverse_charge: false,
    eway_bill: "",
    order_date: new Date().toISOString().split("T")[0],
    hsn_code: "6908", // Default HSN code for tiles
    state_code: "",
  });

  const [currentItem, setCurrentItem] = React.useState<{
    product_id: number;
    boxes_sold: number;
  }>({
    product_id: 0,
    boxes_sold: 1,
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

    // Calculate total price
    const totalPrice = totalSqft * product.price_per_sqft;

    const cartItem: CartItem = {
      product_id: product.product_id!,
      brand: product.brand,
      boxes_sold: currentItem.boxes_sold,
      price_per_sqft: product.price_per_sqft,
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
    });
    
    toast.success(`Added ${currentItem.boxes_sold} boxes of ${product.brand} to cart`);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!orderData.client_name.trim()) {
      toast.error("Please enter client name");
      return;
    }
    
    if (!orderData.client_phone.trim()) {
      toast.error("Please enter client phone number");
      return;
    }
    
    if (cart.length === 0) {
      toast.error("Please add at least one item to the cart");
      return;
    }
    
    // Prepare order items for submission
    const orderItems: OrderItem[] = cart.map((item) => ({
      product_id: item.product_id,
      boxes_sold: item.boxes_sold,
      price_per_sqft: item.price_per_sqft,
    }));
    
    // Submit the order
    onSubmit(orderData, orderItems);
  };

  // Calculate order summary
  const totalBoxes = cart.reduce((sum, item) => sum + item.boxes_sold, 0);
  const totalSqft = cart.reduce((sum, item) => sum + item.total_sqft, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <h3 className="text-lg font-medium">Client Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Client Name</Label>
                <Input
                  id="client_name"
                  name="client_name"
                  value={orderData.client_name}
                  onChange={handleOrderChange}
                  placeholder="Client Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client_phone">Phone Number</Label>
                <Input
                  id="client_phone"
                  name="client_phone"
                  value={orderData.client_phone}
                  onChange={handleOrderChange}
                  placeholder="Phone Number"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_address">Address</Label>
              <Input
                id="client_address"
                name="client_address"
                value={orderData.client_address}
                onChange={handleOrderChange}
                placeholder="Address"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_gst">GST Number</Label>
                <Input
                  id="client_gst"
                  name="client_gst"
                  value={orderData.client_gst}
                  onChange={handleOrderChange}
                  placeholder="29AABCS1234Z1ZA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state_code">State Code</Label>
                <Input
                  id="state_code"
                  name="state_code"
                  value={orderData.state_code}
                  onChange={handleOrderChange}
                  placeholder="29"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_no">Vehicle Number</Label>
                <Input
                  id="vehicle_no"
                  name="vehicle_no"
                  value={orderData.vehicle_no}
                  onChange={handleOrderChange}
                  placeholder="KA01AB1234"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eway_bill">E-Way Bill</Label>
                <Input
                  id="eway_bill"
                  name="eway_bill"
                  value={orderData.eway_bill}
                  onChange={handleOrderChange}
                  placeholder="E123456789"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="order_date">Order Date</Label>
                <Input
                  id="order_date"
                  name="order_date"
                  type="date"
                  value={orderData.order_date}
                  onChange={handleOrderChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hsn_code">HSN Code</Label>
                <Input
                  id="hsn_code"
                  name="hsn_code"
                  value={orderData.hsn_code}
                  onChange={handleOrderChange}
                  placeholder="6908"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_reverse_charge"
                checked={orderData.is_reverse_charge}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="is_reverse_charge">Reverse Charge Mechanism</Label>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Add Items</h3>
          <div className="space-y-4 p-4 border rounded-md bg-gray-50">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select
                value={currentItem.product_id.toString()}
                onValueChange={handleProductSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0" disabled>Select a product</SelectItem>
                  {inventory.map((item) => (
                    <SelectItem 
                      key={item.product_id} 
                      value={item.product_id?.toString() || "0"}
                      disabled={item.boxes_on_hand === 0}
                    >
                      {item.brand} ({item.tile_width}x{item.tile_height}mm) - {item.boxes_on_hand} boxes left
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
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

            <Button 
              type="button" 
              onClick={addToCart}
              disabled={currentItem.product_id === 0}
              className="w-full"
            >
              Add to Cart
            </Button>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium mb-4">Cart ({cart.length} items)</h3>
            {cart.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
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
                          <div className="text-sm text-gray-900">₹{item.price_per_sqft}/sq.ft.</div>
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
              <div className="text-center py-8 border rounded-md bg-gray-50">
                <p className="text-gray-500">No items in cart</p>
              </div>
            )}

            {cart.length > 0 && (
              <div className="mt-4 bg-gray-50 border rounded-md p-4">
                <div className="flex justify-between">
                  <span>Total Boxes:</span>
                  <span className="font-medium">{totalBoxes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Area:</span>
                  <span className="font-medium">{totalSqft.toFixed(2)} sq.ft.</span>
                </div>
                <div className="flex justify-between text-lg font-medium mt-2 pt-2 border-t">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSubmitOrder} disabled={cart.length === 0}>
          Create Order
        </Button>
      </div>
    </div>
  );
}
