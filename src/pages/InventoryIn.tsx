import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useInventory } from "@/hooks/useInventory";
import { addInventoryInEntry, getInventoryInHistory, addInventoryItem, updateInventoryItem } from "@/lib/database/inventory";
import { InventoryItem } from "@/lib/types";
import Layout from "@/components/Layout";

const emptyNewProduct = {
  brand: "",
  product_name: "",
  tile_width: 0,
  tile_height: 0,
  tile_width_value: 0,
  tile_width_unit: 'ft',
  tile_height_value: 0,
  tile_height_unit: 'ft',
  tiles_per_box: 0,
  boxes_on_hand: 0,
  price_per_sqft: 0,
  hsn_code: "",
};

const InventoryIn: React.FC = () => {
  const { inventory, refresh: refreshInventory } = useInventory();
  const [truckNumber, setTruckNumber] = useState("");
  const [date, setDate] = useState("");
  const [products, setProducts] = useState([
    { product_id: 0, quantity: 0, isNew: false, newProduct: { ...emptyNewProduct } }
  ]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInventoryInHistory();
      setHistory(data || []);
    } catch (err: any) {
      setError("Failed to fetch history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleProductChange = (idx: number, field: string, value: any) => {
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handleNewProductChange = (idx: number, field: string, value: any) => {
    setProducts(prev => prev.map((p, i) => i === idx ? { ...p, newProduct: { ...p.newProduct, [field]: value } } : p));
  };

  const addProductRow = () => {
    setProducts(prev => [...prev, { product_id: 0, quantity: 0, isNew: false, newProduct: { ...emptyNewProduct } }]);
  };

  const removeProductRow = (idx: number) => {
    setProducts(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // For each product: if isNew, add to inventory, else update
      const productIds: number[] = [];
      for (const p of products) {
        if (p.isNew) {
          // Validate new product fields (same as InventoryForm)
          const np = p.newProduct;
          if (!np.brand.trim() || !np.product_name.trim() || !np.hsn_code.trim() || np.tile_width_value <= 0 || np.tile_height_value <= 0 || np.tiles_per_box <= 0 || np.price_per_sqft <= 0) {
            setError("Please fill all required fields for new products.");
            setLoading(false);
            return;
          }
          // Convert to feet for calculations
          const toFeet = (value: number, unit: string) => {
            if (unit === 'ft') return value;
            if (unit === 'mm') return value / 304.8;
            if (unit === 'inch') return value / 12;
            return value;
          };
          const widthInFeet = toFeet(np.tile_width_value, np.tile_width_unit);
          const heightInFeet = toFeet(np.tile_height_value, np.tile_height_unit);
          const newItem: InventoryItem = {
            ...np,
            tile_width: widthInFeet,
            tile_height: heightInFeet,
            boxes_on_hand: p.quantity,
            tile_width_unit: np.tile_width_unit as 'ft' | 'mm' | 'inch',
            tile_height_unit: np.tile_height_unit as 'ft' | 'mm' | 'inch',
          };
          const added = await addInventoryItem(newItem);
          productIds.push(added.product_id!);
        } else {
          // Existing product: update boxes_on_hand
          const existing = inventory.find(item => item.product_id === p.product_id);
          if (!existing) {
            setError("Selected product not found in inventory.");
            setLoading(false);
            return;
          }
          await updateInventoryItem(existing.product_id!, { boxes_on_hand: existing.boxes_on_hand + p.quantity });
          productIds.push(existing.product_id!);
        }
      }
      // Add Inventory In entry
      const inventoryInProducts = productIds.map((pid, i) => ({ product_id: pid, quantity: products[i].quantity }));
      await addInventoryInEntry(truckNumber, date, inventoryInProducts);
      setTruckNumber("");
      setDate("");
      setProducts([{ product_id: 0, quantity: 0, isNew: false, newProduct: { ...emptyNewProduct } }]);
      await fetchHistory();
      refreshInventory && refreshInventory();
    } catch (err: any) {
      setError("Failed to add entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
        <Tabs defaultValue="add">
          <TabsList>
            <TabsTrigger value="add">Add Entry</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          <TabsContent value="add">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="truckNumber">Truck Registration Number</Label>
                <Input id="truckNumber" value={truckNumber} onChange={e => setTruckNumber(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div>
                <Label>Products</Label>
                {products.map((prod, idx) => (
                  <div key={idx} className="flex flex-col gap-2 mb-4 border-b pb-2">
                    <div className="flex gap-2 items-center">
                      <select
                        className="border rounded px-2 py-1"
                        value={prod.isNew ? "new" : prod.product_id}
                        onChange={e => {
                          if (e.target.value === "new") {
                            handleProductChange(idx, "isNew", true);
                          } else {
                            handleProductChange(idx, "isNew", false);
                            handleProductChange(idx, "product_id", Number(e.target.value));
                          }
                        }}
                        required
                      >
                        <option value={0}>Select product</option>
                        {inventory.map(item => (
                          <option key={item.product_id} value={item.product_id}>
                            {item.brand} - {item.product_name}
                          </option>
                        ))}
                        <option value="new">+ Add New Product</option>
                      </select>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Quantity (boxes)"
                        value={prod.quantity}
                        onChange={e => handleProductChange(idx, "quantity", Number(e.target.value))}
                        required
                      />
                      {products.length > 1 && (
                        <Button type="button" variant="outline" onClick={() => removeProductRow(idx)}>-</Button>
                      )}
                      {idx === products.length - 1 && (
                        <Button type="button" variant="outline" onClick={addProductRow}>+</Button>
                      )}
                    </div>
                    {prod.isNew && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <Label>Brand</Label>
                          <Input value={prod.newProduct.brand} onChange={e => handleNewProductChange(idx, "brand", e.target.value)} required />
                        </div>
                        <div>
                          <Label>Product Name</Label>
                          <Input value={prod.newProduct.product_name} onChange={e => handleNewProductChange(idx, "product_name", e.target.value)} required />
                        </div>
                        <div>
                          <Label>HSN Code</Label>
                          <Input value={prod.newProduct.hsn_code} onChange={e => handleNewProductChange(idx, "hsn_code", e.target.value)} required />
                        </div>
                        <div>
                          <Label>Tiles Per Box</Label>
                          <Input type="number" min={1} value={prod.newProduct.tiles_per_box} onChange={e => handleNewProductChange(idx, "tiles_per_box", Number(e.target.value))} required />
                        </div>
                        <div>
                          <Label>Tile Width</Label>
                          <Input type="number" min={0.01} step="any" value={prod.newProduct.tile_width_value} onChange={e => handleNewProductChange(idx, "tile_width_value", Number(e.target.value))} required />
                          <select value={prod.newProduct.tile_width_unit} onChange={e => handleNewProductChange(idx, "tile_width_unit", e.target.value)} className="border rounded px-2 py-1 bg-white mt-1">
                            <option value="ft">ft</option>
                            <option value="mm">mm</option>
                            <option value="inch">inch</option>
                          </select>
                        </div>
                        <div>
                          <Label>Tile Height</Label>
                          <Input type="number" min={0.01} step="any" value={prod.newProduct.tile_height_value} onChange={e => handleNewProductChange(idx, "tile_height_value", Number(e.target.value))} required />
                          <select value={prod.newProduct.tile_height_unit} onChange={e => handleNewProductChange(idx, "tile_height_unit", e.target.value)} className="border rounded px-2 py-1 bg-white mt-1">
                            <option value="ft">ft</option>
                            <option value="mm">mm</option>
                            <option value="inch">inch</option>
                          </select>
                        </div>
                        <div>
                          <Label>Price Per Sqft (₹)</Label>
                          <Input type="number" min={0.01} step="any" value={prod.newProduct.price_per_sqft} onChange={e => handleNewProductChange(idx, "price_per_sqft", Number(e.target.value))} required />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Add Entry"}</Button>
              {error && <div className="text-red-500 mt-2">{error}</div>}
            </form>
          </TabsContent>
          <TabsContent value="history">
            <h3 className="text-lg font-semibold mb-4">Inventory In History</h3>
            {loading ? (
              <div className="text-gray-500">Loading...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="text-gray-500">No entries yet.</div>
                ) : (
                  history.map((entry, idx) => (
                    <div key={entry.id || idx} className="border rounded p-3">
                      <div><b>Truck:</b> {entry.truck_number}</div>
                      <div><b>Date:</b> {entry.date}</div>
                      <div><b>Products:</b>
                        <ul className="list-disc ml-6">
                          {(entry.inventory_in_products || []).map((p: any, i: number) => {
                            const prod = p.inventory;
                            return (
                              <li key={i}>{prod ? `${prod.brand} - ${prod.product_name}` : p.product_id} (Boxes: {p.quantity})</li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default InventoryIn; 