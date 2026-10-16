import axios from "axios";
import { messaging } from "./firebase";

interface PushContent {
  title: string;
  body: string;
}

export const sendPushToTokens = async (
  tokens: string[],
  notification: PushContent,
  data?: Record<string, string>,
) => {
  const expoTokens = tokens.filter(token => /^(ExponentPushToken|ExpoPushToken)\[/.test(token));
  const fcmTokens = tokens.filter(token => !/^(ExponentPushToken|ExpoPushToken)\[/.test(token));
  const results: unknown[] = [];

  if (fcmTokens.length > 0) {
    results.push(await messaging.sendEachForMulticast({
      notification,
      data,
      tokens: fcmTokens,
    }));
  }

  for (let offset = 0; offset < expoTokens.length; offset += 100) {
    const messages = expoTokens.slice(offset, offset + 100).map(to => ({
      to,
      title: notification.title,
      body: notification.body,
      data,
    }));
    const response = await axios.post<{ data: { status: string; message?: string }[] }>(
      "https://exp.host/--/api/v2/push/send",
      messages,
      { headers: { "Content-Type": "application/json" } },
    );
    const failures = response.data.data.filter(ticket => ticket.status !== "ok");
    if (failures.length > 0) {
      console.error("Expo push notification delivery failed:", failures);
    }
    results.push(response.data);
  }

  return results;
};
