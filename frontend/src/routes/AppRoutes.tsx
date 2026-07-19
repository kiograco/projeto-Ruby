import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "../components/Layout";
import { PlaceholderPage } from "../components/PlaceholderPage";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { LoginPage } from "../pages/LoginPage";
import { CustomersPage } from "../pages/CustomersPage";
import { DriversPage } from "../pages/DriversPage";
import { VehiclesPage } from "../pages/VehiclesPage";
import { OrdersPage } from "../pages/OrdersPage";
import { TrackingPage } from "../pages/TrackingPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/drivers" element={<DriversPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
          <Route path="/profile" element={<PlaceholderPage title="Profile" />} />
        </Route>
      </Route>
    </Routes>
  );
}
