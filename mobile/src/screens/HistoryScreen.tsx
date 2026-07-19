import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { fetchMyOrders, type Order, type OrderStatus } from "../api/orders";
import { DriverTabBar } from "../components/DriverTabBar";

const TERMINAL_STATUSES: OrderStatus[] = ["delivered", "cancelled", "failed"];

const STATUS_COLOR: Record<string, string> = {
  delivered: "#16a34a",
  cancelled: "#6b7280",
  failed: "#dc2626",
};

export function HistoryScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-orders"],
    queryFn: fetchMyOrders,
  });

  const pastOrders = (data?.orders ?? [])
    .filter((order) => TERMINAL_STATUSES.includes(order.status))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  function renderItem({ item }: { item: Order }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <Text style={[styles.status, { color: STATUS_COLOR[item.status] ?? "#374151" }]}>{item.status}</Text>
        </View>
        <Text style={styles.customer}>{item.customer.name}</Text>
        <Text style={styles.address}>
          {item.delivery_address.street}, {item.delivery_address.number} — {item.delivery_address.city}/
          {item.delivery_address.state}
        </Text>
        {item.delivered_at && <Text style={styles.date}>Delivered {new Date(item.delivered_at).toLocaleString()}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={pastOrders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No completed deliveries yet.</Text>
            </View>
          }
        />
      )}
      <DriverTabBar active="History" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { color: "#6b7280" },
  list: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    marginBottom: 12,
    gap: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { fontSize: 15, fontWeight: "700", color: "#111827" },
  status: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  customer: { fontSize: 13, color: "#4f46e5" },
  address: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  date: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
});
