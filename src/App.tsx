import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./providers/ThemeProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { AppLayout } from "./components/layout/AppLayout";
import { Movements } from "./pages/Movements";

// Auth
import { AuthPage } from "./pages/Auth";

// Dashboards
import { Dashboard } from "./pages/dashboards/Dashboard";

// Products
import { Items as Products } from "./pages/Items";
import { Categories } from "./pages/Categories";
import { Suppliers } from "./pages/products/Suppliers";

// Operations
import { Receipts } from "./pages/operations/Receipts";
import { DeliveryOrders } from "./pages/operations/DeliveryOrders";
import { InternalTransfers } from "./pages/operations/InternalTransfers";
import { StockAdjustments } from "./pages/operations/StockAdjustments";

// Reports
import { MoveHistory } from "./pages/MoveHistory";
import { Analytics } from "./pages/Analytics";

// Settings
import { Warehouses } from "./pages/settings/Warehouses";

// Profile
import { Profile } from "./pages/Profile";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ims-theme">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/" element={<AppLayout />}>
              {/* Dashboard */}
              <Route index element={<Dashboard />} />

              {/* Products */}
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="suppliers" element={<Suppliers />} />

              {/* Operations */}
              <Route path="operations/receipts" element={<Receipts />} />
              <Route path="operations/deliveries" element={<DeliveryOrders />} />
              <Route path="operations/transfers" element={<InternalTransfers />} />
              <Route path="operations/adjustments" element={<StockAdjustments />} />

              {/* Reports */}
              <Route path="history" element={<MoveHistory />} />
              <Route path="movements" element={<Movements />} />
              <Route path="analytics" element={<Analytics />} />

              {/* Settings */}
              <Route path="settings/warehouses" element={<Warehouses />} />

              {/* Profile */}
              <Route path="profile" element={<Profile />} />

              {/* Legacy redirect */}
              <Route path="inventory" element={<Navigate to="/products" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
