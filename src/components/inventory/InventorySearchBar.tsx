
import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface InventorySearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  totalInventoryValue: number;
}

const InventorySearchBar: React.FC<InventorySearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  totalInventoryValue,
}) => {
  return (
    <div className="p-4 flex flex-col md:flex-row gap-4 justify-between border-b">
      <div className="relative w-full md:w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="text-sm text-gray-500">
        Total Inventory Value: <span className="font-medium">{formatCurrency(totalInventoryValue)}</span>
      </div>
    </div>
  );
};

export default InventorySearchBar;
