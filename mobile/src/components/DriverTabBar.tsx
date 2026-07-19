import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AppStackParamList } from "../navigation/types";

type Screen = keyof Pick<AppStackParamList, "AvailableDeliveries" | "CurrentDelivery" | "History" | "Profile">;

interface DriverTabBarProps {
  active: Screen;
}

const TABS: { screen: Screen; label: string }[] = [
  { screen: "AvailableDeliveries", label: "Available" },
  { screen: "CurrentDelivery", label: "Current" },
  { screen: "History", label: "History" },
  { screen: "Profile", label: "Profile" },
];

export function DriverTabBar({ active }: DriverTabBarProps) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={styles.container}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.screen}
          style={styles.tab}
          onPress={() => navigation.navigate(tab.screen)}
          disabled={tab.screen === active}
        >
          <Text style={[styles.label, tab.screen === active && styles.activeLabel]}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  label: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  activeLabel: {
    color: "#4f46e5",
    fontWeight: "700",
  },
});
