import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  FileText,
  BarChart3,
  LogOut,
  Calculator,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { logout } = useAuth();

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Inventory",
      href: "/inventory",
      icon: Package,
    },
    {
      name: "Orders",
      href: "/orders",
      icon: FileText,
    },
    {
      name: "Reports",
      href: "/reports",
      icon: BarChart3,
    },
    {
      name: "Price Calculator",
      href: "/price-calculator",
      icon: Calculator,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Side Navigation */}
      <nav className="fixed top-0 left-0 h-full w-64 bg-white border-r shadow-sm">
        <div className="flex flex-col h-full">
          <div className="flex-1 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-6 py-3 text-sm font-medium",
                    isActive
                      ? "bg-gray-100 text-primary border-r-2 border-primary"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </div>
          <div className="p-4 border-t">
            <button
              onClick={logout}
              className="flex items-center px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pl-64">
        <main className="py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
