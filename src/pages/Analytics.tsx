import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, TrendingDown, Package, Layers, Activity, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";

export function Analytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalValue: 0,
    totalItems: 0,
    operationsThisMonth: 0,
    topProducts: [] as { name: string; qty: number; value: number }[],
    recentActivity: [] as { date: string; type: string; count: number }[]
  });

  useEffect(() => { fetchAnalytics(); }, []);

  async function fetchAnalytics() {
    setLoading(true);

    // 1. Value & Items
    const { data: items } = await supabase.from("items").select("name, quantity, price");
    let val = 0; let qty = 0;
    const top = [];
    
    if (items) {
      for (const item of items) {
        const itemVal = (item.quantity || 0) * (item.price || 0);
        val += itemVal;
        qty += (item.quantity || 0);
        top.push({ name: item.name, qty: item.quantity || 0, value: itemVal });
      }
    }
    
    top.sort((a, b) => b.value - a.value);

    // 2. Operations this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const { count } = await supabase.from("operations")
      .select("*", { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    setStats({
      totalValue: val,
      totalItems: qty,
      operationsThisMonth: count || 0,
      topProducts: top.slice(0, 5),
      recentActivity: []
    });

    setLoading(false);
  }

  if (loading) {
    return <div className="py-24 text-center"><Loader2 className="h-8 w-8 animate-spin text-brand-500 mx-auto" /></div>;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics Explorer</h1>
        <p className="text-foreground/50 mt-1 text-sm">Deep dive into your inventory valuation and movement metrics.</p>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-2xl p-6 border border-border shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500">+4.2%</span>
          </div>
          <h3 className="text-foreground/50 text-sm font-medium mb-1">Total Inventory Value</h3>
          <p className="text-3xl font-bold">${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>

        <div className="glass rounded-2xl p-6 border border-border shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-brand-500/10 text-brand-500">
              <Package className="h-6 w-6" />
            </div>
          </div>
          <h3 className="text-foreground/50 text-sm font-medium mb-1">Total Physical Items</h3>
          <p className="text-3xl font-bold">{stats.totalItems.toLocaleString()}</p>
        </div>

        <div className="glass rounded-2xl p-6 border border-border shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
              <Activity className="h-6 w-6" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500">This Month</span>
          </div>
          <h3 className="text-foreground/50 text-sm font-medium mb-1">Stock Movements</h3>
          <p className="text-3xl font-bold">{stats.operationsThisMonth.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products by Value */}
        <div className="glass rounded-2xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border/50">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-brand-500" />
              Highest Value Assets
            </h3>
            <p className="text-sm text-foreground/50">Products contributing most to inventory valuation.</p>
          </div>
          <div className="p-6">
            <div className="space-y-5">
              {stats.topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-card border border-border flex items-center justify-center font-bold text-sm text-foreground/40">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{p.name}</p>
                    <p className="text-xs text-foreground/50">{p.qty} in stock</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${p.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <div className="w-24 h-1.5 bg-card rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-brand-500 rounded-full" 
                        style={{ width: `${stats.totalValue > 0 ? (p.value / stats.totalValue) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {stats.topProducts.length === 0 && (
                <p className="text-sm text-foreground/40 text-center py-4">No product data available yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Placeholder Graphic */}
        <div className="glass rounded-2xl border border-border p-6 flex flex-col items-center justify-center text-center">
          <div className="relative w-48 h-48 mb-6">
             <div className="absolute inset-0 border-4 border-brand-500/20 rounded-full"></div>
             <div className="absolute inset-2 border-4 border-t-brand-500 border-r-indigo-500 border-b-purple-500 border-l-transparent rounded-full animate-spin [animation-duration:3s]"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <BarChart3 className="h-12 w-12 text-foreground/30" />
             </div>
          </div>
          <h3 className="text-xl font-bold mb-2">Advanced Reports Processing</h3>
          <p className="text-sm text-foreground/50 max-w-sm">
            Our analytics engine is gathering more historical data. Check back soon for predictive forecasting and detailed stock aging reports.
          </p>
        </div>
      </div>
    </div>
  );
}
