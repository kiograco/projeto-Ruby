import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchOrders } from "../api/orders";
import { fetchTrackingHistory, type TrackingPoint } from "../api/tracking";
import { useOrderTracking } from "../hooks/useOrderTracking";

const FALLBACK_CENTER: [number, number] = [-23.55, -46.63];

const driverIcon = L.divIcon({
  className: "",
  html: '<div style="background:#4f46e5;width:16px;height:16px;border-radius:9999px;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>',
  iconSize: [16, 16],
});

const destinationIcon = L.divIcon({
  className: "",
  html: '<div style="background:#ef4444;width:14px;height:14px;border-radius:9999px;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.4)"></div>',
  iconSize: [14, 14],
});

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function RecenterOnUpdate({ position }: { position: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) map.setView(position, map.getZoom(), { animate: true });
  }, [position, map]);

  return null;
}

export function TrackingPage() {
  const [orderId, setOrderId] = useState<number | null>(null);
  const [points, setPoints] = useState<TrackingPoint[]>([]);

  const { data: ordersData } = useQuery({
    queryKey: ["orders", "for-tracking"],
    queryFn: () => fetchOrders({ page: 1 }),
  });

  const trackableOrders = (ordersData?.orders ?? []).filter(
    (order) => order.driver && !["delivered", "cancelled", "failed"].includes(order.status)
  );

  useEffect(() => {
    if (!orderId) {
      setPoints([]);
      return;
    }
    fetchTrackingHistory(orderId).then((data) => setPoints(data.points));
  }, [orderId]);

  const handlePoint = useCallback((point: TrackingPoint) => {
    setPoints((current) => [...current, point]);
  }, []);

  useOrderTracking(orderId, handlePoint);

  const selectedOrder = trackableOrders.find((order) => order.id === orderId);
  const latest = points[points.length - 1];
  const destination = selectedOrder?.delivery_address;
  const hasDestinationCoords = destination?.latitude != null && destination?.longitude != null;

  const currentPosition: [number, number] | null = latest ? [latest.latitude, latest.longitude] : null;
  const initialCenter: [number, number] = hasDestinationCoords
    ? [destination!.latitude!, destination!.longitude!]
    : FALLBACK_CENTER;

  const distanceKm =
    latest && hasDestinationCoords
      ? haversineKm(latest.latitude, latest.longitude, destination!.latitude!, destination!.longitude!)
      : null;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold text-gray-900">Tracking</h1>

      <select
        value={orderId ?? ""}
        onChange={(event) => setOrderId(event.target.value ? Number(event.target.value) : null)}
        className="mb-4 w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">Select an order</option>
        {trackableOrders.map((order) => (
          <option key={order.id} value={order.id}>
            #{order.id} — {order.customer.name} ({order.driver?.name})
          </option>
        ))}
      </select>

      {orderId && (
        <div className="mb-3 flex gap-6 text-sm text-gray-600">
          <span>
            Status: <strong className="text-gray-900">{selectedOrder?.status}</strong>
          </span>
          {latest?.speed != null && <span>Speed: {latest.speed} km/h</span>}
          {distanceKm != null && <span>Distance remaining: {distanceKm.toFixed(1)} km</span>}
          {!latest && <span className="text-gray-400">Waiting for the driver's first location update…</span>}
        </div>
      )}

      <div className="h-[500px] overflow-hidden rounded border border-gray-200">
        <MapContainer key={orderId ?? "empty"} center={initialCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterOnUpdate position={currentPosition} />
          {points.length > 1 && (
            <Polyline positions={points.map((point) => [point.latitude, point.longitude])} color="#4f46e5" />
          )}
          {currentPosition && (
            <Marker position={currentPosition} icon={driverIcon}>
              <Popup>Driver{latest?.speed != null ? ` — ${latest.speed} km/h` : ""}</Popup>
            </Marker>
          )}
          {hasDestinationCoords && (
            <Marker position={[destination!.latitude!, destination!.longitude!]} icon={destinationIcon}>
              <Popup>Destination</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {!orderId && (
        <p className="mt-4 text-gray-500">Select an order with an assigned driver to see live tracking.</p>
      )}
    </div>
  );
}
