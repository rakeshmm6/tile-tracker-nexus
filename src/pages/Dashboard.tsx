
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Inventory Value"
          value={formatCurrency(stats.inventory_value)}
          description="Current stock value"
          icon="money"
          trend={5.2}
        />
        <StatCard
          title="Boxes in Stock"
          value={stats.boxes_in_stock}
          description="Across all products"
          icon="boxes"
          trend={-2.3}
        />
        <StatCard
          title="Total Orders"
          value={stats.order_count}
          description="Lifetime orders"
          icon="orders"
          trend={8.1}
        />
        <StatCard
          title="Sales Revenue"
          value={formatCurrency(stats.sales_revenue)}
          description="Total sales"
          icon="sales"
          trend={12.5}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-medium mb-4">Monthly Revenue</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyRevenue}
                margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis
                  tickFormatter={(value) => `₹${value / 1000}k`}
                />
                <Tooltip
                  formatter={(value) => [`₹${value}`, "Revenue"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#4f46e5" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h2 className="text-lg font-medium mb-4">Product Performance</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={productPerformance}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 50, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" domain={[0, 'dataMax']} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip formatter={(value) => [`${value}%`, "Market Share"]} />
                <Bar 
                  dataKey="value" 
                  fill="#0ea5e9" 
                  radius={[0, 4, 4, 0]} 
                  barSize={30}
                  label={{ position: 'right', formatter: (value) => `${value}%` }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white p-6 rounded-lg border shadow-sm">
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
    </Layout>
  );
};

export default Dashboard;
