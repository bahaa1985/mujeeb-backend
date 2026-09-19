import { prismaClient } from "../../utils/prisma-adapter";
import {sendTextMessage} from "./evolutionSendTextMessage"
import { logAndNotify } from "../logs/log.service";
import { messaging } from "../../utils/firebase";
import { NotificationType, TargetRole } from "@prisma/client";

export const getMessagesByPharmacyIdService = async (
  pharmacyId: number,
) => {
  try {
    const messages = await prismaClient.messages.findMany({
      where:{pharmacy_id: Number(pharmacyId)},
      orderBy: { created_at: 'asc' },
    });
    return messages;
  } catch (error: any) {
    console.error("Error fetching messages by pharmacy:", error);
    logAndNotify({
        userId: 0,
        pharmacyId: pharmacyId || 1,
        action: "APP_ERROR",
        metadata: { error_title: "Error fetching pharmacy messages", error: error.message, stack: error.stack, context: "getMessagesByPharmacyIdService" }
    }).catch(e => console.error(e));
    throw error;
  }
};

export const getMessagesByUserNumberService = async (
  userNumber: string,
  contactPhone?: string,
) => {
  try {
    if (!contactPhone) return [];
    const messages = await prismaClient.messages.findMany({
      where:{
        AND:{
          OR: [
            { from_number: contactPhone.trim() ,to_number: userNumber.trim() },
            {from_number:userNumber.trim(),to_number:contactPhone.trim()}
          ],
        }
      },
      orderBy: { created_at: 'asc' },
    });
    return messages;
  } catch (error: any) {
    console.error("Error fetching messages by user number:", error);
    logAndNotify({
        userId: 0,
        pharmacyId: null,
        action: "APP_ERROR",
        metadata: { error_title: "Error fetching user messages", error: error.message, stack: error.stack, context: "getMessagesByUserNumberService" }
    }).catch(e => console.error(e));
    throw error;
  }
};

export const getOrderMessageCountByUserMobileService = async (mobile: string) => {
  try {
    return await prismaClient.messages.count({
      where: {
        message_type: 11,
        to_number: mobile.trim(),
      },
    });
  } catch (error: any) {
    console.error("Error counting order messages by user mobile:", error);
    logAndNotify({
      userId: 0,
      pharmacyId: null,
      action: "APP_ERROR",
      metadata: {
        error_title: "Error counting user order messages",
        error: error.message,
        stack: error.stack,
        context: "getOrderMessageCountByUserMobileService",
      },
    }).catch(e => console.error(e));
    throw error;
  }
};

export const getOrderMessageCountByPharmacyService = async (pharmacyId: number) => {
  try {
    return await prismaClient.messages.count({
      where: {
        message_type: 11,
        pharmacy_id: Number(pharmacyId),
      },
    });
  } catch (error: any) {
    console.error("Error counting order messages by pharmacy:", error);
    logAndNotify({
      userId: 0,
      pharmacyId: Number(pharmacyId),
      action: "APP_ERROR",
      metadata: {
        error_title: "Error counting pharmacy order messages",
        error: error.message,
        stack: error.stack,
        context: "getOrderMessageCountByPharmacyService",
      },
    }).catch(e => console.error(e));
    throw error;
  }
};

export const getUserMessagesCount = async (userNumber: string) => {
  try {
    const count = await prismaClient.messages.count({
      where: {
        from_number: userNumber.trim(),
        OR: 
          [
          { to_number: userNumber.trim() }],
      },
    });
    return count;
  }
  catch (error: any) {
    console.error("Error counting messages:", error);
    throw error;
  }
};

export const getPharmacyMessagesCount = async (pharmacyId: number) => {
  try {
    const count = await prismaClient.messages.count({
      where: {
        pharmacy_id: Number(pharmacyId),
      },
    });
    return count;
  }
  catch (error: any) {
    console.error("Error counting pharmacy messages:", error);
    throw error;
  }
};

export const createMessageService = async ({
  fromNumber,
  toNumber,
  instance_name,
  message,
  message_type,
  imageUrl,
  pharmacyId,
  original_id,
  confidence,
  log,
}: {
  fromNumber: string;
  toNumber: string;
  instance_name: string;
  message?: string;
  message_type?: number;
  imageUrl?: string;
  pharmacyId: number;
  original_id?: string;
  confidence?:number;
  log: string;
}) => {
  try {
    // const messageType = await getTextMessageType();
    const evolution_message = await sendTextMessage(toNumber,message||"",instance_name)
    // if(!evolution_message || evolution_message.status !== "success"){
    //   throw new Error("Failed to send message via Evolution API");
    // }
    // console.log("evo object",evolution_message)
    original_id = evolution_message.key.id.toString();
    log = evolution_message.status;
    const newMessage = await prismaClient.messages.create({
      data: {
        from_number: fromNumber,
        to_number: toNumber,
        message,
        image_url: imageUrl,
        message_type: Number(message_type) || 5,
        pharmacy_id: pharmacyId,
        original_id,
        confidence:1.0,
        log,
      },
    });

    // Check if message_type is 11 (Order Request)
    if (Number(message_type) === 11) {
      const contact = await prismaClient.contacts.findFirst({
        where: { contact_mobile: fromNumber },
        select: { contact_name: true, contact_mobile: true }
      });

      logAndNotify({
        userId: 0, // System or associated user
        pharmacyId: pharmacyId,
        action: "ORDER_REQUEST",
        metadata: {
          from: fromNumber,
          message,
          contact_name: contact?.contact_name || fromNumber,
          contact_number: contact?.contact_mobile || fromNumber
        }
      }).catch(e => console.error("Error in logAndNotify for ORDER_REQUEST:", e));
    }

    return newMessage;
  } catch (error: any) {
    console.error("Error creating message:", error);
    logAndNotify({
        userId: 0,
        pharmacyId: pharmacyId,
        action: "APP_ERROR",
        metadata: { error_title: "Error creating message", error: error.message, stack: error.stack, context: "createMessageService" }
    }).catch(e => console.error(e));
    throw error;
  }
};

export const updateMessageService = async (
  id: bigint,
  updateData: Partial<{
    message: string | null;
    image_url: string | null;
  }>,
) => {
  try {
    const updatedMessage = await prismaClient.messages.update({
      where: { id },
      data: updateData,
    });
        return updatedMessage;
  } catch (error: any) {
    console.error("Error updating message:", error);
    logAndNotify({
        userId: 0,
        pharmacyId: null,
        action: "APP_ERROR",
        metadata: { error_title: "Error updating message", error: error.message, stack: error.stack, context: "updateMessageService" }
    }).catch(e => console.error(e));
    throw error;
  }
};

export const deleteMessageService = async (id: bigint) => {
  try {
        return prismaClient.messages.delete({ where: { id } });
  } catch (error: any) {
    console.error("Error deleting message:", error);
    logAndNotify({
        userId: 0,
        pharmacyId: null,
        action: "APP_ERROR",
        metadata: { error_title: "Error deleting message", error: error.message, stack: error.stack, context: "deleteMessageService" }
    }).catch(e => console.error(e));
    throw error;
  }
};

export const checkOrderMessageService = async ({
  pharmacyId,
  fromNumber,
  message,
}: {
  pharmacyId: number;
  fromNumber: string;
  message?: string;
}) => {
  try {
    await logAndNotify({
      userId: 0,
      pharmacyId: pharmacyId,
      action: "ORDER_REQUEST",
      metadata: { from: fromNumber, message: message || "New Order Request" },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error in checkOrderMessageService:", error);
    throw error;
  }
};

export const processWebhookMessageService = async (record: any) => {
  try {
    const { pharmacy_id, message, id, to_number, message_type } = record;
console.log("processWebhookMessageService fired with record:", record);
    // Check if the message is an order request (message_type == 11)
    // Even if we process all messages, maybe we only want to notify for order request?
    // Based on the prompt: "process FCM notifications for order messages based on the attached files."
    // Let's assume order messages have message_type = 11, or maybe we just process any message from webhook?
    // Wait, let's see. The prompt says "notifications for order messages", but then "Title: 'رسالة أوردر جديدة'". Let's just follow the steps exactly.
    // The instructions say: "Find the target user by matching to_number against users.mobile"
    // So the incoming message is TO a number. Wait, if it's an incoming message, it should be FROM someone TO the system/pharmacy.
    // The prompt explicitly states: "Find the target user by matching to_number against users.mobile"

    const targetUser = await prismaClient.users.findUnique({
      where: { mobile: to_number },
    });

    if (targetUser && targetUser.is_active && targetUser.fcm_token && targetUser.fcm_token.length > 0 && message_type === 11) {
      const fcmTokens = Array.isArray(targetUser.fcm_token) ? targetUser.fcm_token : [];

      if (fcmTokens.length > 0) {
        // Create an internal notification record in the database
        await prismaClient.notification.create({
          data: {
            user_id: targetUser.id,
            pharmacy_id: pharmacy_id ,
            type: NotificationType.ORDER_REQUEST,
            target_role: TargetRole.USER,
            title: "رسالة جديدة",
            body: message || "",
          }
        });

        const fcmMessage = {
          notification: {
            title: "رسالة أوردر جديدة",
            body: message || "",
          },
          tokens: fcmTokens.map(token => String(token)),
        };

        try {
          const response = await messaging.sendEachForMulticast(fcmMessage);
          console.log(`Webhook Notification sent: ${response.successCount} successes, ${response.failureCount} failures`);
        } catch (fcmError) {
          console.error("Error sending FCM in processWebhookMessageService:", fcmError);
        }
      }
    }
  } catch (error: any) {
    console.error("Error in processWebhookMessageService:", error);
    throw error;
  }
};