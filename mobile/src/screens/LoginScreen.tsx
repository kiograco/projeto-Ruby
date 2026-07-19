import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Sign In</Text>
      <TextInput style={styles.input} placeholder="Email" editable={false} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry editable={false} />
      <TouchableOpacity style={styles.button} disabled>
        <Text style={styles.buttonText}>Sign in (wired up in Sprint 2)</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  button: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
