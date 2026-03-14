import { Box, LayoutDashboard, Settings, ArrowLeftRight, PackageOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Inventory", href: "/inventory", icon: Box },
  { name: "Categories", href: "/categories", icon: PackageOpen },
  { name: "Movements", href: "/movements", icon: ArrowLeftRight },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden flex-col w-64 border-r border-border bg-card/50 px-4 py-8 md:flex glass min-h-[calc(100vh-4rem)]">
      <nav className="flex flex-1 flex-col space-y-1">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <div className="text-xs font-semibold leading-6 text-foreground/50 tracking-wider uppercase mb-2">Main</div>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || (item.href !== "/" && location.pathname.startsWith(item.href));
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        isActive
                          ? "bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                          : "text-foreground/70 hover:text-foreground hover:bg-card-foreground/5 dark:hover:bg-white/5",
                        "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-all duration-200"
                      )}
                    >
                      <item.icon
                        className={cn(
                          isActive ? "text-brand-600 dark:text-brand-400" : "text-foreground/40 group-hover:text-foreground/70",
                          "h-5 w-5 shrink-0"
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
          
          <li className="mt-auto">
            <Link
              to="/settings"
              className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 text-foreground/70 hover:bg-card-foreground/5 hover:text-foreground transition-all duration-200"
            >
              <Settings className="h-5 w-5 shrink-0 text-foreground/40 group-hover:text-foreground/70" aria-hidden="true" />
              Settings
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
