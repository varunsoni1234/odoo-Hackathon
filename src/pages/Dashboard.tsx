import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowDownRight, ArrowUpRight, Box, Package, AlertTriangle, TrendingUp, Loader2, ArrowRightLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";
import type { Movement, Item } from "../types/database";

type MovementWithItem = Movement & { items: Pick<Item, 'name'> | null };

export function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    totalCategories: 0,
    monthlyMovements: 0
  });
  const [recentMovements, setRecentMovements] = useState<MovementWithItem[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);

      // 1. Fetch Total Products & Low Stock
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("quantity, min_stock_level");
      if (itemsError) throw itemsError;

      const totalProducts = itemsData?.length || 0;
      const lowStockItems = itemsData?.filter(i => i.quantity <= i.min_stock_level).length || 0;

      // 2. Fetch Total Categories
      const { count: categoriesCount, error: catError } = await supabase
        .from("categories")
        .select("*", { count: 'exact', head: true });
      if (catError) throw catError;

      // 3. Fetch Monthly Movements
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { count: movementsCount, error: movCountError } = await supabase
        .from("movements")
        .select("*", { count: 'exact', head: true })
        .gte("created_at", firstDayOfMonth.toISOString());
      if (movCountError) throw movCountError;

      // 4. Fetch Recent Movements (last 5)
      const { data: recentData, error: recentError } = await supabase
        .from("movements")
        .select(`
          *,
          items (
            name
          )
        `)
        .order("created_at", { ascending: false })
        .limit(5);
      if (recentError) throw recentError;

      setStats({
        totalProducts,
        lowStockItems,
        totalCategories: categoriesCount || 0,
        monthlyMovements: movementsCount || 0
      });
      
      // @ts-ignore
      setRecentMovements(recentData || []);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { name: "Total Products", value: stats.totalProducts.toString(), icon: Box, color: "text-brand-600 dark:text-brand-400", bg: "bg-brand-100 dark:bg-brand-900/30" },
    { name: "Low Stock Items", value: stats.lowStockItems.toString(), icon: AlertTriangle, color: stats.lowStockItems > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400", bg: stats.lowStockItems > 0 ? "bg-rose-100 dark:bg-rose-900/30" : "bg-emerald-100 dark:bg-emerald-900/30" },
    { name: "Total Categories", value: stats.totalCategories.toString(), icon: Package, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
    { name: "Movements (This Month)", value: stats.monthlyMovements.toString(), icon: TrendingUp, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30" },
  ];

  const getMovementIcon = (type: string) => {
    switch(type) {
      case 'IN': return <ArrowDownRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'OUT': return <ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      default: return <ArrowRightLeft className="w-4 h-4 text-brand-600 dark:text-brand-400" />;
    }
  };

  const timeAgo = (dateInput: string) => {
    const date = new Date(dateInput);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center animate-fade-in">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1 text-foreground/60">
            Welcome back! Here's what's happening with your stock today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/movements" className="px-4 py-2 rounded-md bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20">
            + Record Movement
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="glass rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full" />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60">{stat.name}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className={cn("p-3 rounded-full", stat.bg, stat.color)}>
                <stat.icon className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass rounded-xl shadow-sm border border-border p-6 min-h-[400px]">
          <h2 className="text-lg font-semibold mb-6">Stock Movement Trends</h2>
          <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-lg bg-card/20 p-8 text-center">
             <TrendingUp className="h-12 w-12 text-foreground/20 mb-4" />
             <h3 className="font-medium text-foreground/80 text-lg">Detailed Analytics</h3>
             <p className="text-foreground/50 text-sm max-w-sm mt-2">
               Connect a charting library like Recharts here to visualize the `IN` and `OUT` movements over the past 30 days.
             </p>
          </div>
        </div>

        <div className="glass rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Link to="/movements" className="text-sm text-brand-500 hover:text-brand-600 font-medium transition-colors">View all</Link>
          </div>
          
          {recentMovements.length === 0 ? (
            <div className="text-center py-8 text-foreground/50">
              <p>No recent movements.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {recentMovements.map((movement) => (
                <div key={movement.id} className="flex items-start gap-4">
                  <div className={cn(
                    "mt-0.5 p-2 rounded-full flex-shrink-0 transition-colors",
                    movement.type === "IN" ? "bg-emerald-100 dark:bg-emerald-900/30" : 
                    movement.type === "OUT" ? "bg-rose-100 dark:bg-rose-900/30" : 
                    "bg-brand-100 dark:bg-brand-900/30"
                  )}>
                    {getMovementIcon(movement.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight">{movement.items?.name || "Unknown Item"}</p>
                    <p className="text-xs text-foreground/50 mt-1">{timeAgo(movement.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-bold",
                      movement.quantity > 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                    </p>
                    <p className="text-[10px] text-foreground/40 font-mono mt-0.5">{movement.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
