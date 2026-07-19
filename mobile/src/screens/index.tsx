import { PlaceholderScreen } from "./PlaceholderScreen";

export { SplashScreen } from "./SplashScreen";
export { LoginScreen } from "./LoginScreen";
export { ProfileScreen } from "./ProfileScreen";
export { CurrentDeliveryScreen } from "./CurrentDeliveryScreen";

export function AvailableDeliveriesScreen() {
  return <PlaceholderScreen title="Available Deliveries" />;
}

export function NavigationScreen() {
  return <PlaceholderScreen title="Navigation" />;
}

export function DeliveryConfirmationScreen() {
  return <PlaceholderScreen title="Delivery Confirmation" />;
}

export function HistoryScreen() {
  return <PlaceholderScreen title="History" />;
}

export function SettingsScreen() {
  return <PlaceholderScreen title="Settings" />;
}
