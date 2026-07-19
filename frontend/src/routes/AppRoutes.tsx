import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "../components/Layout";
import { PlaceholderPage } from "../components/PlaceholderPage";
import { LoginPage } from "../pages/LoginPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<PlaceholderPage title="Dashboard" />} />
        <Route path="/customers" element={<PlaceholderPage title="Customers" />} />
        <Route path="/drivers" element={<PlaceholderPage title="Drivers" />} />
        <Route path="/vehicles" element={<PlaceholderPage title="Vehicles" />} />
        <Route path="/orders" element={<PlaceholderPage title="Orders" />} />
        <Route path="/tracking" element={<PlaceholderPage title="Tracking" />} />
        <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
        <Route path="/profile" element={<PlaceholderPage title="Profile" />} />
      </Route>
    </Routes>
  );
}
