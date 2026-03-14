import { useState, useEffect } from "react";
import { Plus, Search, Loader2, ArrowDownRight, ArrowUpRight, ArrowRightLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";
import type { Movement, Item } from "../types/database";

// Extended type to include joined item data
type MovementWithItem = Movement & { items: Pick<Item, 'name' | 'sku'> | null };

export function Movements() {
  const [movements, setMovements] = useState<MovementWithItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { profile } = useAuth();
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMovement, setCurrentMovement] = useState<Partial<Movement>>({
    item_id: "",
    type: "IN",
    quantity: 1,
    reference_note: ""
  });
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      
      // Fetch movements with joined item data
      const { data: movementsData, error: movementsError } = await supabase
        .from("movements")
        .select(`
          *,
          items (
            name,
            sku
          )
        `)
        .order("created_at", { ascending: false });
        
      if (movementsError) throw movementsError;
      
      // Fetch items for the dropdown
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select("*")
        .order("name");
        
      if (itemsError) throw itemsError;

      // @ts-ignore
      setMovements(movementsData || []);
      setItems(itemsData || []);
    } catch (error) {
      console.error("Error fetching movements data:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredMovements = movements.filter(m => 
    (m.items?.name && m.items.name.toLowerCase().includes(search.toLowerCase())) || 
    (m.items?.sku && m.items.sku.toLowerCase().includes(search.toLowerCase())) ||
    (m.reference_note && m.reference_note.toLowerCase().includes(search.toLowerCase()))
  );

  const openAddModal = () => {
    setCurrentMovement({
      item_id: items.length > 0 ? items[0].id : "",
      type: "IN",
      quantity: 1,
      reference_note: ""
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMovement.item_id || !currentMovement.quantity || currentMovement.quantity <= 0) return;
    
    setModalLoading(true);
    try {
      // The Postgres trigger 'trg_update_item_quantity' handles updating the actual item quantity
      // based on the sign of the movement quantity. We need to ensure OUT adjustments are negative.
      
      let finalQuantity = currentMovement.quantity;
      if (currentMovement.type === "OUT") {
        finalQuantity = -Math.abs(currentMovement.quantity);
      } else if (currentMovement.type === "IN") {
        finalQuantity = Math.abs(currentMovement.quantity);
      }
      
      // Check if we have enough stock for an OUT movement
      if (currentMovement.type === "OUT") {
        const selectedItem = items.find(i => i.id === currentMovement.item_id);
        if (selectedItem && selectedItem.quantity < Math.abs(finalQuantity)) {
          alert(`Cannot process OUT movement. Only ${selectedItem.quantity} units available.`);
          setModalLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from("movements")
        .insert([{ 
          item_id: currentMovement.item_id,
          type: currentMovement.type,
          quantity: finalQuantity,
          reference_note: currentMovement.reference_note
        }]);
        
      if (error) throw error;
      
      setIsModalOpen(false);
      fetchData(); // Refresh history
    } catch (error) {
      console.error("Error saving movement:", error);
      alert("Failed to record stock movement.");
    } finally {
      setModalLoading(false);
    }
  };

  const getMovementIcon = (type: string) => {
    switch(type) {
      case 'IN': return <ArrowDownRight className="w-4 h-4 text-emerald-500" />;
      case 'OUT': return <ArrowUpRight className="w-4 h-4 text-rose-500" />;
      default: return <ArrowRightLeft className="w-4 h-4 text-brand-500" />;
    }
  };

  const getMovementBadgeColor = (type: string) => {
    switch(type) {
      case 'IN': return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
      case 'OUT': return "bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border-rose-200 dark:border-rose-500/20";
      default: return "bg-brand-100 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 border-brand-200 dark:border-brand-500/20";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const downloadCSV = () => {
    if (movements.length === 0) return;

    const headers = ["Date", "Item", "SKU", "Type", "Quantity", "Note"];
    const rows = filteredMovements.map(m => [
      formatDate(m.created_at),
      m.items?.name || "Unknown",
      m.items?.sku || "",
      m.type,
      m.quantity,
      m.reference_note || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stock_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-muted-foreground mt-1 text-foreground/60">
            Record incoming stock, outgoing orders, and adjustments.
          </p>
        </div>
        <div className="flex gap-3">
          {profile?.role === 'manager' && (
            <button 
              onClick={downloadCSV}
              className="px-4 py-2 rounded-md border border-border bg-card text-sm font-medium hover:bg-card-foreground/5 transition-colors flex items-center"
            >
              Download Ledger
            </button>
          )}
          <button 
            onClick={openAddModal}
            className="px-4 py-2 rounded-md bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Movement
          </button>
        </div>
      </div>

      <div className="glass rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-card/30">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
            <input
              type="search"
              placeholder="Search by item name or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-md border border-border bg-card px-8 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-foreground/60 uppercase bg-card/50 border-b border-border">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">Type</th>
                <th scope="col" className="px-6 py-4 font-medium">Item</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Quantity</th>
                <th scope="col" className="px-6 py-4 font-medium">Date</th>
                <th scope="col" className="px-6 py-4 font-medium">Reference Note</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-foreground/50">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading movement history...
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-foreground/50">
                    {search ? "No movements found matching your search." : "No stock movements recorded yet."}
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => (
                  <tr key={movement.id} className="bg-card/20 border-b border-border/50 hover:bg-card/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getMovementBadgeColor(movement.type)}`}>
                        {getMovementIcon(movement.type)}
                        <span className="ml-1.5">{movement.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{movement.items?.name || "Unknown Item"}</div>
                      <div className="text-xs text-foreground/50 font-mono mt-0.5">{movement.items?.sku}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${movement.quantity > 0 ? "text-emerald-500" : movement.quantity < 0 ? "text-rose-500" : "text-foreground"}`}>
                        {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-foreground/70 whitespace-nowrap">
                      {formatDate(movement.created_at)}
                    </td>
                    <td className="px-6 py-4 text-foreground/70 text-xs">
                      {movement.reference_note || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl border border-border p-6 overflow-hidden slide-up ring-1 ring-black/10">
            <h2 className="text-xl font-bold mb-4">Record Stock Movement</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="item" className="block text-sm font-medium mb-1">Select Item *</label>
                <select
                  id="item"
                  required
                  value={currentMovement.item_id}
                  onChange={(e) => setCurrentMovement({...currentMovement, item_id: e.target.value})}
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                >
                  {items.map(item => (
                    <option key={item.id} value={item.id}>{item.name} ({item.sku}) - {item.quantity} in stock</option>
                  ))}
                </select>
                {items.length === 0 && (
                  <p className="text-xs text-rose-500 mt-1">Please add items to your inventory first.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-medium mb-1">Movement Type *</label>
                  <select
                    id="type"
                    required
                    value={currentMovement.type}
                    onChange={(e) => setCurrentMovement({...currentMovement, type: e.target.value as any})}
                    className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="IN">Stock IN (+)</option>
                    <option value="OUT">Stock OUT (-)</option>
                    <option value="ADJUST">Adjustment</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="quantity" className="block text-sm font-medium mb-1">Quantity (Absolute) *</label>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    required
                    value={Math.abs(currentMovement.quantity || 1)}
                    onChange={(e) => setCurrentMovement({...currentMovement, quantity: parseInt(e.target.value) || 1})}
                    className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="note" className="block text-sm font-medium mb-1">Reference Note</label>
                <input
                  id="note"
                  type="text"
                  value={currentMovement.reference_note || ""}
                  onChange={(e) => setCurrentMovement({...currentMovement, reference_note: e.target.value})}
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  placeholder="e.g., PO-10492 or Damaged Goods"
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-md hover:bg-card-foreground/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading || !currentMovement.item_id || items.length === 0}
                  className="px-4 py-2 rounded-md bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {modalLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
