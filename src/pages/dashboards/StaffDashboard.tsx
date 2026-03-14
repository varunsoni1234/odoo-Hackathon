import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Truck, ArrowLeftRight, ClipboardList, Loader2, Package,
  CheckCircle2, Clock, AlertTriangle, Inbox
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import type { Operation } from "../../types/database";

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

const OP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  RECEIPT: Truck,
  DELIVERY: ArrowLeftRight,
  INTERNAL: ArrowLeftRight,
  ADJUSTMENT: ClipboardList,
};

const OP_COLORS: Record<string, string> = {
  RECEIPT: "text-emerald-500 bg-emerald-100 dark:bg-emerald-500/10",
  DELIVERY: "text-rose-500 bg-rose-100 dark:bg-rose-500/10",
  INTERNAL: "text-blue-500 bg-blue-100 dark:bg-blue-500/10",
  ADJUSTMENT: "text-purple-500 bg-purple-100 dark:bg-purple-500/10",
};

type TaskSectionProps = {
  title: string;
  ops: RecentOp[];
  href: string;
  emptyText: string;
  type: string;
};

function TaskSection({ title, ops, href, emptyText, type }: TaskSectionProps) {
  const Icon = OP_ICONS[type] || Package;
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center", OP_COLORS[type])}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <h2 className="font-semibold text-sm">{title}</h2>
        </div>
        <span className="text-xs font-bold text-foreground/50 bg-card-foreground/5 px-2 py-0.5 rounded-full">
          {ops.length}
        </span>
      </div>
      <div className="divide-y divide-border/50">
        {ops.length === 0 ? (
          <div className="py-8 text-center text-foreground/40 text-xs">
            <CheckCircle2 className="h-6 w-6 mx-auto mb-1.5 text-emerald-400" />
            {emptyText}
          </div>
        ) : (
          ops.slice(0, 4).map((op) => (
            <div key={op.id} className="px-5 py-3 flex items-center gap-3 hover:bg-card-foreground/3 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="font-mono text-[10px] text-foreground/40">{op.reference || "REF-PENDING"}</div>
                <div className="text-xs text-foreground/70 truncate mt-0.5">
                  {op.destination_location?.name || op.source_location?.name || "No Location Set"}
                </div>
              </div>
              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", STATUS_COLORS[op.status])}>
                {op.status}
              </span>
            </div>
          ))
        )}
      </div>
      <div className="px-5 py-3 border-t border-border/60">
        <Link to={href} className="text-xs text-brand-500 hover:text-brand-600 font-semibold">
          View all {title} →
        </Link>
      </div>
    </div>
  );
}

export function StaffDashboard() {
  const [loading, setLoading] = useState(true);
  const [todayOps, setTodayOps] = useState({
    receipts: [] as RecentOp[],
    deliveries: [] as RecentOp[],
    transfers: [] as RecentOp[],
    adjustments: [] as RecentOp[],
  });
  const [doneCount, setDoneCount] = useState(0);
  const [totalToday, setTotalToday] = useState(0);

  useEffect(() => { fetchTasks(); }, []);

  async function fetchTasks() {
    setLoading(true);
    try {
      const { data: ops } = await supabase
        .from("operations")
        .select(`*, source_location:source_location_id(name), destination_location:destination_location_id(name)`)
        .in("status", ["DRAFT", "WAITING", "READY", "DONE"])
        .order("created_at", { ascending: false })
        .limit(50);

      const allOps = (ops || []) as RecentOp[];
      const today = new Date().toDateString();
      const todayPending = allOps.filter(o => o.status !== "DONE");
      const todayDone = allOps.filter(o => o.status === "DONE" && new Date(o.done_date || o.created_at).toDateString() === today);

      setTodayOps({
        receipts: todayPending.filter(o => o.type === "RECEIPT"),
        deliveries: todayPending.filter(o => o.type === "DELIVERY"),
        transfers: todayPending.filter(o => o.type === "INTERNAL"),
        adjustments: todayPending.filter(o => o.type === "ADJUSTMENT"),
      });
      setDoneCount(todayDone.length);
      setTotalToday(allOps.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const totalPending = todayOps.receipts.length + todayOps.deliveries.length + todayOps.transfers.length + todayOps.adjustments.length;
  const progress = totalToday > 0 ? Math.round((doneCount / (doneCount + totalPending)) * 100) : 0;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-brand-500 mx-auto" />
          <p className="text-sm text-foreground/50">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Inbox className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-500">Warehouse Staff</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-foreground/50 mt-1 text-sm">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Progress Banner */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">Today's Progress</h3>
            <p className="text-xs text-foreground/50">{doneCount} completed, {totalPending} remaining</p>
          </div>
          <div className="text-2xl font-bold text-brand-500">{progress}%</div>
        </div>
        <div className="h-2 bg-card-foreground/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-foreground/40">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Pending: {totalPending}</span>
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Done: {doneCount}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Receipts", value: todayOps.receipts.length, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Deliveries", value: todayOps.deliveries.length, color: "text-rose-500", bg: "bg-rose-500/10" },
          { label: "Transfers", value: todayOps.transfers.length, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Adjustments", value: todayOps.adjustments.length, color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-xl p-4 border border-border", s.bg)}>
            <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
            <div className="text-xs text-foreground/60 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Task Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TaskSection title="Incoming Receipts" ops={todayOps.receipts} href="/operations/receipts" emptyText="All receipts processed!" type="RECEIPT" />
        <TaskSection title="Delivery Orders" ops={todayOps.deliveries} href="/operations/deliveries" emptyText="No deliveries pending!" type="DELIVERY" />
        <TaskSection title="Internal Transfers" ops={todayOps.transfers} href="/operations/transfers" emptyText="No transfers pending!" type="INTERNAL" />
        <TaskSection title="Stock Adjustments" ops={todayOps.adjustments} href="/operations/adjustments" emptyText="No adjustments needed!" type="ADJUSTMENT" />
      </div>

      {/* Alert Banner if high pending */}
      {totalPending > 5 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-amber-700 dark:text-amber-400">High workload today</div>
            <div className="text-xs text-amber-600 dark:text-amber-500/80 mt-0.5">You have {totalPending} pending operations. Prioritize Ready items first.</div>
          </div>
        </div>
      )}

    </div>
  );
}
