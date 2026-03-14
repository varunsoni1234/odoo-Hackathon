import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans transition-colors duration-300">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto relative animate-fade-in">
          {/* Subtle background glow effects for premium feel */}
          <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[100px] opacity-50" />
          <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] rounded-full bg-brand-300/10 blur-[80px] opacity-30" />
          
          <div className="container mx-auto p-4 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
