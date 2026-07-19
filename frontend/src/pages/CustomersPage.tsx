import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  createCustomer,
  deleteCustomer,
  fetchCustomers,
  updateCustomer,
  type Customer,
  type CustomerInput,
} from "../api/customers";
import { useAuth } from "../contexts/AuthContext";
import { CustomerFormPanel } from "../components/customers/CustomerFormPanel";

type FormState = { mode: "create" } | { mode: "edit"; customer: Customer } | null;

export function CustomersPage() {
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
    queryKey: ["customers", page, debouncedSearch],
    queryFn: () => fetchCustomers({ page, q: debouncedSearch || undefined }),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["customers"] });
  }

  function extractErrors(err: unknown): string[] {
    if (isAxiosError(err) && Array.isArray(err.response?.data?.errors)) {
      return err.response.data.errors;
    }
    return ["Something went wrong. Please try again."];
  }

  const createMutation = useMutation({
    mutationFn: (input: CustomerInput) => createCustomer(input),
    onSuccess: () => {
      invalidate();
      setForm(null);
      setFormErrors([]);
    },
    onError: (err) => setFormErrors(extractErrors(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: CustomerInput }) => updateCustomer(id, input),
    onSuccess: () => {
      invalidate();
      setForm(null);
      setFormErrors([]);
    },
    onError: (err) => setFormErrors(extractErrors(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCustomer(id),
    onSuccess: () => invalidate(),
  });

  function handleSubmit(input: CustomerInput) {
    if (form?.mode === "edit") {
      updateMutation.mutate({ id: form.customer.id, input });
    } else {
      createMutation.mutate(input);
    }
  }

  function handleDelete(customer: Customer) {
    if (window.confirm(`Delete ${customer.name}?`)) {
      deleteMutation.mutate(customer.id);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Customers</h1>
        {canManage && (
          <button
            type="button"
            onClick={() => {
              setFormErrors([]);
              setForm({ mode: "create" });
            }}
            className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
          >
            New customer
          </button>
        )}
      </div>

      <input
        type="text"
        placeholder="Search by name, email, or document…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mb-4 w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm"
      />

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {isError && <p className="text-red-600">Failed to load customers.</p>}

      {data && (
        <>
          <div className="overflow-x-auto rounded border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Phone</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Email</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Document</th>
                  {canManage && <th className="px-4 py-2" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-4 py-2 text-gray-900">{customer.name}</td>
                    <td className="px-4 py-2 text-gray-600">{customer.phone}</td>
                    <td className="px-4 py-2 text-gray-600">{customer.email}</td>
                    <td className="px-4 py-2 text-gray-600">{customer.document}</td>
                    {canManage && (
                      <td className="space-x-2 px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setFormErrors([]);
                            setForm({ mode: "edit", customer });
                          }}
                          className="text-indigo-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(customer)}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {data.customers.length === 0 && (
                  <tr>
                    <td colSpan={canManage ? 5 : 4} className="px-4 py-6 text-center text-gray-500">
                      No customers found.
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
        <CustomerFormPanel
          customer={form.mode === "edit" ? form.customer : undefined}
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
