import { ThemeToggle } from "../ThemeToggle";
import { Bell, Search, User, Menu } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center w-full px-4 md:px-6">
        <div className="mr-4 hidden md:flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
               <span className="font-bold text-white">IM</span>
             </div>
             <span className="hidden font-bold sm:inline-block">IMS Pro</span>
          </a>
        </div>
        
        {/* Mobile Menu Button */}
        <button className="md:hidden mr-2 p-2 rounded-md hover:bg-card">
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />
              <input
                type="search"
                placeholder="Search inventory..."
                className="h-9 w-full rounded-md border border-border bg-card px-8 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-1 focus:ring-brand-500 md:w-[300px]"
              />
            </div>
          </div>
          <nav className="flex items-center space-x-2">
            <button className="relative inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-card transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-brand-500"></span>
            </button>
            <ThemeToggle />
            <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-brand-900 border border-brand-200 dark:border-brand-800 flex items-center justify-center cursor-pointer ml-2">
              <User className="h-4 w-4 text-brand-700 dark:text-brand-300" />
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
