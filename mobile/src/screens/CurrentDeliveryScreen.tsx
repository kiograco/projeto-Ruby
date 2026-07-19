import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import * as Location from "expo-location";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ORDER_STATUS_TRANSITIONS,
  fetchMyOrders,
  updateOrderStatus,
  type OrderStatus,
} from "../api/orders";
import { reportLocation } from "../api/tracking";
import { DriverTabBar } from "../components/DriverTabBar";
import type { AppStackParamList } from "../navigation/types";

const ACTIVE_STATUSES: OrderStatus[] = ["assigned", "picked_up", "in_transit", "near_destination"];

export function CurrentDeliveryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const queryClient = useQueryClient();
  const [isSharing, setIsSharing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: fetchMyOrders,
    refetchInterval: 10000,
  });

  const currentOrder = data?.orders.find((order) => ACTIVE_STATUSES.includes(order.status));

  useEffect(() => {
    return () => {
      watchSubscription.current?.remove();
    };
  }, []);

  async function toggleSharing() {
    if (!currentOrder) return;

    if (isSharing) {
      watchSubscription.current?.remove();
      watchSubscription.current = null;
      setIsSharing(false);
      return;
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setPermissionError("Location permission is required to share your position.");
      return;
    }

    setPermissionError(null);
    watchSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 0 },
      (position) => {
        reportLocation(currentOrder.id, {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed ?? undefined,
          heading: position.coords.heading ?? undefined,
        }).catch(() => {});
      }
    );
    setIsSharing(true);
  }

  async function advanceStatus(nextStatus: OrderStatus) {
    if (!currentOrder) return;
    await updateOrderStatus(currentOrder.id, nextStatus);
    queryClient.invalidateQueries({ queryKey: ["my-orders"] });
  }

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
        <DriverTabBar active="CurrentDelivery" />
      </View>
    );
  }

  if (!currentOrder) {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>No active delivery right now.</Text>
        </View>
        <DriverTabBar active="CurrentDelivery" />
      </View>
    );
  }

  const nextStatuses = ORDER_STATUS_TRANSITIONS[currentOrder.status];
  const canConfirmDelivery = currentOrder.status === "near_destination";

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Order #{currentOrder.id}</Text>
        <Text style={styles.status}>{currentOrder.status}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pickup</Text>
          <Text style={styles.addressText}>
            {currentOrder.pickup_address.street}, {currentOrder.pickup_address.number} —{" "}
            {currentOrder.pickup_address.city}/{currentOrder.pickup_address.state}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery</Text>
          <Text style={styles.addressText}>
            {currentOrder.delivery_address.street}, {currentOrder.delivery_address.number} —{" "}
            {currentOrder.delivery_address.city}/{currentOrder.delivery_address.state}
          </Text>
        </View>

        <View style={styles.shareRow}>
          <Text style={styles.sectionTitle}>Share location</Text>
          <Switch value={isSharing} onValueChange={toggleSharing} />
        </View>
        {permissionError && <Text style={styles.errorText}>{permissionError}</Text>}

        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("Navigation")}>
          <Text style={styles.secondaryButtonText}>Navigate to destination</Text>
        </TouchableOpacity>

        {canConfirmDelivery && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate("DeliveryConfirmation")}
          >
            <Text style={styles.secondaryButtonText}>Confirm delivery</Text>
          </TouchableOpacity>
        )}

        <View style={styles.actions}>
          {nextStatuses.map((next) => (
            <TouchableOpacity key={next} style={styles.button} onPress={() => advanceStatus(next)}>
              <Text style={styles.buttonText}>Mark as {next.replace("_", " ")}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <DriverTabBar active="CurrentDelivery" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 24, gap: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#6b7280" },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  status: { fontSize: 14, color: "#4f46e5", textTransform: "uppercase", fontWeight: "600" },
  section: { gap: 4 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#374151" },
  addressText: { fontSize: 14, color: "#6b7280" },
  shareRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  errorText: { color: "#b91c1c", fontSize: 13 },
  actions: { gap: 8 },
  button: { backgroundColor: "#4f46e5", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#4f46e5", fontWeight: "600" },
});
