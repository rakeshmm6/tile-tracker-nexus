
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  Package, 
  ClipboardList, 
  BarChart4, 
  Settings,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: "Dashboard", path: "/", icon: Home },
  { name: "Inventory", path: "/inventory", icon: Package },
  { name: "Orders", path: "/orders", icon: ClipboardList },
  { name: "Reports", path: "/reports", icon: BarChart4 },
  { name: "Settings", path: "/settings", icon: Settings, adminOnly: true },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Filter nav items based on role
  const filteredNavItems = navItems.filter(item => 
    !item.adminOnly || (item.adminOnly && isAdmin())
  );

  return (
    <div className="h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Mobile header */}
      <div className="md:hidden bg-white border-b flex items-center justify-between p-4">
        <h1 className="text-xl font-bold">Tile Tracker</h1>
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar for mobile (overlay) */}
      <div 
        className={cn(
          "fixed inset-0 z-50 md:hidden bg-black/50 transition-opacity",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div 
        className={cn(
          "fixed md:static z-50 h-full w-64 transform transition-transform duration-300 ease-in-out bg-white border-r p-4",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Tile Tracker</h1>
          <button 
            onClick={toggleSidebar}
            className="p-1 rounded-md text-gray-600 hover:bg-gray-100 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="space-y-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center px-4 py-3 text-gray-700 rounded-md transition-colors",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-gray-100"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-50 rounded-lg p-4 mb-2">
            <p className="text-xs text-gray-500">Logged in as</p>
            <div className="flex justify-between items-center">
              <p className="font-medium">{user?.username || 'User'} ({user?.role || 'guest'})</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={logout}
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
