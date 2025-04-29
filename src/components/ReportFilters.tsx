
import React from "react";
import { Filter, CalendarRange } from "lucide-react";
import { 
  Card,  
  CardContent, 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReportFiltersProps {
  timeRange: string;
  setTimeRange: (range: string) => void;
  brandFilter: string | null;
  setBrandFilter: (brand: string | null) => void;
  brands: string[];
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  timeRange,
  setTimeRange,
  brandFilter,
  setBrandFilter,
  brands
}) => {
  const uniqueBrands = Array.from(new Set(brands)).sort();

  return (
    <Card className="mb-6">
      <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-muted-foreground" />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select 
            value={brandFilter || "all"} 
            onValueChange={(value) => setBrandFilter(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {uniqueBrands.map(brand => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportFilters;
