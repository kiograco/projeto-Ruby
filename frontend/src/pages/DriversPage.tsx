import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  createDriver,
  deleteDriver,
  fetchDrivers,
  updateDriver,
  type Driver,
  type DriverCreateInput,
  type DriverUpdateInput,
} from "../api/drivers";
import { useAuth } from "../contexts/AuthContext";
import { DriverFormPanel } from "../components/drivers/DriverFormPanel";
import { DriverDocumentsPanel } from "../components/drivers/DriverDocumentsPanel";

type FormState = { mode: "create" } | { mode: "edit"; driver: Driver } | null;

const STATUS_LABEL: Record<Driver["status"], string> = {
  offline: "Offline",
  available: "Available",
  on_delivery: "On delivery",
};

export function DriversPage() {
  const { user } = useAuth();
  const canManage = user?.role === "admin";
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [form, setForm] = useState<FormState>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [documentsDriver, setDocumentsDriver] = useState<Driver | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["drivers", page, debouncedSearch],
    queryFn: () => fetchDrivers({ page, q: debouncedSearch || undefined }),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["drivers"] });
  }

  function extractErrors(err: unknown): string[] {
    if (isAxiosError(err) && Array.isArray(err.response?.data?.errors)) {
      return err.response.data.errors;
    }
    return ["Something went wrong. Please try again."];
  }

  const createMutation = useMutation({
    mutationFn: (input: DriverCreateInput) => createDriver(input),
    onSuccess: () => {
      invalidate();
      setForm(null);
      setFormErrors([]);
    },
    onError: (err) => setFormErrors(extractErrors(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: DriverUpdateInput }) => updateDriver(id, input),
    onSuccess: () => {
      invalidate();
      setForm(null);
      setFormErrors([]);
    },
    onError: (err) => setFormErrors(extractErrors(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteDriver(id),
    onSuccess: () => invalidate(),
  });

  function handleSubmit(input: DriverCreateInput | DriverUpdateInput) {
    if (form?.mode === "edit") {
      updateMutation.mutate({ id: form.driver.id, input: input as DriverUpdateInput });
    } else {
      createMutation.mutate(input as DriverCreateInput);
    }
  }

  function handleDelete(driver: Driver) {
    if (window.confirm(`Delete ${driver.name}?`)) {
      deleteMutation.mutate(driver.id);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Drivers</h1>
        {canManage && (
          <button
            type="button"
            onClick={() => {
              setFormErrors([]);
              setForm({ mode: "create" });
            }}
            className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
          >
            New driver
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search by name, email, or license…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mb-4 w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm"
      />

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {isError && <p className="text-red-600">Failed to load drivers.</p>}

      {data && (
        <>
          <div className="overflow-x-auto rounded border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Email</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">License</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Vehicle</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                  {canManage && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.drivers.map((driver) => (
                  <tr key={driver.id}>
                    <td className="px-4 py-2 text-gray-900">{driver.name}</td>
                    <td className="px-4 py-2 text-gray-600">{driver.email}</td>
                    <td className="px-4 py-2 text-gray-600">{driver.license_number}</td>
                    <td className="px-4 py-2 text-gray-600">{driver.vehicle ? driver.vehicle.plate : "—"}</td>
                    <td className="px-4 py-2 text-gray-600">{STATUS_LABEL[driver.status]}</td>
                    {canManage && (
                      <td className="space-x-2 px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setDocumentsDriver(driver)}
                          className="text-gray-500 hover:underline"
                        >
                          Documents
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setFormErrors([]);
                            setForm({ mode: "edit", driver });
                          }}
                          className="text-indigo-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(driver)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {data.drivers.length === 0 && (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="px-4 py-6 text-center text-gray-500">
                      No drivers found.
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
        <DriverFormPanel
          driver={form.mode === "edit" ? form.driver : undefined}
          errors={formErrors}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          onSubmit={handleSubmit}
          onCancel={() => {
            setForm(null);
            setFormErrors([]);
          }}
        />
      )}

      {documentsDriver && (
        <DriverDocumentsPanel
          driver={data?.drivers.find((candidate) => candidate.id === documentsDriver.id) ?? documentsDriver}
          onClose={() => setDocumentsDriver(null)}
        />
      )}
    </div>
  );
}
