import { useState, type FormEvent } from "react";
import type { Customer, CustomerInput } from "../../api/customers";

interface CustomerFormPanelProps {
  customer?: Customer;
  errors: string[];
  isSubmitting: boolean;
  onSubmit: (input: CustomerInput) => void;
  onCancel: () => void;
}

export function CustomerFormPanel({ customer, errors, isSubmitting, onSubmit, onCancel }: CustomerFormPanelProps) {
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [document, setDocument] = useState(customer?.document ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit({ name, phone, email, document });
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-gray-900">{customer ? "Edit customer" : "New customer"}</h2>

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
          <label className="text-sm font-medium text-gray-700" htmlFor="customer-name">
            Name
          </label>
          <input
            id="customer-name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="customer-phone">
            Phone
          </label>
          <input
            id="customer-phone"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="customer-email">
            Email
          </label>
          <input
            id="customer-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700" htmlFor="customer-document">
            Document
          </label>
          <input
            id="customer-document"
            required
            value={document}
            onChange={(event) => setDocument(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
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
