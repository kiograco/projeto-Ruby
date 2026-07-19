import { useState, type FormEvent } from "react";
import { ROLES, type AppUser, type UserCreateInput, type UserUpdateInput } from "../../api/users";

interface UserFormPanelProps {
  user?: AppUser;
  errors: string[];
  isSubmitting: boolean;
  onSubmit: (input: UserCreateInput | UserUpdateInput) => void;
  onCancel: () => void;
}

export function UserFormPanel({ user, errors, isSubmitting, onSubmit, onCancel }: UserFormPanelProps) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>(user?.role ?? ROLES[0]);
  const [active, setActive] = useState(user?.active ?? true);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (user) {
      const input: UserUpdateInput = { name, email, role, active };
      if (password) input.password = password;
      onSubmit(input);
    } else {
      onSubmit({ name, email, password, role });
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">{user ? "Edit user" : "New user"}</h2>

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
          <label className="text-sm font-medium text-gray-700" htmlFor="user-name">
            Name
          </label>
          <input
            id="user-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="user-email">
            Email
          </label>
          <input
            id="user-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="user-password">
            Password {user && <span className="font-normal text-gray-400">(leave blank to keep current)</span>}
          </label>
          <input
            id="user-password"
            type="password"
            required={!user}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="user-role">
              Role
            </label>
            <select
              id="user-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {ROLES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          {user && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="user-active">
                Status
              </label>
              <select
                id="user-active"
                value={active ? "active" : "inactive"}
                onChange={(event) => setActive(event.target.value === "active")}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
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
