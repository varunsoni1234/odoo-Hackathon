import {
  LayoutDashboard, Package, PackageSearch, Tags, Truck, 
  ArrowLeftRight, ClipboardList, History, Settings, Warehouse,
  User, LogOut, ChevronDown, BarChart3
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "../../lib/utils";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../providers/AuthProvider";

const mainNav = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
];

const productNav = [
  { name: "Products", href: "/products", icon: Package },
  { name: "Categories", href: "/categories", icon: Tags },
  { name: "Suppliers", href: "/suppliers", icon: PackageSearch },
];

const operationNav = [
  { name: "Receipts", href: "/operations/receipts", icon: Truck },
  { name: "Delivery Orders", href: "/operations/deliveries", icon: ArrowLeftRight },
  { name: "Internal Transfers", href: "/operations/transfers", icon: ArrowLeftRight },
  { name: "Stock Adjustments", href: "/operations/adjustments", icon: ClipboardList },
];

const reportNav = [
  { name: "Move History", href: "/history", icon: History },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
];

const settingsNav = [
  { name: "Warehouses", href: "/settings/warehouses", icon: Warehouse },
];

type NavGroupProps = {
  title: string;
  items: { name: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
  currentPath: string;
};

function NavGroup({ title, items, currentPath }: NavGroupProps) {
  const [open, setOpen] = useState(true);
  return (
    <li>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-[11px] font-bold tracking-widest uppercase text-foreground/40 mb-2 hover:text-foreground/60 transition-colors px-2"
      >
        {title}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open ? "rotate-0" : "-rotate-90")} />
      </button>
      {open && (
        <ul className="-mx-2 space-y-0.5">
          {items.map((item) => {
            const isActive = currentPath === item.href || (item.href !== "/" && currentPath.startsWith(item.href));
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    "group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                      : "text-foreground/60 hover:text-foreground hover:bg-card-foreground/5"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-foreground/40 group-hover:text-foreground/70")} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <aside className="hidden flex-col w-64 border-r border-border/60 bg-card/40 backdrop-blur-xl md:flex h-screen sticky top-0 overflow-y-auto">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-3 px-6 border-b border-border/60">
        <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
          <Package className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-sm">StockFlow IMS</span>
          <p className="text-[10px] text-foreground/40 capitalize">{profile?.role || "Loading..."}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-4 py-4 gap-6">
        {/* Main */}
        <ul className="-mx-2 space-y-0.5">
          {mainNav.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={cn(
                    "group flex items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                      : "text-foreground/60 hover:text-foreground hover:bg-card-foreground/5"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-foreground/40 group-hover:text-foreground/70")} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        <NavGroup title="Products" items={productNav} currentPath={location.pathname} />
        <NavGroup title="Operations" items={operationNav} currentPath={location.pathname} />
        <NavGroup title="Reports" items={reportNav} currentPath={location.pathname} />
        <NavGroup title="Settings" items={settingsNav} currentPath={location.pathname} />
      </nav>

      {/* User Profile at Bottom */}
      <div className="border-t border-border/60 p-4 space-y-1">
        <Link
          to="/profile"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/60 hover:text-foreground hover:bg-card-foreground/5 transition-all"
        >
          <div className="h-7 w-7 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center shrink-0">
            <User className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{profile?.full_name || "My Profile"}</p>
            <p className="text-[10px] text-foreground/40 capitalize">{profile?.role || "staff"}</p>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-500/80 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
