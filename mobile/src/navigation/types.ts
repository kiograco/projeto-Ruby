export type AuthStackParamList = {
  Login: undefined;
};

export type AppStackParamList = {
  AvailableDeliveries: undefined;
  CurrentDelivery: { orderId: string };
  Navigation: { orderId: string };
  DeliveryConfirmation: { orderId: string };
  History: undefined;
  Profile: undefined;
  Settings: undefined;
};
