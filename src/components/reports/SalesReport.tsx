
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
import { subDays, subMonths, startOfWeek, startOfMonth, startOfQuarter, startOfYear, isAfter } from "date-fns";

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
import { ChartContainer } from "@/components/ui/chart";
import { Order } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface SalesReportProps {
  orders: Order[];
  timeRange: string;
  brandFilter: string | null;
}

const COLORS = ['#8B5CF6', '#EC4899', '#F97316', '#EAB308', '#10B981', '#0EA5E9'];

const SalesReport: React.FC<SalesReportProps> = ({ orders, timeRange, brandFilter }) => {
  // Filter orders by time range and brand
  const filteredOrders = useMemo(() => {
    let startDate: Date | null = null;
    const now = new Date();
    
    // Apply time filter
    switch (timeRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = startOfWeek(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'quarter':
        startDate = startOfQuarter(now);
        break;
      case 'year':
        startDate = startOfYear(now);
        break;
      default:
        // 'all' - no time filtering
        break;
    }
    
    return orders.filter(order => {
      // Apply time filter
      if (startDate && !isAfter(new Date(order.order_date), startDate)) {
        return false;
      }
      
      // Apply brand filter if selected
      if (brandFilter) {
        const hasBrand = order.items?.some(item => 
          item.product_details?.brand === brandFilter
        );
        if (!hasBrand) return false;
      }
      
      return true;
    });
  }, [orders, timeRange, brandFilter]);
  
  // Calculate total sales
  const totalSales = useMemo(() => {
    return filteredOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
  }, [filteredOrders]);
  
  // Calculate sales by brand data for pie chart
  const salesByBrand = useMemo(() => {
    const brandSales: Record<string, number> = {};
    
    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        if (item.product_details) {
          const { brand, tile_width, tile_height, tiles_per_box } = item.product_details;
          const sqftPerBox = (tile_width * tile_height * tiles_per_box) / (304.8 * 304.8);
          const itemTotal = item.boxes_sold * sqftPerBox * item.price_per_sqft;
          
          if (brandSales[brand]) {
            brandSales[brand] += itemTotal;
          } else {
            brandSales[brand] = itemTotal;
          }
        }
      });
    });
    
    return Object.entries(brandSales).map(([brand, value]) => ({
      brand,
      value
    })).sort((a, b) => b.value - a.value);
  }, [filteredOrders]);
  
  // Calculate monthly sales data for bar chart
  const monthlySales = useMemo(() => {
    const months: Record<string, number> = {};
    
    filteredOrders.forEach(order => {
      const date = new Date(order.order_date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (months[monthYear]) {
        months[monthYear] += (order.total_amount || 0);
      } else {
        months[monthYear] = (order.total_amount || 0);
      }
    });
    
    return Object.entries(months)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split('/').map(Number);
        const [bMonth, bYear] = b.month.split('/').map(Number);
        return (aYear * 12 + aMonth) - (bYear * 12 + bMonth);
      })
      .slice(-6);  // Show last 6 months
  }, [filteredOrders]);

  // Recent orders for the table
  const recentOrders = useMemo(() => {
    return [...filteredOrders]
      .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
      .slice(0, 5);
  }, [filteredOrders]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredOrders.length} orders
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(filteredOrders.length ? totalSales / filteredOrders.length : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per order
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesByBrand.length > 0 ? salesByBrand[0].brand : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {salesByBrand.length > 0 ? formatCurrency(salesByBrand[0].value) : "No sales"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales trend chart */}
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {monthlySales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    tickFormatter={(value) => `₹${value / 1000}K`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Sales"]}
                  />
                  <Legend />
                  <Bar dataKey="amount" name="Sales" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No sales data available for the selected period</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sales by brand pie chart */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales by Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {salesByBrand.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesByBrand}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="brand"
                      label={({ brand, percent }) => `${brand}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {salesByBrand.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCurrency(value), "Sales"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">No sales data available for the selected period</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent orders table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <TableRow key={order.order_id}>
                      <TableCell className="font-medium">{order.order_id}</TableCell>
                      <TableCell>{formatDate(order.order_date)}</TableCell>
                      <TableCell>{order.client_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(order.total_amount || 0)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">No orders found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesReport;
