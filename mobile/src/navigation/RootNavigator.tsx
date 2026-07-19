import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../contexts/AuthContext";
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
import type { AppStackParamList, AuthStackParamList } from "./types";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

export function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!user) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Login" component={LoginScreen} />
      </AuthStack.Navigator>
    );
  }

  return (
    <AppStack.Navigator initialRouteName="AvailableDeliveries">
      <AppStack.Screen
        name="AvailableDeliveries"
        component={AvailableDeliveriesScreen}
        options={{ title: "Available Deliveries" }}
      />
      <AppStack.Screen
        name="CurrentDelivery"
        component={CurrentDeliveryScreen}
        options={{ title: "Current Delivery" }}
      />
      <AppStack.Screen name="Navigation" component={NavigationScreen} />
      <AppStack.Screen
        name="DeliveryConfirmation"
        component={DeliveryConfirmationScreen}
        options={{ title: "Delivery Confirmation" }}
      />
      <AppStack.Screen name="History" component={HistoryScreen} />
      <AppStack.Screen name="Profile" component={ProfileScreen} />
      <AppStack.Screen name="Settings" component={SettingsScreen} />
    </AppStack.Navigator>
  );
}
