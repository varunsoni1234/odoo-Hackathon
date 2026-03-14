import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Supplier } from "../../types/database";

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<Partial<Supplier>>({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetch(); }, []);

  async function fetch() {
    setLoading(true);
    const { data } = await supabase.from("suppliers").select("*").order("name");
    setSuppliers(data || []);
    setLoading(false);
  }

  const openAdd = () => { setIsEditing(false); setCurrent({ name: "", email: "", phone: "" }); setIsModalOpen(true); };
  const openEdit = (s: Supplier) => { setIsEditing(true); setCurrent(s); setIsModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    if (isEditing && current.id) {
      await supabase.from("suppliers").update({ name: current.name, email: current.email, phone: current.phone }).eq("id", current.id);
    } else {
      await supabase.from("suppliers").insert([{ name: current.name, email: current.email, phone: current.phone }]);
    }
    setIsModalOpen(false); fetch(); setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this supplier?")) return;
    await supabase.from("suppliers").delete().eq("id", id);
    fetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-foreground/50 mt-1 text-sm">Manage vendor contacts for receipt operations.</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25">
          <Plus className="h-4 w-4" /> Add Supplier
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-card-foreground/3 border-b border-border text-xs text-foreground/50 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3.5 text-left font-semibold">Name</th>
              <th className="px-5 py-3.5 text-left font-semibold">Email</th>
              <th className="px-5 py-3.5 text-left font-semibold">Phone</th>
              <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              <tr><td colSpan={4} className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-brand-500 mx-auto" /></td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={4} className="py-12 text-center text-foreground/40 text-sm">No suppliers yet.</td></tr>
            ) : suppliers.map(s => (
              <tr key={s.id} className="hover:bg-card-foreground/3 transition-colors">
                <td className="px-5 py-3.5 font-medium">{s.name}</td>
                <td className="px-5 py-3.5 text-foreground/60">{s.email || "—"}</td>
                <td className="px-5 py-3.5 text-foreground/60">{s.phone || "—"}</td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-500/10 text-foreground/40 hover:text-brand-500 transition-colors"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-foreground/40 hover:text-rose-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border p-6">
            <h2 className="text-lg font-bold mb-4">{isEditing ? "Edit Supplier" : "Add Supplier"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1.5">Name *</label>
                <input required value={current.name} onChange={e => setCurrent({ ...current, name: e.target.value })} className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="Acme Corp" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Email</label>
                <input type="email" value={current.email || ""} onChange={e => setCurrent({ ...current, email: e.target.value })} className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="contact@acme.com" /></div>
              <div><label className="block text-sm font-medium mb-1.5">Phone</label>
                <input value={current.phone || ""} onChange={e => setCurrent({ ...current, phone: e.target.value })} className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="+1 555 000 0000" /></div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm rounded-xl hover:bg-card-foreground/5 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
