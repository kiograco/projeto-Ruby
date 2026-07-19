import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import {
  createUser,
  deactivateUser,
  fetchUsers,
  updateUser,
  type AppUser,
  type UserCreateInput,
  type UserUpdateInput,
} from "../api/users";
import { useAuth } from "../contexts/AuthContext";
import { UserFormPanel } from "../components/users/UserFormPanel";

type FormState = { mode: "create" } | { mode: "edit"; user: AppUser } | null;

export function SettingsPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
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
    queryKey: ["users", page, debouncedSearch],
    queryFn: () => fetchUsers({ page, q: debouncedSearch || undefined }),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  }

  function extractErrors(err: unknown): string[] {
    if (isAxiosError(err) && Array.isArray(err.response?.data?.errors)) {
      return err.response.data.errors;
    }
    return ["Something went wrong. Please try again."];
  }

  const createMutation = useMutation({
    mutationFn: (input: UserCreateInput) => createUser(input),
    onSuccess: () => {
      invalidate();
      setForm(null);
      setFormErrors([]);
    },
    onError: (err) => setFormErrors(extractErrors(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: UserUpdateInput }) => updateUser(id, input),
    onSuccess: () => {
      invalidate();
      setForm(null);
      setFormErrors([]);
    },
    onError: (err) => setFormErrors(extractErrors(err)),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => deactivateUser(id),
    onSuccess: () => invalidate(),
  });

  function handleSubmit(input: UserCreateInput | UserUpdateInput) {
    if (form?.mode === "edit") {
      updateMutation.mutate({ id: form.user.id, input: input as UserUpdateInput });
    } else {
      createMutation.mutate(input as UserCreateInput);
    }
  }

  function handleDeactivate(user: AppUser) {
    if (window.confirm(`Deactivate ${user.name}?`)) {
      deactivateMutation.mutate(user.id);
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-gray-500">User management is available to admins only.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <button
          type="button"
          onClick={() => {
            setFormErrors([]);
            setForm({ mode: "create" });
          }}
          className="rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white"
        >
          New user
        </button>
      </div>

      <input
        type="text"
        placeholder="Search by name or email…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mb-4 w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm"
      />

      {isLoading && <p className="text-gray-500">Loading…</p>}
      {isError && <p className="text-red-600">Failed to load users.</p>}

      {data && (
        <>
          <div className="overflow-x-auto rounded border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Email</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Role</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-2 text-gray-900">{user.name}</td>
                    <td className="px-4 py-2 text-gray-600">{user.email}</td>
                    <td className="px-4 py-2 text-gray-600 capitalize">{user.role}</td>
                    <td className="px-4 py-2 text-gray-600">{user.active ? "Active" : "Inactive"}</td>
                    <td className="space-x-2 px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setFormErrors([]);
                          setForm({ mode: "edit", user });
                        }}
                        className="text-indigo-600 hover:underline"
                      >
                        Edit
                      </button>
                      {user.active && (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(user)}
                          className="text-red-600 hover:underline"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {data.users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                      No users found.
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
        <UserFormPanel
          user={form.mode === "edit" ? form.user : undefined}
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
