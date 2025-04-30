
import React, { useState, useEffect, useMemo } from "react";
import { 
  FileBarChart, 
  Filter,
  CalendarRange,
  ArrowDownUp
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
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

import Layout from "@/components/Layout";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { getInventory, getOrdersWithItems } from "@/lib/database";
import { formatCurrency } from "@/lib/utils";
import ReportFilters from "@/components/ReportFilters";
import SalesReport from "@/components/reports/SalesReport";
import InventoryReport from "@/components/reports/InventoryReport";
import { InventoryItem, Order } from "@/lib/types";

const Reports = () => {
  const [activeTab, setActiveTab] = useState("sales");
  const [timeRange, setTimeRange] = useState("all");
  const [brandFilter, setBrandFilter] = useState<string | null>(null);

  // Fetch orders data
  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: getOrdersWithItems
  });

  // Fetch inventory data
  const inventoryQuery = useQuery({
    queryKey: ['inventory'],
    queryFn: getInventory
  });

  // Loading state
  const isLoading = ordersQuery.isLoading || inventoryQuery.isLoading;

  // Extract brands from inventory for filters
  const brands = useMemo(() => {
    if (!inventoryQuery.data) return [];
    return Array.from(new Set(inventoryQuery.data.map(item => item.brand)));
  }, [inventoryQuery.data]);

  return (
    <Layout>
      <PageHeader 
        title="Business Reports" 
        description="Analyze sales performance and inventory metrics"
      >
        <Button variant="outline" className="gap-2">
          <FileBarChart className="h-4 w-4" />
          Export Reports
        </Button>
      </PageHeader>

      <Tabs defaultValue="sales" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="sales">Sales Analysis</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Analysis</TabsTrigger>
        </TabsList>
        
        <ReportFilters 
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          brandFilter={brandFilter}
          setBrandFilter={setBrandFilter}
          brands={brands}
        />
        
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[180px]" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <TabsContent value="sales" className="space-y-6">
              <SalesReport 
                orders={ordersQuery.data || []} 
                timeRange={timeRange}
                brandFilter={brandFilter}
              />
            </TabsContent>
            <TabsContent value="inventory" className="space-y-6">
              <InventoryReport 
                inventory={inventoryQuery.data || []} 
                orders={ordersQuery.data || []}
                brandFilter={brandFilter}
              />
            </TabsContent>
          </>
        )}
      </Tabs>
    </Layout>
  );
};

export default Reports;
