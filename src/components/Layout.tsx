import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  FileText,
  BarChart3,
  LogOut,
  Calculator,
  Menu as MenuIcon,
  X as CloseIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    {
      name: "Inventory In",
      href: "/inventory-in",
      icon: Package,
    },
    {
      name: "Ledger",
      href: "/ledger",
      icon: FileText,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile Hamburger */}
      <button
        className="fixed top-4 right-4 z-40 lg:hidden bg-white rounded-full p-2 shadow border"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      {/* Sidebar (drawer on mobile, fixed on desktop) */}
      <nav
        className={
          cn(
            "fixed top-0 left-0 h-full w-64 bg-white border-r shadow-sm z-50 transition-transform duration-200 lg:static lg:translate-x-0 lg:flex lg:flex-col",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            "lg:translate-x-0"
          )
        }
        style={{ willChange: "transform" }}
      >
        {/* Close button on mobile */}
        <div className="flex items-center justify-between lg:hidden p-4 border-b">
          <span className="font-bold text-lg">Menu</span>
          <button onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>
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
                  onClick={() => setSidebarOpen(false)}
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

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 w-full lg:pr-64">
        <main className="px-2 sm:px-4 lg:px-8 transition-all duration-200">
          {children}
        </main>
      </div>
    </div>
  );
}
