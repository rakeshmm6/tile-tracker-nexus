
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
      tile_width: 0,
      tile_height: 0,
      tiles_per_box: 0,
      boxes_on_hand: 0,
      price_per_sqft: 0,
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "brand" ? value : Number(value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.brand.trim()) {
      toast.error("Please enter a brand name");
      return;
    }
    
    if (
      formData.tile_width <= 0 ||
      formData.tile_height <= 0 ||
      formData.tiles_per_box <= 0 ||
      formData.boxes_on_hand < 0 ||
      formData.price_per_sqft <= 0
    ) {
      toast.error("Please enter valid numeric values");
      return;
    }
    
    onSubmit(formData);
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
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tile_width">Tile Width (mm)</Label>
          <Input
            id="tile_width"
            name="tile_width"
            type="number"
            value={formData.tile_width || ""}
            onChange={handleChange}
            placeholder="600"
            min="0"
            className="number-input"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tile_height">Tile Height (mm)</Label>
          <Input
            id="tile_height"
            name="tile_height"
            type="number"
            value={formData.tile_height || ""}
            onChange={handleChange}
            placeholder="600"
            min="0"
            className="number-input"
            required
          />
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
