import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Loader2, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { cn } from "../../lib/utils";
import type { Operation, OperationType, OperationStatus, Location, Supplier, Item, OperationLine } from "../../types/database";

const STATUS_COLORS: Record<OperationStatus, string> = {
  DRAFT: "bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-300 border-slate-200 dark:border-slate-600/40",
  WAITING: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-500/20",
  READY: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
  DONE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20",
  CANCELED: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border-rose-200 dark:border-rose-500/20",
};

type OpWithRelations = Operation & {
  source_location?: { name: string } | null;
  destination_location?: { name: string } | null;
  supplier?: { name: string } | null;
};

type Props = {
  opType: OperationType;
  title: string;
  description: string;
  showSupplier?: boolean;
  showSourceLocation?: boolean;
  showDestLocation?: boolean;
};

export function OperationsList({ opType, title, description, showSupplier = false, showSourceLocation = true, showDestLocation = true }: Props) {
  const [operations, setOperations] = useState<OpWithRelations[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OperationStatus | "ALL">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedOp, setSelectedOp] = useState<OpWithRelations | null>(null);
  const [opLines, setOpLines] = useState<(OperationLine & { items: Pick<Item, 'name' | 'sku'> | null })[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  
  // New op form state
  const [newOp, setNewOp] = useState({
    source_location_id: "",
    destination_location_id: "",
    supplier_id: "",
    notes: "",
    scheduled_date: "",
    status: "DRAFT" as OperationStatus,
  });
  const [lines, setLines] = useState<{ item_id: string; expected_qty: number }[]>([{ item_id: "", expected_qty: 1 }]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [opsRes, locsRes, suppRes, itemsRes] = await Promise.all([
      supabase.from("operations").select(`*, source_location:source_location_id(name), destination_location:destination_location_id(name), supplier:supplier_id(name)`).eq("type", opType).order("created_at", { ascending: false }),
      supabase.from("locations").select("*").order("name"),
      supabase.from("suppliers").select("*").order("name"),
      supabase.from("items").select("*").order("name"),
    ]);
    // @ts-ignore
    setOperations(opsRes.data || []);
    setLocations(locsRes.data || []);
    setSuppliers(suppRes.data || []);
    setItems(itemsRes.data || []);
    setLoading(false);
  }, [opType]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openDetail = async (op: OpWithRelations) => {
    setSelectedOp(op);
    const { data } = await supabase.from("operation_lines").select(`*, items(name, sku)`).eq("operation_id", op.id);
    // @ts-ignore
    setOpLines(data || []);
    setIsDetailOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const { data: op, error: opErr } = await supabase.from("operations").insert([{ ...newOp, type: opType, supplier_id: newOp.supplier_id || null, source_location_id: newOp.source_location_id || null, destination_location_id: newOp.destination_location_id || null }]).select().single();
      if (opErr) throw opErr;

      const validLines = lines.filter(l => l.item_id);
      if (validLines.length > 0) {
        const { error: linesErr } = await supabase.from("operation_lines").insert(validLines.map(l => ({ operation_id: op.id, item_id: l.item_id, expected_qty: l.expected_qty, done_qty: 0 })));
        if (linesErr) throw linesErr;
      }

      setIsModalOpen(false);
      setNewOp({ source_location_id: "", destination_location_id: "", supplier_id: "", notes: "", scheduled_date: "", status: "DRAFT" });
      setLines([{ item_id: "", expected_qty: 1 }]);
      fetchAll();
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleValidate = async (op: OpWithRelations) => {
    if (!confirm(`Validate "${op.reference}"? This will permanently update stock levels.`)) return;
    
    // Set done_qty = expected_qty for all lines first
    const { data: opLinesData } = await supabase.from("operation_lines").select("*").eq("operation_id", op.id);
    if (opLinesData && opLinesData.length > 0) {
      await supabase.from("operation_lines").upsert(opLinesData.map(l => ({ ...l, done_qty: l.expected_qty })));
    }
    const { error } = await supabase.from("operations").update({ status: "DONE" }).eq("id", op.id);
    if (error) { alert("Error: " + error.message); return; }
    fetchAll();
    if (isDetailOpen) setIsDetailOpen(false);
  };

  const handleCancel = async (op: OpWithRelations) => {
    if (!confirm(`Cancel "${op.reference}"?`)) return;
    await supabase.from("operations").update({ status: "CANCELED" }).eq("id", op.id);
    fetchAll();
  };

  const filtered = operations.filter(o => {
    const matchesSearch = !search || (o.reference || "").toLowerCase().includes(search.toLowerCase()) || (o.notes || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses: (OperationStatus | "ALL")[] = ["ALL", "DRAFT", "WAITING", "READY", "DONE", "CANCELED"];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-foreground/50 mt-1 text-sm">{description}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25 shrink-0">
          <Plus className="h-4 w-4" />
          New {title.replace(/s$/, "")}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground/30" />
          <input type="search" placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all", statusFilter === s ? "bg-brand-600 text-white border-brand-600 shadow-sm" : "bg-card text-foreground/50 border-border hover:border-brand-300 hover:text-foreground")}>
              {s === "ALL" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-card-foreground/3 border-b border-border text-xs text-foreground/50 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 text-left font-semibold">Reference</th>
                <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                {showSupplier && <th className="px-5 py-3.5 text-left font-semibold">Supplier</th>}
                {showSourceLocation && <th className="px-5 py-3.5 text-left font-semibold">From</th>}
                {showDestLocation && <th className="px-5 py-3.5 text-left font-semibold">To</th>}
                <th className="px-5 py-3.5 text-left font-semibold">Created</th>
                <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin text-brand-500 mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-foreground/40 text-sm">No {title.toLowerCase()} found.</td></tr>
              ) : (
                filtered.map(op => (
                  <tr key={op.id} className="hover:bg-card-foreground/3 card-hover transition-colors">
                    <td className="px-5 py-3.5">
                      <button onClick={() => openDetail(op)} className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">{op.reference || "Pending"}</button>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border", STATUS_COLORS[op.status])}>{op.status}</span>
                    </td>
                    {showSupplier && <td className="px-5 py-3.5 text-sm text-foreground/70">{op.supplier?.name || "-"}</td>}
                    {showSourceLocation && <td className="px-5 py-3.5 text-sm text-foreground/70">{op.source_location?.name || "-"}</td>}
                    {showDestLocation && <td className="px-5 py-3.5 text-sm text-foreground/70">{op.destination_location?.name || "-"}</td>}
                    <td className="px-5 py-3.5 text-xs text-foreground/40">{new Date(op.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2 text-brand-500">
                        {op.status !== "DONE" && op.status !== "CANCELED" && (
                          <button onClick={() => handleValidate(op)} title="Validate" className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-500/10 transition-colors">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        {op.status !== "DONE" && op.status !== "CANCELED" && (
                          <button onClick={() => handleCancel(op)} title="Cancel" className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/10 transition-colors">
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => openDetail(op)} className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-card-foreground/5 transition-colors">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh] ring-1 ring-black/10 overflow-hidden">
            {/* Header - Fixed top */}
            <div className="flex-none flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="text-lg font-bold">New {title.replace(/s$/, "")}</h2>
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="text-foreground/40 hover:text-foreground text-xl leading-none rounded-full p-2 hover:bg-card-foreground/5 transition-colors"
              >
                &times;
              </button>
            </div>
            
            {/* Form - Scrollable middle + Fixed bottom actions */}
            <form onSubmit={handleCreate} className="flex flex-col min-h-0 flex-1">
              <div className="p-6 space-y-5 overflow-y-auto flex-1">
                {showSupplier && (
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Supplier</label>
                    <select value={newOp.supplier_id} onChange={e => setNewOp({ ...newOp, supplier_id: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
                      <option value="">-- Select Supplier --</option>
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {showSourceLocation && (
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Source Location</label>
                      <select value={newOp.source_location_id} onChange={e => setNewOp({ ...newOp, source_location_id: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
                        <option value="">-- None --</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </div>
                  )}
                  {showDestLocation && (
                    <div>
                      <label className="block text-sm font-medium mb-1.5">Destination Location</label>
                      <select value={newOp.destination_location_id} onChange={e => setNewOp({ ...newOp, destination_location_id: e.target.value })}
                        className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
                        <option value="">-- None --</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Status</label>
                    <select value={newOp.status} onChange={e => setNewOp({ ...newOp, status: e.target.value as OperationStatus })}
                      className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
                      {["DRAFT", "WAITING", "READY"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Scheduled Date</label>
                    <input type="date" value={newOp.scheduled_date} onChange={e => setNewOp({ ...newOp, scheduled_date: e.target.value })}
                      className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Notes</label>
                  <textarea rows={2} value={newOp.notes} onChange={e => setNewOp({ ...newOp, notes: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none" placeholder="Optional notes..." />
                </div>

                {/* Product Lines */}
                <div>
                  <div className="flex items-center justify-between mb-3 border-t border-border/50 pt-4">
                    <label className="block text-sm font-semibold text-foreground/80">Product Lines</label>
                    <button type="button" onClick={() => setLines([...lines, { item_id: "", expected_qty: 1 }])}
                      className="text-xs bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 px-3 py-1.5 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-500/20 font-semibold transition-colors flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Add Line
                    </button>
                  </div>
                  <div className="space-y-3">
                    {lines.map((line, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <select value={line.item_id} onChange={e => { const l = [...lines]; l[i].item_id = e.target.value; setLines(l); }}
                          className="flex-1 rounded-xl border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
                          <option value="">-- Select Product --</option>
                          {items.map(it => <option key={it.id} value={it.id}>{it.name} ({it.sku})</option>)}
                        </select>
                        <input type="number" min="1" value={line.expected_qty} onChange={e => { const l = [...lines]; l[i].expected_qty = parseInt(e.target.value) || 1; setLines(l); }}
                          className="w-24 rounded-xl border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="Qty" />
                        {lines.length > 1 && (
                          <button type="button" onClick={() => setLines(lines.filter((_, idx) => idx !== i))} 
                            className="p-2.5 text-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors shrink-0">
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Footer Actions - Fixed bottom */}
              <div className="flex-none flex justify-end gap-3 px-6 py-4 border-t border-border bg-card">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-card-foreground/5 transition-colors">Cancel</button>
                <button type="submit" disabled={modalLoading} className="px-5 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25 disabled:opacity-50 flex items-center gap-2">
                  {modalLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailOpen && selectedOp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col ring-1 ring-black/10">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h2 className="text-lg font-bold font-mono">{selectedOp.reference || "Draft"}</h2>
                <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border mt-1", STATUS_COLORS[selectedOp.status])}>{selectedOp.status}</span>
              </div>
              <button onClick={() => setIsDetailOpen(false)} className="text-foreground/40 hover:text-foreground text-xl">&times;</button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedOp.source_location?.name && <div><span className="text-foreground/40 text-xs">From</span><div className="font-medium">{selectedOp.source_location.name}</div></div>}
                {selectedOp.destination_location?.name && <div><span className="text-foreground/40 text-xs">To</span><div className="font-medium">{selectedOp.destination_location.name}</div></div>}
                {selectedOp.supplier?.name && <div><span className="text-foreground/40 text-xs">Supplier</span><div className="font-medium">{selectedOp.supplier.name}</div></div>}
                {selectedOp.scheduled_date && <div><span className="text-foreground/40 text-xs">Scheduled</span><div className="font-medium">{selectedOp.scheduled_date}</div></div>}
              </div>
              {selectedOp.notes && <div className="text-sm text-foreground/60 bg-card-foreground/5 rounded-xl p-3">{selectedOp.notes}</div>}
              <div>
                <h3 className="font-semibold text-sm mb-2">Product Lines</h3>
                <div className="divide-y divide-border/50 rounded-xl border border-border overflow-hidden">
                  {opLines.length === 0 ? (
                    <div className="py-4 text-center text-xs text-foreground/40">No product lines</div>
                  ) : (
                    opLines.map(l => (
                      <div key={l.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <div className="text-sm font-medium">{l.items?.name}</div>
                          <div className="font-mono text-[10px] text-foreground/40">{l.items?.sku}</div>
                        </div>
                        <div className="text-right text-sm">
                          <span className="font-bold">{l.done_qty}</span>
                          <span className="text-foreground/40"> / {l.expected_qty}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            {selectedOp.status !== "DONE" && selectedOp.status !== "CANCELED" && (
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-card/50">
                <button onClick={() => handleCancel(selectedOp)} className="px-4 py-2 text-sm font-medium rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">Cancel Op</button>
                <button onClick={() => handleValidate(selectedOp)} className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Validate
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
