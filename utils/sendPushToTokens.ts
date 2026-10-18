import axios from "axios";
import { messaging } from "./firebase";

interface PushContent {
  title: string;
  body: string;
}

const ANDROID_NOTIFICATION_CHANNEL = "notifications_v3";
const NOTIFICATION_SOUND = "notification_sound.mp3";

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
      android: {
        notification: {
          channelId: ANDROID_NOTIFICATION_CHANNEL,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: NOTIFICATION_SOUND,
          },
        },
      },
    }));
  }

  for (let offset = 0; offset < expoTokens.length; offset += 100) {
    const messages = expoTokens.slice(offset, offset + 100).map(to => ({
      to,
      title: notification.title,
      body: notification.body,
      data,
      channelId: ANDROID_NOTIFICATION_CHANNEL,
      sound: NOTIFICATION_SOUND,
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
