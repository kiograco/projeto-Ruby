import { useState, type FormEvent } from "react";
import { isAxiosError } from "axios";
import { updateCurrentUser } from "../api/auth";
import { useAuth } from "../contexts/AuthContext";

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrors([]);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const updated = await updateCurrentUser({
        name,
        password: password || undefined,
        password_confirmation: password ? passwordConfirmation : undefined,
      });
      setUser(updated);
      setPassword("");
      setPasswordConfirmation("");
      setSuccess(true);
    } catch (err) {
      if (isAxiosError(err) && Array.isArray(err.response?.data?.errors)) {
        setErrors(err.response.data.errors);
      } else {
        setErrors(["Something went wrong. Please try again."]);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Profile</h1>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        {success && (
          <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Profile updated.
          </div>
        )}
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
          <label className="text-sm font-medium text-gray-700" htmlFor="profile-email">
            Email
          </label>
          <input
            id="profile-email"
            value={user?.email ?? ""}
            disabled
            className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="profile-role">
            Role
          </label>
          <input
            id="profile-role"
            value={user?.role ?? ""}
            disabled
            className="w-full rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 capitalize"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="profile-name">
            Name
          </label>
          <input
            id="profile-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="profile-password">
            New password
          </label>
          <input
            id="profile-password"
            type="password"
            placeholder="Leave blank to keep current password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {password && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="profile-password-confirmation">
              Confirm new password
            </label>
            <input
              id="profile-password-confirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(event) => setPasswordConfirmation(event.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
