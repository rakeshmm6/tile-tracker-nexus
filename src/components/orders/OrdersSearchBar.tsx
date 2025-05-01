
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface OrdersSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const OrdersSearchBar: React.FC<OrdersSearchBarProps> = ({
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div className="p-4">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>
    </div>
  );
};

export default OrdersSearchBar;
