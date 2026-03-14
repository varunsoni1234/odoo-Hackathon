import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, MapPin } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Warehouse, Location } from "../../types/database";

export function Warehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWh, setActiveWh] = useState<string | null>(null);

  // Warehouse modal
  const [whModal, setWhModal] = useState(false);
  const [editWh, setEditWh] = useState<Partial<Warehouse>>({ name: "", address: "" });
  const [editingWh, setEditingWh] = useState(false);
  const [whSaving, setWhSaving] = useState(false);

  // Location modal
  const [locModal, setLocModal] = useState(false);
  const [editLoc, setEditLoc] = useState<Partial<Location>>({ name: "", type: "internal", warehouse_id: "" });
  const [editingLoc, setEditingLoc] = useState(false);
  const [locSaving, setLocSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [whRes, locRes] = await Promise.all([
      supabase.from("warehouses").select("*").order("name"),
      supabase.from("locations").select("*").order("name"),
    ]);
    setWarehouses(whRes.data || []);
    setLocations(locRes.data || []);
    if (whRes.data && whRes.data.length > 0) setActiveWh(whRes.data[0].id);
    setLoading(false);
  }

  const openAddWh = () => { setEditingWh(false); setEditWh({ name: "", address: "" }); setWhModal(true); };
  const openEditWh = (w: Warehouse) => { setEditingWh(true); setEditWh(w); setWhModal(true); };
  const handleWhSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setWhSaving(true);
    if (editingWh && editWh.id) await supabase.from("warehouses").update({ name: editWh.name, address: editWh.address }).eq("id", editWh.id);
    else await supabase.from("warehouses").insert([{ name: editWh.name, address: editWh.address }]);
    setWhModal(false); fetchData(); setWhSaving(false);
  };

  const openAddLoc = () => { setEditingLoc(false); setEditLoc({ name: "", type: "internal", warehouse_id: activeWh || "" }); setLocModal(true); };
  const openEditLoc = (l: Location) => { setEditingLoc(true); setEditLoc(l); setLocModal(true); };
  const handleLocSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLocSaving(true);
    if (editingLoc && editLoc.id) await supabase.from("locations").update({ name: editLoc.name, type: editLoc.type }).eq("id", editLoc.id);
    else await supabase.from("locations").insert([{ name: editLoc.name, type: editLoc.type, warehouse_id: editLoc.warehouse_id }]);
    setLocModal(false); fetchData(); setLocSaving(false);
  };

  const deleteWh = async (id: string) => { if (!confirm("Delete warehouse and all its locations?")) return; await supabase.from("warehouses").delete().eq("id", id); fetchData(); };
  const deleteLoc = async (id: string) => { if (!confirm("Delete location?")) return; await supabase.from("locations").delete().eq("id", id); fetchData(); };

  const activeLocations = locations.filter(l => l.warehouse_id === activeWh);
  const TYPE_BADGES: Record<string, string> = {
    receive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    internal: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
    ship: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouses</h1>
          <p className="text-foreground/50 mt-1 text-sm">Manage your warehouses and their storage locations.</p>
        </div>
        <button onClick={openAddWh} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25">
          <Plus className="h-4 w-4" /> Add Warehouse
        </button>
      </div>

      {loading ? <div className="py-16 text-center"><Loader2 className="h-6 w-6 animate-spin text-brand-500 mx-auto" /></div> : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Warehouses List */}
          <div className="space-y-2">
            {warehouses.map(wh => (
              <div key={wh.id} onClick={() => setActiveWh(wh.id)} className={`rounded-xl border p-4 cursor-pointer transition-all ${activeWh === wh.id ? "border-brand-500 bg-brand-50 dark:bg-brand-500/10 shadow-sm" : "border-border bg-card hover:border-brand-300"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">{wh.name}</div>
                    {wh.address && <div className="text-xs text-foreground/50 mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" />{wh.address}</div>}
                    <div className="text-xs text-foreground/40 mt-1">{locations.filter(l => l.warehouse_id === wh.id).length} locations</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={e => { e.stopPropagation(); openEditWh(wh); }} className="p-1 rounded hover:bg-brand-100 dark:hover:bg-brand-500/10 text-foreground/40 hover:text-brand-500 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={e => { e.stopPropagation(); deleteWh(wh.id); }} className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-500/10 text-foreground/40 hover:text-rose-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Locations for Active Warehouse */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Storage Locations — {warehouses.find(w => w.id === activeWh)?.name || "Select Warehouse"}</h2>
              {activeWh && (
                <button onClick={openAddLoc} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-card-foreground/5 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-500/10 transition-colors border border-border">
                  <Plus className="h-3.5 w-3.5" /> Add Location
                </button>
              )}
            </div>
            <div className="divide-y divide-border/50">
              {activeLocations.length === 0 ? (
                <div className="py-12 text-center text-foreground/40 text-sm">No locations in this warehouse yet.</div>
              ) : activeLocations.map(loc => (
                <div key={loc.id} className="flex items-center justify-between px-5 py-3 hover:bg-card-foreground/3 transition-colors">
                  <div>
                    <div className="text-sm font-medium">{loc.name}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${TYPE_BADGES[loc.type]}`}>{loc.type}</span>
                    <button onClick={() => openEditLoc(loc)} className="p-1 rounded hover:bg-brand-100 dark:hover:bg-brand-500/10 text-foreground/40 hover:text-brand-500 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteLoc(loc.id)} className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-500/10 text-foreground/40 hover:text-rose-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Warehouse Modal */}
      {whModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6">
            <h2 className="text-lg font-bold mb-4">{editingWh ? "Edit Warehouse" : "Add Warehouse"}</h2>
            <form onSubmit={handleWhSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1.5">Name *</label>
                <input required value={editWh.name} onChange={e => setEditWh({ ...editWh, name: e.target.value })} className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="Main Warehouse" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Address</label>
                <input value={editWh.address || ""} onChange={e => setEditWh({ ...editWh, address: e.target.value })} className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="123 Main St" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setWhModal(false)} className="px-4 py-2 text-sm rounded-xl hover:bg-card-foreground/5 transition-colors">Cancel</button>
                <button type="submit" disabled={whSaving} className="px-5 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                  {whSaving && <Loader2 className="h-4 w-4 animate-spin" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {locModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6">
            <h2 className="text-lg font-bold mb-4">{editingLoc ? "Edit Location" : "Add Location"}</h2>
            <form onSubmit={handleLocSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1.5">Location Name *</label>
                <input required value={editLoc.name} onChange={e => setEditLoc({ ...editLoc, name: e.target.value })} className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="e.g. Rack A-1" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Type</label>
                <select value={editLoc.type} onChange={e => setEditLoc({ ...editLoc, type: e.target.value as any })} className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
                  <option value="receive">Receive (Incoming)</option>
                  <option value="internal">Internal (Storage)</option>
                  <option value="ship">Ship (Outgoing)</option>
                </select></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setLocModal(false)} className="px-4 py-2 text-sm rounded-xl hover:bg-card-foreground/5 transition-colors">Cancel</button>
                <button type="submit" disabled={locSaving} className="px-5 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                  {locSaving && <Loader2 className="h-4 w-4 animate-spin" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
