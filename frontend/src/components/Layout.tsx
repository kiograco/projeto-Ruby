import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { NotificationBell } from "./NotificationBell";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/customers", label: "Customers" },
  { to: "/drivers", label: "Drivers" },
  { to: "/vehicles", label: "Vehicles" },
  { to: "/orders", label: "Orders" },
  { to: "/tracking", label: "Tracking" },
  { to: "/reports", label: "Reports" },
  { to: "/settings", label: "Settings" },
  { to: "/profile", label: "Profile" },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white">
        <div className="px-4 py-4 text-lg font-semibold text-gray-900">Delivery Tracker</div>
        <nav className="flex flex-1 flex-col gap-1 px-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm font-medium ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-3">
          <div className="px-1 text-sm font-medium text-gray-900">{user?.name}</div>
          <div className="px-1 text-xs text-gray-500 capitalize">{user?.role}</div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 w-full rounded px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1">
        <header className="flex items-center justify-end border-b border-gray-200 bg-white px-4 py-2">
          <NotificationBell />
        </header>
        <Outlet />
      </main>
    </div>
  );
}
