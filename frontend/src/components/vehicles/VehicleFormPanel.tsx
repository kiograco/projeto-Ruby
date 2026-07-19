import { useState, type FormEvent } from "react";
import { VEHICLE_TYPES, type Vehicle, type VehicleInput } from "../../api/vehicles";

interface VehicleFormPanelProps {
  vehicle?: Vehicle;
  errors: string[];
  isSubmitting: boolean;
  onSubmit: (input: VehicleInput) => void;
  onCancel: () => void;
}

export function VehicleFormPanel({ vehicle, errors, isSubmitting, onSubmit, onCancel }: VehicleFormPanelProps) {
  const [plate, setPlate] = useState(vehicle?.plate ?? "");
  const [model, setModel] = useState(vehicle?.model ?? "");
  const [year, setYear] = useState(vehicle?.year ?? new Date().getFullYear());
  const [vehicleType, setVehicleType] = useState(vehicle?.vehicle_type ?? VEHICLE_TYPES[0]);
  const [capacity, setCapacity] = useState(vehicle?.capacity ?? 0);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ plate, model, year, vehicle_type: vehicleType, capacity });
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">{vehicle ? "Edit vehicle" : "New vehicle"}</h2>

        {errors.length > 0 && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <ul className="list-inside list-disc">
              {errors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="vehicle-plate">
            Plate
          </label>
          <input
            id="vehicle-plate"
            required
            value={plate}
            onChange={(event) => setPlate(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="vehicle-model">
            Model
          </label>
          <input
            id="vehicle-model"
            required
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="vehicle-year">
              Year
            </label>
            <input
              id="vehicle-year"
              type="number"
              required
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="vehicle-capacity">
              Capacity (kg)
            </label>
            <input
              id="vehicle-capacity"
              type="number"
              step="0.01"
              required
              value={capacity}
              onChange={(event) => setCapacity(Number(event.target.value))}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="vehicle-type">
            Type
          </label>
          <select
            id="vehicle-type"
            value={vehicleType}
            onChange={(event) => setVehicleType(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            {VEHICLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
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
