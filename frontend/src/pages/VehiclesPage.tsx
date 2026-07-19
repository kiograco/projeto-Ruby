import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  createVehicle,
  deleteVehicle,
  fetchVehicles,
  updateVehicle,
  type Vehicle,
  type VehicleInput,
} from "../api/vehicles";
import { useAuth } from "../contexts/AuthContext";
import { VehicleFormPanel } from "../components/vehicles/VehicleFormPanel";

type FormState = { mode: "create" } | { mode: "edit"; vehicle: Vehicle } | null;

export function VehiclesPage() {
  const { user } = useAuth();
  const canManage = user?.role === "admin";
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [form, setForm] = useState<FormState>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["vehicles", page, debouncedSearch],
    queryFn: () => fetchVehicles({ page, q: debouncedSearch || undefined }),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["vehicles"] });
  }

  function extractErrors(err: unknown): string[] {
    if (isAxiosError(err) && Array.isArray(err.response?.data?.errors)) {
      return err.response.data.errors;
    }
    return ["Something went wrong. Please try again."];
  }

  const createMutation = useMutation({
    mutationFn: (input: VehicleInput) => createVehicle(input),
    onSuccess: () => {
      invalidate();
      setForm(null);
      setFormErrors([]);
    },
    onError: (err) => setFormErrors(extractErrors(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: VehicleInput }) => updateVehicle(id, input),
    onSuccess: () => {
      invalidate();
      setForm(null);
      setFormErrors([]);
    },
    onError: (err) => setFormErrors(extractErrors(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteVehicle(id),
    onSuccess: () => invalidate(),
  });

  function handleSubmit(input: VehicleInput) {
    if (form?.mode === "edit") {
      updateMutation.mutate({ id: form.vehicle.id, input });
    } else {
      createMutation.mutate(input);
    }
  }

  function handleDelete(vehicle: Vehicle) {
    if (window.confirm(`Delete ${vehicle.plate}?`)) {
      deleteMutation.mutate(vehicle.id);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Vehicles</h1>
        {canManage && (
          <button
            type="button"
            onClick={() => {
              setFormErrors([]);
              setForm({ mode: "create" });
            }}
            className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
          >
            New vehicle
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search by plate or model…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mb-4 w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm"
      />

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {isError && <p className="text-red-600">Failed to load vehicles.</p>}

      {data && (
        <>
          <div className="overflow-x-auto rounded border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Plate</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Model</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Year</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Type</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Capacity</th>
                  {canManage && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td className="px-4 py-2 text-gray-900">{vehicle.plate}</td>
                    <td className="px-4 py-2 text-gray-600">{vehicle.model}</td>
                    <td className="px-4 py-2 text-gray-600">{vehicle.year}</td>
                    <td className="px-4 py-2 text-gray-600 capitalize">{vehicle.vehicle_type}</td>
                    <td className="px-4 py-2 text-gray-600">{vehicle.capacity} kg</td>
                    {canManage && (
                      <td className="space-x-2 px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setFormErrors([]);
                            setForm({ mode: "edit", vehicle });
                          }}
                          className="text-indigo-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(vehicle)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {data.vehicles.length === 0 && (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="px-4 py-6 text-center text-gray-500">
                      No vehicles found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Page {data.meta.page} of {data.meta.pages} ({data.meta.count} total)
            </span>
            <div className="space-x-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= data.meta.pages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded border border-gray-300 px-3 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {form && (
        <VehicleFormPanel
          vehicle={form.mode === "edit" ? form.vehicle : undefined}
          errors={formErrors}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSubmit}
          onCancel={() => {
            setForm(null);
            setFormErrors([]);
          }}
        />
      )}
    </div>
  );
}
