import { ArrowDownRight, ArrowUpRight, Box, Package, AlertTriangle, TrendingUp } from "lucide-react";
import { cn } from "../lib/utils";

const stats = [
  { name: "Total Products", value: "2,543", icon: Box, change: "+12.5%", changeType: "increase" },
  { name: "Low Stock Items", value: "14", icon: AlertTriangle, change: "-2.1%", changeType: "decrease" },
  { name: "Total Categories", value: "48", icon: Package, change: "+0%", changeType: "neutral" },
  { name: "Monthly Movements", value: "1,201", icon: TrendingUp, change: "+28.4%", changeType: "increase" },
];

const recentMovements = [
  { id: 1, item: "MacBook Pro M2", type: "IN", quantity: 50, date: "2 mins ago", status: "completed" },
  { id: 2, item: "Ergonomic Chair", type: "OUT", quantity: -12, date: "1 hour ago", status: "completed" },
  { id: 3, item: "Wireless Mouse", type: "OUT", quantity: -5, date: "3 hours ago", status: "completed" },
  { id: 4, item: "Mechanical Keyboard", type: "IN", quantity: 20, date: "5 hours ago", status: "completed" },
];

export function Dashboard() {
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
          <button className="px-4 py-2 rounded-md bg-card border border-border text-sm font-medium hover:bg-card-foreground/5 transition-colors">
            Download Report
          </button>
          <button className="px-4 py-2 rounded-md bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20">
            + New Stock
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="glass rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden group"
          >
            {/* Subtle highlight effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full" />
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60">{stat.name}</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <p className="text-3xl font-bold">{stat.value}</p>
                  {stat.changeType !== "neutral" && (
                     <span className={cn(
                       "text-xs font-semibold flex items-center",
                       stat.changeType === "increase" ? "text-emerald-500" : "text-rose-500"
                     )}>
                       {stat.changeType === "increase" ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                       {stat.change}
                     </span>
                  )}
                </div>
              </div>
              <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-full text-brand-600 dark:text-brand-400">
                <stat.icon className="h-6 w-6" aria-hidden="true" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass rounded-xl shadow-sm border border-border p-6 min-h-[400px]">
          <h2 className="text-lg font-semibold mb-6">Stock Movement Trends</h2>
          <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-border/50 rounded-lg bg-card/20">
             <p className="text-muted-foreground/50">Chart Visualization Placeholder</p>
          </div>
        </div>

        <div className="glass rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <button className="text-sm text-brand-500 hover:text-brand-600 font-medium">View all</button>
          </div>
          <div className="space-y-6">
            {recentMovements.map((movement) => (
              <div key={movement.id} className="flex items-start gap-4">
                <div className={cn(
                  "mt-0.5 p-2 rounded-full flex-shrink-0",
                  movement.type === "IN" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
                )}>
                  {movement.type === "IN" ? <TrendingUp className="h-4 w-4" /> : <TrendingUp className="h-4 w-4 rotate-180" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{movement.item}</p>
                  <p className="text-xs text-foreground/50 mt-1">{movement.date}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-bold",
                    movement.type === "IN" ? "text-emerald-500" : "text-rose-500"
                  )}>
                    {movement.type === "IN" ? "+" : ""}{movement.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
