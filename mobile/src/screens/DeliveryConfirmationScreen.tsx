import { useState } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMyOrders, updateOrderStatus, uploadProofOfDelivery, type OrderStatus } from "../api/orders";
import { DriverTabBar } from "../components/DriverTabBar";
import type { AppStackParamList } from "../navigation/types";

const ACTIVE_STATUSES: OrderStatus[] = ["assigned", "picked_up", "in_transit", "near_destination"];

export function DeliveryConfirmationScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const queryClient = useQueryClient();
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: fetchMyOrders,
  });

  const currentOrder = data?.orders.find((order) => ACTIVE_STATUSES.includes(order.status));

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrder || !photoUri) return;
      await uploadProofOfDelivery(currentOrder.id, {
        uri: photoUri,
        name: "proof_of_delivery.jpg",
        type: "image/jpeg",
      });
      await updateOrderStatus(currentOrder.id, "delivered");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      navigation.navigate("CurrentDelivery");
    },
    onError: () => Alert.alert("Something went wrong", "Please try again."),
  });

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera permission required", "Please allow camera access to capture proof of delivery.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: [ "images" ], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo library permission required", "Please allow photo access to attach proof of delivery.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: [ "images" ], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
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
          <Text style={styles.emptyText}>No active delivery to confirm.</Text>
        </View>
        <DriverTabBar active="CurrentDelivery" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.title}>Confirm delivery for order #{currentOrder.id}</Text>
        <Text style={styles.subtitle}>Capture a photo as proof of delivery, then confirm.</Text>

        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No photo yet</Text>
          </View>
        )}

        <View style={styles.pickerActions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto}>
            <Text style={styles.secondaryButtonText}>Take photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={pickPhoto}>
            <Text style={styles.secondaryButtonText}>Choose from library</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, (!photoUri || confirmMutation.isPending) && styles.confirmButtonDisabled]}
          onPress={() => confirmMutation.mutate()}
          disabled={!photoUri || confirmMutation.isPending}
        >
          <Text style={styles.confirmButtonText}>
            {confirmMutation.isPending ? "Confirming…" : "Confirm delivery"}
          </Text>
        </TouchableOpacity>
      </View>
      <DriverTabBar active="CurrentDelivery" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  container: { flex: 1, padding: 24, gap: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#6b7280" },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280" },
  preview: { width: "100%", height: 220, borderRadius: 8, backgroundColor: "#f3f4f6" },
  placeholder: {
    width: "100%",
    height: 220,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: { color: "#9ca3af" },
  pickerActions: { flexDirection: "row", gap: 8 },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: { color: "#4f46e5", fontWeight: "600", textAlign: "center" },
  confirmButton: { backgroundColor: "#16a34a", borderRadius: 8, paddingVertical: 14, alignItems: "center" },
  confirmButtonDisabled: { backgroundColor: "#a7f3d0" },
  confirmButtonText: { color: "#fff", fontWeight: "700" },
});
