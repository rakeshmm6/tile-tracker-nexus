import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InventoryItem } from "@/lib/types";
import { toast } from "@/components/ui/sonner";

interface InventoryFormProps {
  initialData?: InventoryItem;
  onSubmit: (data: InventoryItem) => void;
  onCancel: () => void;
}

export default function InventoryForm({ 
  initialData, 
  onSubmit, 
  onCancel 
}: InventoryFormProps) {
  const [formData, setFormData] = React.useState<InventoryItem>(
    initialData || {
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
    }
  );
  const [widthUnit, setWidthUnit] = React.useState<'ft' | 'mm' | 'inch'>(initialData?.tile_width_unit || 'ft');
  const [heightUnit, setHeightUnit] = React.useState<'ft' | 'mm' | 'inch'>(initialData?.tile_height_unit || 'ft');

  React.useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        tile_width_value: initialData.tile_width_value ?? initialData.tile_width,
        tile_height_value: initialData.tile_height_value ?? initialData.tile_height,
      }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "brand" ? value : name === "product_name" ? value : Number(value),
    }));
  };

  const toFeet = (value: number, unit: string) => {
    if (unit === 'ft') return value;
    if (unit === 'mm') return value / 304.8;
    if (unit === 'inch') return value / 12;
    return value;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.brand.trim()) {
      toast.error("Please enter a brand name");
      return;
    }
    if (!formData.product_name.trim()) {
      toast.error("Please enter a product name");
      return;
    }
    
    if (
      formData.tile_width_value <= 0 ||
      formData.tile_height_value <= 0 ||
      formData.tiles_per_box <= 0 ||
      formData.boxes_on_hand < 0 ||
      formData.price_per_sqft <= 0
    ) {
      toast.error("Please enter valid numeric values");
      return;
    }
    
    // Convert to feet for calculations
    const widthInFeet = toFeet(formData.tile_width_value, widthUnit);
    const heightInFeet = toFeet(formData.tile_height_value, heightUnit);
    onSubmit({
      ...formData,
      tile_width: widthInFeet,
      tile_height: heightInFeet,
      tile_width_value: formData.tile_width_value,
      tile_width_unit: widthUnit,
      tile_height_value: formData.tile_height_value,
      tile_height_unit: heightUnit,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="brand">Brand</Label>
        <Input
          id="brand"
          name="brand"
          value={formData.brand}
          onChange={handleChange}
          placeholder="e.g. Johnson Tiles"
          required
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="product_name">Product Name</Label>
        <Input
          id="product_name"
          name="product_name"
          value={formData.product_name}
          onChange={handleChange}
          placeholder="e.g. Elite Glossy White"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tile_width_value">Tile Width</Label>
          <div className="flex gap-2">
            <Input
              id="tile_width_value"
              name="tile_width_value"
              type="number"
              value={formData.tile_width_value || ""}
              onChange={handleChange}
              placeholder="2"
              min="0"
              step="0.01"
              className="number-input"
              required
            />
            <select
              value={widthUnit}
              onChange={e => setWidthUnit(e.target.value as 'ft' | 'mm' | 'inch')}
              className="border rounded px-2 py-1 bg-white"
            >
              <option value="ft">ft</option>
              <option value="mm">mm</option>
              <option value="inch">inch</option>
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="tile_height_value">Tile Height</Label>
          <div className="flex gap-2">
            <Input
              id="tile_height_value"
              name="tile_height_value"
              type="number"
              value={formData.tile_height_value || ""}
              onChange={handleChange}
              placeholder="2"
              min="0"
              step="0.01"
              className="number-input"
              required
            />
            <select
              value={heightUnit}
              onChange={e => setHeightUnit(e.target.value as 'ft' | 'mm' | 'inch')}
              className="border rounded px-2 py-1 bg-white"
            >
              <option value="ft">ft</option>
              <option value="mm">mm</option>
              <option value="inch">inch</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tiles_per_box">Tiles Per Box</Label>
          <Input
            id="tiles_per_box"
            name="tiles_per_box"
            type="number"
            value={formData.tiles_per_box || ""}
            onChange={handleChange}
            placeholder="4"
            min="0"
            className="number-input"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="boxes_on_hand">Boxes On Hand</Label>
          <Input
            id="boxes_on_hand"
            name="boxes_on_hand"
            type="number"
            value={formData.boxes_on_hand || ""}
            onChange={handleChange}
            placeholder="100"
            min="0"
            className="number-input"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="price_per_sqft">Price Per Sqft (₹)</Label>
        <Input
          id="price_per_sqft"
          name="price_per_sqft"
          type="number"
          value={formData.price_per_sqft || ""}
          onChange={handleChange}
          placeholder="85"
          min="0"
          step="0.01"
          className="number-input"
          required
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? "Update Item" : "Add Item"}
        </Button>
      </div>
    </form>
  );
}
