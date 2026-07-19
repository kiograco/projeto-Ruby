import { createConsumer, type Consumer } from "@rails/actioncable";
import { tokenStorage } from "./tokenStorage";

const CABLE_URL = import.meta.env.VITE_CABLE_URL ?? "ws://localhost:3000/cable";

let consumer: Consumer | null = null;

export function getCableConsumer(): Consumer {
  if (!consumer) {
    const token = tokenStorage.getAccessToken() ?? "";
    consumer = createConsumer(`${CABLE_URL}?token=${encodeURIComponent(token)}`);
  }
  return consumer;
}
