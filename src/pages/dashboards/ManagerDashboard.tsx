import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package, AlertTriangle, TrendingUp, Truck, ArrowLeftRight,
  ClipboardList, Loader2, ArrowDownRight, ArrowUpRight,
  CheckCircle2, XCircle, BarChart3
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import type { Operation, Item } from "../../types/database";

type RecentOp = Operation & {
  source_location?: { name: string } | null;
  destination_location?: { name: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300",
  WAITING: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  READY: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  DONE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  CANCELED: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400",
};

const OP_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  RECEIPT: { label: "Receipt", color: "text-emerald-500" },
  DELIVERY: { label: "Delivery", color: "text-rose-500" },
  INTERNAL: { label: "Transfer", color: "text-blue-500" },
  ADJUSTMENT: { label: "Adjustment", color: "text-purple-500" },
};

export function ManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    pendingTransfers: 0,
  });
  const [recentOps, setRecentOps] = useState<RecentOp[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [lowStockItems, setLowStockItems] = useState<Item[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Stats
      const { data: items } = await supabase.from("items").select("quantity, min_stock_level, name, sku");
      const totalProducts = items?.length || 0;
      const lowStockList = (items || []).filter((i: any) => i.quantity <= i.min_stock_level) as Item[];
      
      const { count: pendingReceipts } = await supabase
        .from("operations").select("*", { count: "exact", head: true })
        .eq("type", "RECEIPT").in("status", ["DRAFT", "WAITING", "READY"]);

      const { count: pendingDeliveries } = await supabase
        .from("operations").select("*", { count: "exact", head: true })
        .eq("type", "DELIVERY").in("status", ["DRAFT", "WAITING", "READY"]);

      const { count: pendingTransfers } = await supabase
        .from("operations").select("*", { count: "exact", head: true })
        .eq("type", "INTERNAL").in("status", ["DRAFT", "WAITING", "READY"]);

      // Recent Operations
      const { data: ops } = await supabase
        .from("operations")
        .select(`*, source_location:source_location_id(name), destination_location:destination_location_id(name)`)
        .order("created_at", { ascending: false })
        .limit(8);

      setStats({ totalProducts, lowStock: lowStockList.length, pendingReceipts: pendingReceipts || 0, pendingDeliveries: pendingDeliveries || 0, pendingTransfers: pendingTransfers || 0 });
      // @ts-ignore
      setRecentOps(ops || []);
      setLowStockItems(lowStockList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredOps = filter === "ALL" ? recentOps : recentOps.filter(o => o.type === filter);

  const kpis = [
    { label: "Total Products", value: stats.totalProducts, icon: Package, href: "/products", color: "from-brand-500 to-brand-700", iconBg: "bg-brand-500" },
    { label: "Low / Out of Stock", value: stats.lowStock, icon: AlertTriangle, href: "/products", color: "from-rose-500 to-rose-700", iconBg: "bg-rose-500" },
    { label: "Pending Receipts", value: stats.pendingReceipts, icon: Truck, href: "/operations/receipts", color: "from-emerald-500 to-teal-600", iconBg: "bg-emerald-500" },
    { label: "Pending Deliveries", value: stats.pendingDeliveries, icon: ArrowDownRight, href: "/operations/deliveries", color: "from-orange-500 to-orange-700", iconBg: "bg-orange-500" },
    { label: "Transfers Scheduled", value: stats.pendingTransfers, icon: ArrowLeftRight, href: "/operations/transfers", color: "from-purple-500 to-purple-700", iconBg: "bg-purple-500" },
  ];

  const timeAgo = (d: string) => {
    const s = Math.round((Date.now() - new Date(d).getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.round(s / 60)}m ago`;
    if (s < 86400) return `${Math.round(s / 3600)}h ago`;
    return `${Math.round(s / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-brand-500 mx-auto" />
          <p className="text-sm text-foreground/50">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-brand-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-500">Manager View</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-foreground/50 mt-1 text-sm">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/operations/receipts" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25">
            <Truck className="h-4 w-4" />
            New Receipt
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            to={kpi.href}
            className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 transition-all duration-300 card-hover"
          >
            <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br", kpi.color)} style={{ opacity: 0 }} />
            <div className="relative p-5">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-sm", kpi.iconBg)}>
                  <kpi.icon className="h-5 w-5 text-white" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-foreground/20 group-hover:text-foreground/50 transition-colors" />
              </div>
              <div className="text-3xl font-bold mb-1">{kpi.value}</div>
              <div className="text-xs font-medium text-foreground/50">{kpi.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Operations + Low Stock Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Recent Operations */}
        <div className="xl:col-span-2 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <h2 className="font-semibold text-sm">Recent Operations</h2>
            <div className="flex gap-1 flex-wrap">
              {["ALL", "RECEIPT", "DELIVERY", "INTERNAL", "ADJUSTMENT"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors",
                    filter === t
                      ? "bg-brand-600 text-white"
                      : "bg-card-foreground/5 text-foreground/50 hover:text-foreground hover:bg-card-foreground/10"
                  )}
                >
                  {t === "ALL" ? "All" : OP_TYPE_LABELS[t]?.label}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-border/50">
            {filteredOps.length === 0 ? (
              <div className="py-12 text-center text-foreground/40 text-sm">
                <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No operations found
              </div>
            ) : (
              filteredOps.map((op) => (
                <div key={op.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-card-foreground/3 card-hover transition-colors group cursor-default">
                  <div className="shrink-0">
                    <div className={cn("text-xs font-bold", OP_TYPE_LABELS[op.type]?.color)}>
                      {OP_TYPE_LABELS[op.type]?.label}
                    </div>
                    <div className="font-mono text-[10px] text-foreground/40 mt-0.5">{op.reference || "Pending"}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-foreground/70 truncate">
                      {op.source_location?.name ? `${op.source_location.name} → ` : ""}
                      {op.destination_location?.name || "-"}
                    </div>
                    <div className="text-[10px] text-foreground/40 mt-0.5">{timeAgo(op.created_at)}</div>
                  </div>
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", STATUS_COLORS[op.status])}>
                    {op.status}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="px-6 py-3 border-t border-border/60">
            <Link to="/history" className="text-xs text-brand-500 hover:text-brand-600 font-semibold">View full move history →</Link>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Low Stock Alerts
            </h2>
            <span className="text-[11px] font-bold text-rose-500 bg-rose-100 dark:bg-rose-500/10 px-2 py-0.5 rounded-full">
              {lowStockItems.length}
            </span>
          </div>
          <div className="divide-y divide-border/50 max-h-80 overflow-y-auto">
            {lowStockItems.length === 0 ? (
              <div className="py-12 text-center text-emerald-500 text-sm">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2" />
                All stock levels healthy!
              </div>
            ) : (
              lowStockItems.map((item) => (
                <div key={item.id} className="px-6 py-3 flex items-center justify-between gap-2 hover:bg-rose-50/50 dark:hover:bg-rose-500/5 transition-colors group">
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">{item.name}</div>
                    <div className="font-mono text-[10px] text-foreground/40">{item.sku}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn("text-sm font-bold", item.quantity === 0 ? "text-rose-500" : "text-amber-500")}>
                      {item.quantity}
                    </div>
                    <div className="text-[10px] text-foreground/40">/ {item.min_stock_level} min</div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="px-6 py-3 border-t border-border/60">
            <Link to="/operations/receipts" className="text-xs text-brand-500 hover:text-brand-600 font-semibold">Create Receipt →</Link>
          </div>
        </div>
      </div>

      {/* Today's Snapshot Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Operations Today", value: recentOps.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length, icon: TrendingUp, color: "text-brand-500" },
          { label: "Completed Today", value: recentOps.filter(o => o.status === "DONE" && new Date(o.created_at).toDateString() === new Date().toDateString()).length, icon: CheckCircle2, color: "text-emerald-500" },
          { label: "Canceled/Blocked", value: recentOps.filter(o => o.status === "CANCELED").length, icon: XCircle, color: "text-rose-500" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-4 p-5 rounded-2xl border border-border bg-card card-hover">
            <item.icon className={cn("h-8 w-8 shrink-0", item.color)} />
            <div>
              <div className="text-2xl font-bold">{item.value}</div>
              <div className="text-xs text-foreground/50">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
