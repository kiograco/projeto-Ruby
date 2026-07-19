import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptOrder, fetchAvailableOrders, type Order } from "../api/orders";
import { DriverTabBar } from "../components/DriverTabBar";
import type { AppStackParamList } from "../navigation/types";

export function AvailableDeliveriesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["available-orders"],
    queryFn: fetchAvailableOrders,
    refetchInterval: 15000,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) => acceptOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-orders"] });
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      navigation.navigate("CurrentDelivery");
    },
  });

  function renderItem({ item }: { item: Order }) {
    return (
      <View style={styles.card}>
        <Text style={styles.orderId}>Order #{item.id}</Text>
        <Text style={styles.customer}>{item.customer.name}</Text>
        <Text style={styles.addressLabel}>Pickup</Text>
        <Text style={styles.address}>
          {item.pickup_address.street}, {item.pickup_address.number} — {item.pickup_address.city}/
          {item.pickup_address.state}
        </Text>
        <Text style={styles.addressLabel}>Delivery</Text>
        <Text style={styles.address}>
          {item.delivery_address.street}, {item.delivery_address.number} — {item.delivery_address.city}/
          {item.delivery_address.state}
        </Text>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => acceptMutation.mutate(item.id)}
          disabled={acceptMutation.isPending}
        >
          <Text style={styles.acceptButtonText}>
            {acceptMutation.isPending && acceptMutation.variables === item.id ? "Accepting…" : "Accept"}
          </Text>
        </TouchableOpacity>
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
          data={data?.orders ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={isRefetching}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No deliveries available right now.</Text>
            </View>
          }
        />
      )}
      <DriverTabBar active="AvailableDeliveries" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { color: "#6b7280" },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    marginBottom: 12,
    gap: 2,
  },
  orderId: { fontSize: 16, fontWeight: "700", color: "#111827" },
  customer: { fontSize: 14, color: "#4f46e5", marginBottom: 6 },
  addressLabel: { fontSize: 12, fontWeight: "600", color: "#374151", marginTop: 4 },
  address: { fontSize: 13, color: "#6b7280" },
  acceptButton: {
    marginTop: 12,
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  acceptButtonText: { color: "#fff", fontWeight: "600" },
});
