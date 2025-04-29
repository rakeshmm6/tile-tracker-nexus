
import React from "react";
import { 
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign, 
  Package,
  BarChart, 
  ShoppingCart
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: number;
  icon?: "money" | "boxes" | "orders" | "sales";
  className?: string;
}

export default function StatCard({
  title,
  value,
  description,
  trend,
  icon = "money",
  className,
}: StatCardProps) {
  const getIcon = () => {
    const iconProps = { className: "h-6 w-6" };
    
    switch(icon) {
      case "money":
        return <CircleDollarSign {...iconProps} className={cn(iconProps.className, "text-green-500")} />;
      case "boxes":
        return <Package {...iconProps} className={cn(iconProps.className, "text-blue-500")} />;
      case "orders":
        return <ShoppingCart {...iconProps} className={cn(iconProps.className, "text-purple-500")} />;
      case "sales":
        return <BarChart {...iconProps} className={cn(iconProps.className, "text-orange-500")} />;
      default:
        return <CircleDollarSign {...iconProps} className={cn(iconProps.className, "text-primary")} />;
    }
  };

  return (
    <div className={cn("bg-white p-6 rounded-lg border shadow-sm", className)}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {description && (
            <p className="text-gray-500 text-sm mt-1">{description}</p>
          )}
        </div>
        <div className="p-2 rounded-full bg-gray-50">
          {getIcon()}
        </div>
      </div>
      
      {typeof trend === "number" && (
        <div className="mt-3 flex items-center">
          {trend > 0 ? (
            <>
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500 ml-1">
                {Math.abs(trend)}%
              </span>
            </>
          ) : (
            <>
              <ArrowDownRight className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-500 ml-1">
                {Math.abs(trend)}%
              </span>
            </>
          )}
          <span className="text-sm text-gray-500 ml-2">from last month</span>
        </div>
      )}
    </div>
  );
}
