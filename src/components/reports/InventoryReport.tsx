
import React, { useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { InventoryItem, Order } from "@/lib/types";
import { formatCurrency, calculateSquareFeet } from "@/lib/utils";

interface InventoryReportProps {
  inventory: InventoryItem[];
  orders: Order[];
  brandFilter: string | null;
}

const COLORS = ['#8B5CF6', '#EC4899', '#F97316', '#EAB308', '#10B981', '#0EA5E9'];

const InventoryReport: React.FC<InventoryReportProps> = ({ inventory, orders, brandFilter }) => {
  // Filter inventory by brand
  const filteredInventory = useMemo(() => {
    if (!brandFilter) return inventory;
    return inventory.filter(item => item.brand === brandFilter);
  }, [inventory, brandFilter]);
  
  // Calculate total inventory value
  const totalInventoryValue = useMemo(() => {
    return filteredInventory.reduce((sum, item) => {
      const sqftPerBox = calculateSquareFeet(item.tile_width, item.tile_height, item.tiles_per_box);
      return sum + (item.boxes_on_hand * sqftPerBox * item.price_per_sqft);
    }, 0);
  }, [filteredInventory]);
  
  // Calculate total boxes
  const totalBoxes = useMemo(() => {
    return filteredInventory.reduce((sum, item) => sum + item.boxes_on_hand, 0);
  }, [filteredInventory]);
  
  // Calculate inventory by brand for pie chart
  const inventoryByBrand = useMemo(() => {
    const brandInventory: Record<string, number> = {};
    
    filteredInventory.forEach(item => {
      const sqftPerBox = calculateSquareFeet(item.tile_width, item.tile_height, item.tiles_per_box);
      const itemValue = item.boxes_on_hand * sqftPerBox * item.price_per_sqft;
      
      if (brandInventory[item.brand]) {
        brandInventory[item.brand] += itemValue;
      } else {
        brandInventory[item.brand] = itemValue;
      }
    });
    
    return Object.entries(brandInventory)
      .map(([brand, value]) => ({ brand, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredInventory]);
  
  // Calculate inventory by size for bar chart
  const inventoryBySize = useMemo(() => {
    const sizeInventory: Record<string, { boxes: number, value: number }> = {};
    
    filteredInventory.forEach(item => {
      const sizeKey = `${item.tile_width}x${item.tile_height}`;
      const sqftPerBox = calculateSquareFeet(item.tile_width, item.tile_height, item.tiles_per_box);
      const itemValue = item.boxes_on_hand * sqftPerBox * item.price_per_sqft;
      
      if (sizeInventory[sizeKey]) {
        sizeInventory[sizeKey].boxes += item.boxes_on_hand;
        sizeInventory[sizeKey].value += itemValue;
      } else {
        sizeInventory[sizeKey] = { 
          boxes: item.boxes_on_hand, 
          value: itemValue 
        };
      }
    });
    
    return Object.entries(sizeInventory)
      .map(([size, data]) => ({ 
        size, 
        boxes: data.boxes,
        value: data.value
      }))
      .sort((a, b) => b.boxes - a.boxes);
  }, [filteredInventory]);
  
  // Calculate low stock items
  const lowStockItems = useMemo(() => {
    // Consider items with less than 10 boxes as low stock
    return filteredInventory
      .filter(item => item.boxes_on_hand < 10)
      .sort((a, b) => a.boxes_on_hand - b.boxes_on_hand);
  }, [filteredInventory]);

  // Calculate inventory turnover
  const inventoryTurnoverData = useMemo(() => {
    // Group inventory and order items by product_id
    const productMap = new Map<number, {
      product: InventoryItem,
      sold: number // Boxes sold in the time period
    }>();
    
    // Initialize map with inventory items
    filteredInventory.forEach(item => {
      if (item.product_id) {
        productMap.set(item.product_id, {
          product: item,
          sold: 0
        });
      }
    });
    
    // Add sales data from orders
    orders.forEach(order => {
      order.items?.forEach(orderItem => {
        if (productMap.has(orderItem.product_id)) {
          const current = productMap.get(orderItem.product_id);
          if (current) {
            productMap.set(orderItem.product_id, {
              ...current,
              sold: current.sold + orderItem.boxes_sold
            });
          }
        }
      });
    });
    
    // Convert map to array and calculate turnover ratio
    return Array.from(productMap.values())
      .map(({ product, sold }) => {
        // Calculate turnover ratio (sales / average inventory)
        // For simplicity, we'll use current inventory as average inventory
        const turnoverRatio = product.boxes_on_hand > 0 ? sold / product.boxes_on_hand : 0;
        
        return {
          product_id: product.product_id,
          brand: product.brand,
          size: `${product.tile_width}x${product.tile_height}`,
          boxes_on_hand: product.boxes_on_hand,
          boxes_sold: sold,
          turnover_ratio: turnoverRatio
        };
      })
      .sort((a, b) => b.turnover_ratio - a.turnover_ratio);
  }, [filteredInventory, orders]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInventoryValue)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredInventory.length} unique products
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Boxes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBoxes}</div>
            <p className="text-xs text-muted-foreground">
              In stock
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Less than 10 boxes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory by size bar chart */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Inventory by Size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {inventoryBySize.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryBySize}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="size" />
                  <YAxis yAxisId="left" orientation="left" tickFormatter={(value) => `${value}`} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `₹${value / 1000}K`} />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === "boxes" ? value : formatCurrency(value as number),
                      name === "boxes" ? "Boxes" : "Value"
                    ]}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="boxes" name="Boxes" fill="#8B5CF6" />
                  <Bar yAxisId="right" dataKey="value" name="Value" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No inventory data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Inventory by brand pie chart */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory by Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {inventoryByBrand.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inventoryByBrand}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="brand"
                      label={({ brand, percent }) => `${brand}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {inventoryByBrand.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCurrency(value), "Value"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No inventory data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low stock items table */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Boxes</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockItems.length > 0 ? (
                  lowStockItems.map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell className="font-medium">{item.brand}</TableCell>
                      <TableCell>{`${item.tile_width}x${item.tile_height}`}</TableCell>
                      <TableCell>{item.boxes_on_hand}</TableCell>
                      <TableCell>{formatCurrency(item.price_per_sqft)}/sqft</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">No low stock items</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Turnover Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Turnover Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>In Stock</TableHead>
                <TableHead>Sold</TableHead>
                <TableHead>Turnover Ratio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryTurnoverData.length > 0 ? (
                inventoryTurnoverData.slice(0, 5).map((item) => (
                  <TableRow key={item.product_id}>
                    <TableCell className="font-medium">{item.brand}</TableCell>
                    <TableCell>{item.size}</TableCell>
                    <TableCell>{item.boxes_on_hand}</TableCell>
                    <TableCell>{item.boxes_sold}</TableCell>
                    <TableCell>{item.turnover_ratio.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">No turnover data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryReport;
