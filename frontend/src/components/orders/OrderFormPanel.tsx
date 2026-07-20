import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCustomers } from "../../api/customers";
import type { AddressInput, OrderCreateInput, OrderItemInput } from "../../api/orders";
import { lookupCep } from "../../api/viacep";
import { geocodeAddress } from "../../api/geocoding";

interface OrderFormPanelProps {
  errors: string[];
  isSubmitting: boolean;
  onSubmit: (input: OrderCreateInput) => void;
  onCancel: () => void;
}

const EMPTY_ADDRESS: AddressInput = {
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  zip_code: "",
  latitude: null,
  longitude: null,
};

const EMPTY_ITEM: OrderItemInput = { description: "", quantity: 1, unit_price: 0 };

function AddressFields({
  title,
  value,
  onChange,
}: {
  title: string;
  value: AddressInput;
  onChange: Dispatch<SetStateAction<AddressInput>>;
}) {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  function set<K extends keyof AddressInput>(key: K, fieldValue: AddressInput[K]) {
    onChange((prev) => ({ ...prev, [key]: fieldValue, latitude: null, longitude: null }));
  }

  async function handleZipBlur() {
    const digits = value.zip_code.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setIsLookingUp(true);
    setLookupError(null);
    try {
      const result = await lookupCep(digits);
      if (!result) {
        setLookupError("CEP not found.");
        return;
      }

      onChange((prev) => ({
        ...prev,
        street: result.logradouro || prev.street,
        neighborhood: result.bairro || prev.neighborhood,
        city: result.localidade,
        state: result.uf,
        latitude: null,
        longitude: null,
      }));
      setIsLookingUp(false);

      setIsGeocoding(true);
      const geocodeQuery = [result.logradouro, result.bairro, result.localidade, result.uf, "Brazil"]
        .filter(Boolean)
        .join(", ");
      const coords = await geocodeAddress(geocodeQuery);
      onChange((prev) => ({ ...prev, latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null }));
    } catch {
      setLookupError("Could not look up this CEP right now.");
    } finally {
      setIsLookingUp(false);
      setIsGeocoding(false);
    }
  }

  return (
    <fieldset className="space-y-2 rounded border border-gray-200 p-3">
      <legend className="px-1 text-sm font-medium text-gray-700">{title}</legend>
      <div className="grid grid-cols-2 gap-2">
        <input
          placeholder="ZIP code"
          required
          value={value.zip_code}
          onChange={(event) => set("zip_code", event.target.value)}
          onBlur={handleZipBlur}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm"
        />
        <div className="flex items-center text-xs">
          {isLookingUp && <span className="text-gray-400">Looking up CEP…</span>}
          {!isLookingUp && isGeocoding && <span className="text-gray-400">Locating on map…</span>}
          {!isLookingUp && !isGeocoding && lookupError && <span className="text-red-600">{lookupError}</span>}
          {!isLookingUp && !isGeocoding && !lookupError && value.latitude != null && (
            <span className="text-green-600">📍 Location found</span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input
          placeholder="Street"
          required
          value={value.street}
          onChange={(event) => set("street", event.target.value)}
          className="col-span-2 rounded border border-gray-300 px-2 py-1.5 text-sm"
        />
        <input
          placeholder="Number"
          required
          value={value.number}
          onChange={(event) => set("number", event.target.value)}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input
          placeholder="Neighborhood"
          required
          value={value.neighborhood}
          onChange={(event) => set("neighborhood", event.target.value)}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm"
        />
        <input
          placeholder="City"
          required
          value={value.city}
          onChange={(event) => set("city", event.target.value)}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm"
        />
        <input
          placeholder="State"
          required
          value={value.state}
          onChange={(event) => set("state", event.target.value)}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm"
        />
      </div>
    </fieldset>
  );
}

export function OrderFormPanel({ errors, isSubmitting, onSubmit, onCancel }: OrderFormPanelProps) {
  const [customerId, setCustomerId] = useState("");
  const [pickup, setPickup] = useState<AddressInput>(EMPTY_ADDRESS);
  const [delivery, setDelivery] = useState<AddressInput>(EMPTY_ADDRESS);
  const [items, setItems] = useState<OrderItemInput[]>([{ ...EMPTY_ITEM }]);

  const { data: customersData } = useQuery({
    queryKey: ["customers", "for-select"],
    queryFn: () => fetchCustomers({ page: 1 }),
  });

  function updateItem(index: number, patch: Partial<OrderItemInput>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validItems = items.filter((item) => item.description.trim().length > 0);

    onSubmit({
      customer_id: Number(customerId),
      pickup_address_attributes: pickup,
      delivery_address_attributes: delivery,
      order_items_attributes: validItems.length > 0 ? validItems : undefined,
    });
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-black/30 p-4">
      <form
        onSubmit={handleSubmit}
        className="my-8 w-full max-w-2xl space-y-4 rounded-lg bg-white p-6 shadow-lg"
      >
        <h2 className="text-lg font-semibold text-gray-900">New order</h2>

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
          <label className="text-sm font-medium text-gray-700" htmlFor="order-customer">
            Customer
          </label>
          <select
            id="order-customer"
            required
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Select a customer
            </option>
            {customersData?.customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        <AddressFields title="Pickup address" value={pickup} onChange={setPickup} />
        <AddressFields title="Delivery address" value={delivery} onChange={setDelivery} />

        <fieldset className="space-y-2 rounded border border-gray-200 p-3">
          <legend className="px-1 text-sm font-medium text-gray-700">Items</legend>
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-6 gap-2">
              <input
                placeholder="Description"
                value={item.description}
                onChange={(event) => updateItem(index, { description: event.target.value })}
                className="col-span-3 rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min={1}
                placeholder="Qty"
                value={item.quantity}
                onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })}
                className="rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
              <input
                type="number"
                min={0}
                step="0.01"
                placeholder="Unit price"
                value={item.unit_price}
                onChange={(event) => updateItem(index, { unit_price: Number(event.target.value) })}
                className="col-span-2 rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems((current) => [...current, { ...EMPTY_ITEM }])}
            className="text-sm text-indigo-600 hover:underline"
          >
            + Add item
          </button>
        </fieldset>

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
