import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Tracker</Text>
      <ActivityIndicator style={styles.spinner} color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4f46e5",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  spinner: {
    marginTop: 16,
  },
});
