import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Search, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Item, Category } from "../types/database";

export function Items() {
  const [items, setItems] = useState<(Item & { categories: Pick<Category, 'name'> | null })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<Item>>({
    sku: "",
    name: "",
    category_id: "",
    quantity: 0,
    min_stock_level: 5,
    price: 0
  });
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      // Fetch items with their joined category name
      const { data: itemsData, error: itemsError } = await supabase
        .from("items")
        .select(`
          *,
          categories (
            name
          )
        `)
        .order("name");
        
      if (itemsError) throw itemsError;
      
      const { data: catData, error: catError } = await supabase
        .from("categories")
        .select("*")
        .order("name");
        
      if (catError) throw catError;

      // @ts-ignore - Supabase types joined relations as arrays or single object depending on relationship, it's safe to cast here based on our schema
      setItems(itemsData || []);
      setCategories(catData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.sku.toLowerCase().includes(search.toLowerCase()) ||
    (i.categories?.name && i.categories.name.toLowerCase().includes(search.toLowerCase()))
  );

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentItem({
      sku: "",
      name: "",
      category_id: categories.length > 0 ? categories[0].id : "",
      quantity: 0,
      min_stock_level: 5,
      price: 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Item) => {
    setIsEditing(true);
    setCurrentItem(item);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem.name || !currentItem.sku || !currentItem.category_id) return;
    
    setModalLoading(true);
    try {
      const itemData = {
        sku: currentItem.sku,
        name: currentItem.name,
        category_id: currentItem.category_id,
        quantity: isEditing ? undefined : currentItem.quantity, // Don't let edits override quantity directly, should go via movements ideally, but for MVP we allow it if we want
        min_stock_level: currentItem.min_stock_level,
        price: currentItem.price
      };

      if (isEditing && currentItem.id) {
        const { error } = await supabase
          .from("items")
          .update(itemData)
          .eq("id", currentItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("items")
          .insert([{ ...itemData, quantity: currentItem.quantity || 0 }]);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Failed to save item. Make sure the SKU is unique.");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all movement history for this item.`)) return;
    
    try {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item.");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Items</h1>
          <p className="text-muted-foreground mt-1 text-foreground/60">
            View and manage all products across your catalog.
          </p>
        </div>
        <button 
          onClick={openAddModal}
          className="px-4 py-2 rounded-md bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20 flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </button>
      </div>

      <div className="glass rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-card/30">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
            <input
              type="search"
              placeholder="Search by name, SKU, or category..."
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
                <th scope="col" className="px-6 py-4 font-medium">SKU</th>
                <th scope="col" className="px-6 py-4 font-medium">Name</th>
                <th scope="col" className="px-6 py-4 font-medium">Category</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Price</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Stock</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-foreground/50">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading inventory...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-foreground/50">
                    {search ? "No items found matching your search." : "No items found. Add one to get started."}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="bg-card/20 border-b border-border/50 hover:bg-card/40 card-hover transition-colors group">
                    <td className="px-6 py-4 font-mono text-xs text-foreground/70">{item.sku}</td>
                    <td className="px-6 py-4 font-medium">{item.name}</td>
                    <td className="px-6 py-4">
                       <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                         {item.categories?.name || "Uncategorized"}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">${Number(item.price).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${item.quantity <= item.min_stock_level ? "text-rose-500" : "text-emerald-500"}`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-foreground/60 hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-md transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-1.5 text-foreground/60 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-xl rounded-xl shadow-2xl border border-border p-6 overflow-hidden slide-up ring-1 ring-black/5">
            <h2 className="text-xl font-bold mb-4">{isEditing ? "Edit Item" : "Add New Item"}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="sku" className="block text-sm font-medium mb-1">SKU *</label>
                  <input
                    id="sku"
                    type="text"
                    required
                    value={currentItem.sku}
                    onChange={(e) => setCurrentItem({...currentItem, sku: e.target.value})}
                    className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-mono"
                    placeholder="e.g., LAP-001"
                  />
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={currentItem.name}
                    onChange={(e) => setCurrentItem({...currentItem, name: e.target.value})}
                    className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    placeholder="e.g., MacBook Pro M2"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium mb-1">Category *</label>
                <select
                  id="category"
                  required
                  value={currentItem.category_id}
                  onChange={(e) => setCurrentItem({...currentItem, category_id: e.target.value})}
                  className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-rose-500 mt-1">Please create a category first before adding items.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={isEditing ? 'opacity-50 pointer-events-none' : ''}>
                  <label htmlFor="quantity" className="block text-sm font-medium mb-1">Initial Qty</label>
                  <input
                    id="quantity"
                    type="number"
                    required={!isEditing}
                    min="0"
                    value={currentItem.quantity}
                    onChange={(e) => setCurrentItem({...currentItem, quantity: parseInt(e.target.value) || 0})}
                    className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                  {isEditing && <span className="text-[10px] text-foreground/50">Edit via Movements</span>}
                </div>
                <div>
                  <label htmlFor="price" className="block text-sm font-medium mb-1">Price ($)</label>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={currentItem.price}
                    onChange={(e) => setCurrentItem({...currentItem, price: parseFloat(e.target.value) || 0})}
                    className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label htmlFor="min_stock" className="block text-sm font-medium mb-1">Min Stock Alert</label>
                  <input
                    id="min_stock"
                    type="number"
                    required
                    min="0"
                    value={currentItem.min_stock_level}
                    onChange={(e) => setCurrentItem({...currentItem, min_stock_level: parseInt(e.target.value) || 0})}
                    className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                  />
                </div>
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
                  disabled={modalLoading || !currentItem.name || !currentItem.sku || !currentItem.category_id}
                  className="px-4 py-2 rounded-md bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {modalLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isEditing ? "Save Changes" : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
