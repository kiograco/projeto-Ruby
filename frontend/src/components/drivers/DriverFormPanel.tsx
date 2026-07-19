import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchVehicles } from "../../api/vehicles";
import type { Driver, DriverCreateInput, DriverUpdateInput } from "../../api/drivers";

interface DriverFormPanelProps {
  driver?: Driver;
  errors: string[];
  isSubmitting: boolean;
  onSubmit: (input: DriverCreateInput | DriverUpdateInput) => void;
  onCancel: () => void;
}

const STATUSES = ["offline", "available", "on_delivery"] as const;

export function DriverFormPanel({ driver, errors, isSubmitting, onSubmit, onCancel }: DriverFormPanelProps) {
  const [name, setName] = useState(driver?.name ?? "");
  const [email, setEmail] = useState(driver?.email ?? "");
  const [password, setPassword] = useState("");
  const [licenseNumber, setLicenseNumber] = useState(driver?.license_number ?? "");
  const [vehicleId, setVehicleId] = useState<string>(driver?.vehicle ? String(driver.vehicle.id) : "");
  const [status, setStatus] = useState(driver?.status ?? "offline");

  const { data: vehiclesData } = useQuery({
    queryKey: ["vehicles", "for-select"],
    queryFn: () => fetchVehicles({ page: 1 }),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedVehicleId = vehicleId ? Number(vehicleId) : null;

    if (driver) {
      onSubmit({ license_number: licenseNumber, vehicle_id: parsedVehicleId, status });
    } else {
      onSubmit({ name, email, password, license_number: licenseNumber, vehicle_id: parsedVehicleId, status });
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">{driver ? "Edit driver" : "New driver"}</h2>

        {errors.length > 0 && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <ul className="list-inside list-disc">
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        {!driver && (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="driver-name">
                Name
              </label>
              <input
                id="driver-name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="driver-email">
                Email
              </label>
              <input
                id="driver-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="driver-password">
                Password
              </label>
              <input
                id="driver-password"
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="driver-license">
            License number
          </label>
          <input
            id="driver-license"
            required
            value={licenseNumber}
            onChange={(event) => setLicenseNumber(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="driver-vehicle">
              Vehicle
            </label>
            <select
              id="driver-vehicle"
              value={vehicleId}
              onChange={(event) => setVehicleId(event.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              {vehiclesData?.vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate} — {vehicle.model}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="driver-status">
              Status
            </label>
            <select
              id="driver-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as (typeof STATUSES)[number])}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
