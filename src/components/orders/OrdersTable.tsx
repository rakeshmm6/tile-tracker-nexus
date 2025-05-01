
import React from "react";
import { ArrowUpDown, FileText, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Order } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface OrdersTableProps {
  currentItems: Order[];
  loading: boolean;
  searchQuery: string;
  handleSort: (field: "date" | "client" | "amount") => void;
  sortField: "date" | "client" | "amount";
  confirmDeleteOrder: (orderId: string) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  currentItems,
  loading,
  searchQuery,
  handleSort,
  sortField,
  confirmDeleteOrder,
}) => {
  const { isAdmin } = useAuth();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3">Order ID</th>
            <th 
              scope="col" 
              className="px-6 py-3 cursor-pointer" 
              onClick={() => handleSort("date")}
            >
              <div className="flex items-center">
                Date
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </th>
            <th 
              scope="col" 
              className="px-6 py-3 cursor-pointer"
              onClick={() => handleSort("client")}
            >
              <div className="flex items-center">
                Client
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </th>
            <th scope="col" className="px-6 py-3">Phone</th>
            <th scope="col" className="px-6 py-3">Items</th>
            <th 
              scope="col" 
              className="px-6 py-3 cursor-pointer"
              onClick={() => handleSort("amount")}
            >
              <div className="flex items-center">
                Amount
                <ArrowUpDown className="ml-1 h-4 w-4" />
              </div>
            </th>
            <th scope="col" className="px-6 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center">
                Loading order data...
              </td>
            </tr>
          ) : currentItems.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-6 py-4 text-center">
                {searchQuery ? "No matching orders found" : "No orders found. Create one!"}
              </td>
            </tr>
          ) : (
            currentItems.map((order) => (
              <tr key={order.order_id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{order.order_id}</td>
                <td className="px-6 py-4">{formatDate(order.order_date)}</td>
                <td className="px-6 py-4">{order.client_name}</td>
                <td className="px-6 py-4">{order.client_phone}</td>
                <td className="px-6 py-4">{order.items?.length || 0}</td>
                <td className="px-6 py-4">
                  {order.total_amount ? formatCurrency(order.total_amount) : "-"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      asChild
                    >
                      <Link to={`/orders/${order.order_id}`}>
                        <FileText className="h-4 w-4" />
                      </Link>
                    </Button>
                    {isAdmin() && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => confirmDeleteOrder(order.order_id!)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersTable;
