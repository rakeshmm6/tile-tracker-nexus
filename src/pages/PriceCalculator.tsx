import React, { useState } from "react";
import { useInventory } from "@/hooks/useInventory";
import { calculateSquareFeet, formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";

const PriceCalculator: React.FC = () => {
  const { inventory } = useInventory();
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [boxes, setBoxes] = useState<number>(1);
  const [totalPrice, setTotalPrice] = useState<number>(0);

  const product = inventory.find((item) => item.product_id === selectedProductId);
  const tilesPerBox = product?.tiles_per_box || 0;
  const sqftPerBox = product ? calculateSquareFeet(product.tile_width, product.tile_height, product.tiles_per_box) : 0;
  const pricePerBox = boxes > 0 ? totalPrice / boxes : 0;
  const totalSqft = sqftPerBox * boxes;

  return (
    <Layout>
      <div className="max-w-xl mx-auto bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-6">Tile Price Calculator</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="product">Select Tile</Label>
            <select
              id="product"
              className="w-full border rounded px-3 py-2 mt-1"
              value={selectedProductId}
              onChange={e => setSelectedProductId(Number(e.target.value))}
            >
              <option value={0}>Select a tile</option>
              {inventory.map(item => (
                <option key={item.product_id} value={item.product_id}>
                  {item.brand} - {item.product_name} ({item.tile_width}x{item.tile_height}ft, {item.tiles_per_box} tiles/box)
                </option>
              ))}
            </select>
          </div>
          {product && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tiles_per_box">Tiles per Box</Label>
                  <Input id="tiles_per_box" value={tilesPerBox} readOnly />
                </div>
                <div>
                  <Label htmlFor="sqft_per_box">Sqft per Box</Label>
                  <Input id="sqft_per_box" value={sqftPerBox.toFixed(2)} readOnly />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="boxes">Number of Boxes</Label>
                  <Input
                    id="boxes"
                    type="number"
                    min={1}
                    value={boxes}
                    onChange={e => setBoxes(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="total_price">Total Price (₹)</Label>
                  <Input
                    id="total_price"
                    type="number"
                    min={0}
                    value={totalPrice}
                    onChange={e => setTotalPrice(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="mt-6 p-4 bg-gray-50 rounded border">
                <div className="flex justify-between text-lg">
                  <span>Price per Box:</span>
                  <span className="font-bold">{formatCurrency(pricePerBox)}</span>
                </div>
                <div className="flex justify-between text-lg mt-2">
                  <span>Total Sqft:</span>
                  <span className="font-bold">{totalSqft.toFixed(2)} sq.ft.</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PriceCalculator; 