import { useState, useEffect } from "react";
import { User, Camera, Loader2, Save, Shield } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider";

export function Profile() {
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("staff");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setRole(profile.role);
      setLoading(false);
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("user_profiles").upsert({ id: user?.id, full_name: fullName, role: role as any });
    if (!error) { setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
    setSaving(false);
  };

  if (loading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand-500" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-foreground/50 mt-1 text-sm">Manage your account details and role settings.</p>
      </div>

      {/* Avatar Card */}
      <div className="rounded-2xl border border-border bg-card p-6 flex items-center gap-5">
        <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-brand-400 to-brand-700 flex items-center justify-center shadow-xl shadow-brand-500/20 shrink-0">
          <User className="h-9 w-9 text-white" />
          <div className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-brand-600 border-2 border-card flex items-center justify-center cursor-pointer hover:bg-brand-700 transition-colors">
            <Camera className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-bold">{profile?.full_name || "User"}</h2>
          <p className="text-foreground/50 text-sm">{user?.email}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <Shield className="h-3.5 w-3.5 text-brand-500" />
            <span className="text-xs font-semibold text-brand-500 capitalize">{profile?.role}</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">Account Information</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              placeholder="Your full name" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input value={user?.email || ""} disabled
              className="w-full rounded-xl border border-border bg-card-foreground/5 px-4 py-2.5 text-sm text-foreground/50 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)}
              className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all">
              <option value="staff">Staff — Warehouse operations</option>
              <option value="manager">Manager — Full dashboard + analytics</option>
            </select>
            <p className="text-xs text-foreground/40 mt-1">Your dashboard view will change based on your selected role.</p>
          </div>
          <div className="pt-2">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/25 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {success && <span className="ml-3 text-sm text-emerald-500 font-medium">✓ Saved successfully!</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
