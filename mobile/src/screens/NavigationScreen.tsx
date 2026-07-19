import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Location from "expo-location";
import { useQuery } from "@tanstack/react-query";
import { fetchMyOrders, type OrderStatus } from "../api/orders";
import { DriverTabBar } from "../components/DriverTabBar";
import { haversineKm } from "../lib/geo";

const ACTIVE_STATUSES: OrderStatus[] = ["assigned", "picked_up", "in_transit", "near_destination"];
const FALLBACK_SPEED_KMH = 25;

export function NavigationScreen() {
  const [position, setPosition] = useState<Location.LocationObject | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: fetchMyOrders,
    refetchInterval: 15000,
  });

  const currentOrder = data?.orders.find((order) => ACTIVE_STATUSES.includes(order.status));

  const locate = useCallback(async () => {
    setIsLocating(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setPermissionError("Location permission is required to navigate.");
      setIsLocating(false);
      return;
    }
    setPermissionError(null);
    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setPosition(current);
    setIsLocating(false);
  }, []);

  useEffect(() => {
    locate();
  }, [locate]);

  const destination = currentOrder?.delivery_address;
  const hasDestinationCoords = destination?.latitude != null && destination?.longitude != null;

  const distanceKm =
    position && hasDestinationCoords
      ? haversineKm(position.coords.latitude, position.coords.longitude, destination!.latitude!, destination!.longitude!)
      : null;
  const etaMinutes = distanceKm != null ? Math.round((distanceKm / FALLBACK_SPEED_KMH) * 60) : null;

  function openInMaps() {
    if (!hasDestinationCoords) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination!.latitude},${destination!.longitude}`;
    Linking.openURL(url);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        {isLoading ? (
          <ActivityIndicator />
        ) : !currentOrder ? (
          <Text style={styles.emptyText}>No active delivery to navigate to.</Text>
        ) : (
          <>
            <Text style={styles.title}>Order #{currentOrder.id}</Text>
            <Text style={styles.addressText}>
              {currentOrder.delivery_address.street}, {currentOrder.delivery_address.number} —{" "}
              {currentOrder.delivery_address.city}/{currentOrder.delivery_address.state}
            </Text>

            {!hasDestinationCoords && (
              <Text style={styles.warnText}>This delivery has no coordinates on file yet.</Text>
            )}
            {permissionError && <Text style={styles.errorText}>{permissionError}</Text>}

            {isLocating ? (
              <ActivityIndicator />
            ) : (
              <>
                {distanceKm != null && (
                  <Text style={styles.metric}>Distance: {distanceKm.toFixed(1)} km (straight line)</Text>
                )}
                {etaMinutes != null && <Text style={styles.metric}>ETA: ~{etaMinutes} min</Text>}
              </>
            )}

            <TouchableOpacity style={styles.button} onPress={locate}>
              <Text style={styles.buttonText}>Refresh my location</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={openInMaps}
              disabled={!hasDestinationCoords}
            >
              <Text style={styles.primaryButtonText}>Open in Maps</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      <DriverTabBar active="CurrentDelivery" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  addressText: { fontSize: 14, color: "#6b7280" },
  metric: { fontSize: 15, fontWeight: "600", color: "#374151" },
  warnText: { fontSize: 13, color: "#b45309" },
  errorText: { fontSize: 13, color: "#b91c1c" },
  emptyText: { color: "#6b7280" },
  button: { borderWidth: 1, borderColor: "#4f46e5", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  buttonText: { color: "#4f46e5", fontWeight: "600" },
  primaryButton: { backgroundColor: "#4f46e5" },
  primaryButtonText: { color: "#fff", fontWeight: "600" },
});
