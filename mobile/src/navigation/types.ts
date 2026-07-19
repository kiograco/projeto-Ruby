export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  AvailableDeliveries: undefined;
  CurrentDelivery: { orderId: string };
  Navigation: { orderId: string };
  DeliveryConfirmation: { orderId: string };
  History: undefined;
  Profile: undefined;
  Settings: undefined;
};
