import { useState, useEffect } from "react";
import { Search, Loader2, ArrowDownRight, ArrowUpRight, ArrowRightLeft, ClipboardList } from "lucide-react";
import { supabase } from "../lib/supabase";
import { cn } from "../lib/utils";
import { useAuth } from "../providers/AuthProvider";
import type { Operation, Item } from "../types/database";

type OpWithRelations = Operation & {
  source_location?: { name: string } | null;
  destination_location?: { name: string } | null;
  operation_lines?: ({ items: Pick<Item, 'name' | 'sku'> | null; done_qty: number })[];
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300 border-slate-200 dark:border-slate-600",
  WAITING: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  READY: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  DONE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  CANCELED: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/20",
};

const TYPE_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  RECEIPT: { label: "Receipt", icon: ArrowDownRight, color: "text-emerald-500" },
  DELIVERY: { label: "Delivery", icon: ArrowUpRight, color: "text-rose-500" },
  INTERNAL: { label: "Transfer", icon: ArrowRightLeft, color: "text-blue-500" },
  ADJUSTMENT: { label: "Adjustment", icon: ClipboardList, color: "text-purple-500" },
};

export function MoveHistory() {
  const [ops, setOps] = useState<OpWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const { profile } = useAuth();

  useEffect(() => { fetchHistory(); }, []);

  async function fetchHistory() {
    setLoading(true);
    const { data } = await supabase
      .from("operations")
      .select(`*, source_location:source_location_id(name), destination_location:destination_location_id(name), operation_lines(done_qty, items(name, sku))`)
      .order("created_at", { ascending: false });
    // @ts-ignore
    setOps(data || []);
    setLoading(false);
  }

  const filtered = ops.filter(o => {
    const matchType = typeFilter === "ALL" || o.type === typeFilter;
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    const matchSearch = !search || (o.reference || "").toLowerCase().includes(search.toLowerCase()) || (o.notes || "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchStatus && matchSearch;
  });

  const downloadCSV = () => {
    if (ops.length === 0) return;

    const headers = ["Date", "Reference", "Type", "Status", "From", "To", "Items", "Notes"];
    const rows = filtered.map(o => [
      new Date(o.created_at).toLocaleString(),
      o.reference || "Pending",
      o.type,
      o.status,
      o.source_location?.name || "",
      o.destination_location?.name || "",
      o.operation_lines?.length || 0,
      o.notes || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `operation_audit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Move History</h1>
          <p className="text-foreground/50 mt-1 text-sm">Full audit ledger of all stock operations.</p>
        </div>
        {profile?.role === 'manager' && (
          <button 
            onClick={downloadCSV}
            className="px-4 py-2 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-card-foreground/5 transition-all shadow-sm"
          >
            Download Audit
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground/30" />
          <input type="search" placeholder="Search by reference or notes..." value={search} onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["ALL", "RECEIPT", "DELIVERY", "INTERNAL", "ADJUSTMENT"].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all", typeFilter === t ? "bg-brand-600 text-white border-brand-600" : "bg-card text-foreground/50 border-border hover:text-foreground")}>
              {t === "ALL" ? "All Types" : TYPE_CONFIG[t]?.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["ALL", "DRAFT", "WAITING", "READY", "DONE", "CANCELED"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all", statusFilter === s ? "bg-slate-700 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-800" : "bg-card text-foreground/50 border-border hover:text-foreground")}>
              {s === "ALL" ? "All Status" : s}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card-foreground/3 border-b border-border text-xs text-foreground/50 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 text-left font-semibold">Reference</th>
                <th className="px-5 py-3.5 text-left font-semibold">Type</th>
                <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                <th className="px-5 py-3.5 text-left font-semibold">From</th>
                <th className="px-5 py-3.5 text-left font-semibold">To</th>
                <th className="px-5 py-3.5 text-left font-semibold">Items</th>
                <th className="px-5 py-3.5 text-left font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin text-brand-500 mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-foreground/40 text-sm">No records found.</td></tr>
              ) : (
                filtered.map(op => {
                  const cfg = TYPE_CONFIG[op.type];
                  const Icon = cfg?.icon || ClipboardList;
                  return (
                    <tr key={op.id} className="hover:bg-card-foreground/3 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">{op.reference || "Pending"}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn("flex items-center gap-1.5 text-xs font-semibold", cfg?.color)}>
                          <Icon className="h-3.5 w-3.5" /> {cfg?.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border", STATUS_COLORS[op.status])}>{op.status}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-foreground/60">{op.source_location?.name || "—"}</td>
                      <td className="px-5 py-3.5 text-xs text-foreground/60">{op.destination_location?.name || "—"}</td>
                      <td className="px-5 py-3.5 text-xs text-foreground/60">
                        {op.operation_lines?.length ? `${op.operation_lines.length} product(s)` : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-foreground/40">{new Date(op.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
