import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  SplashScreen,
  LoginScreen,
  AvailableDeliveriesScreen,
  CurrentDeliveryScreen,
  NavigationScreen,
  DeliveryConfirmationScreen,
  HistoryScreen,
  ProfileScreen,
  SettingsScreen,
} from "../screens";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="AvailableDeliveries" component={AvailableDeliveriesScreen} options={{ headerShown: true }} />
      <Stack.Screen name="CurrentDelivery" component={CurrentDeliveryScreen} options={{ headerShown: true }} />
      <Stack.Screen name="Navigation" component={NavigationScreen} options={{ headerShown: true }} />
      <Stack.Screen name="DeliveryConfirmation" component={DeliveryConfirmationScreen} options={{ headerShown: true }} />
      <Stack.Screen name="History" component={HistoryScreen} options={{ headerShown: true }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: true }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true }} />
    </Stack.Navigator>
  );
}
