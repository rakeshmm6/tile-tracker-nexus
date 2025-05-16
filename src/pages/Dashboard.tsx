import React, { useEffect, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import Layout from "@/components/Layout";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { getDashboardStats } from "@/lib/database";
import { formatCurrency } from "@/lib/utils";

// Mock data for charts
const monthlyRevenue = [
  { name: "Jan", revenue: 12000 },
  { name: "Feb", revenue: 19000 },
  { name: "Mar", revenue: 15000 },
  { name: "Apr", revenue: 22000 },
  { name: "May", revenue: 28000 },
  { name: "Jun", revenue: 25000 },
];

const productPerformance = [
  { name: "Johnson Tiles", value: 35 },
  { name: "Kajaria", value: 25 },
  { name: "Somany", value: 20 },
  { name: "RAK Ceramics", value: 15 },
  { name: "Orient Bell", value: 5 },
];

const Dashboard = () => {
  const [stats, setStats] = useState({
    inventory_value: 0,
    boxes_in_stock: 0,
    order_count: 0,
    sales_revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Layout>
      <PageHeader 
        title="Dashboard" 
        description="Overview of your business performance"
      />

      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6 mb-8">
        <StatCard
          title="Total Inventory Value"
          value={formatCurrency(stats.inventory_value)}
          description="Current stock value"
          icon="money"
          trend={5.2}
          className="p-4 sm:p-6"
        />
        <StatCard
          title="Boxes in Stock"
          value={stats.boxes_in_stock}
          description="Across all products"
          icon="boxes"
          trend={-2.3}
          className="p-4 sm:p-6"
        />
        <StatCard
          title="Total Orders"
          value={stats.order_count}
          description="Lifetime orders"
          icon="orders"
          trend={8.1}
          className="p-4 sm:p-6"
        />
        <StatCard
          title="Sales Revenue"
          value={formatCurrency(stats.sales_revenue)}
          description="Total sales"
          icon="sales"
          trend={12.5}
          className="p-4 sm:p-6"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm w-full">
          <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-md hover:bg-gray-50">
                <div className="bg-primary/10 rounded-full p-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="font-medium">New order received</p>
                  <p className="text-sm text-gray-500">Order #{2023000 + i} has been placed by Client {i}</p>
                </div>
                <div className="text-xs text-gray-500 ml-auto">{i} hour{i > 1 ? 's' : ''} ago</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg border shadow-sm w-full flex flex-col">
          <h2 className="text-lg font-medium mb-4">Monthly Revenue</h2>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `₹${v / 1000}K`} />
                <Tooltip formatter={(v) => [formatCurrency(Number(v)), 'Revenue']} />
                <Bar dataKey="revenue" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
