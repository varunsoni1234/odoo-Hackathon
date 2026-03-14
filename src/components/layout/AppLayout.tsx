import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ThemeToggle } from "../ThemeToggle";
import { useAuth } from "../../providers/AuthProvider";
import { Loader2 } from "lucide-react";

export function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background flex font-sans transition-colors duration-300">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-h-screen relative">
        {/* Ambient glows */}
        <div className="pointer-events-none fixed top-0 right-0 -z-10 w-[600px] h-[600px] rounded-full bg-brand-500/8 blur-[120px]" />
        <div className="pointer-events-none fixed bottom-0 left-64 -z-10 w-[400px] h-[400px] rounded-full bg-indigo-500/6 blur-[100px]" />

        {/* Top bar for mobile + theme toggle */}
        <div className="sticky top-0 z-30 flex h-14 items-center justify-between px-4 md:px-8 border-b border-border/40 bg-background/80 backdrop-blur-xl md:hidden">
          <span className="font-bold text-sm">StockFlow IMS</span>
          <ThemeToggle />
        </div>
        <div className="hidden md:flex absolute top-4 right-6 z-20">
          <ThemeToggle />
        </div>

        <div className="p-4 md:p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
