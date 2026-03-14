import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./providers/ThemeProvider";
import { AppLayout } from "./components/layout/AppLayout";
import { Dashboard } from "./pages/Dashboard";
import { AuthPage } from "./pages/Auth";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ims-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            {/* Mock routes for other sections */}
            <Route path="inventory" element={<div className="p-8 text-xl font-medium animate-fade-in text-foreground/50">Inventory Page Working</div>} />
            <Route path="categories" element={<div className="p-8 text-xl font-medium animate-fade-in text-foreground/50">Categories Module</div>} />
            <Route path="movements" element={<div className="p-8 text-xl font-medium animate-fade-in text-foreground/50">Stock Movements Center</div>} />
            <Route path="settings" element={<div className="p-8 text-xl font-medium animate-fade-in text-foreground/50">App Settings</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
