import { prismaClient } from "../../utils/prisma-adapter";
import {sendTextMessage} from "./evolutionSendTextMessage"
import { logAndNotify } from "../logs/log.service";

export const getMessagesByPharmacyIdService = async (
  pharmacyId: number,
) => {
  try {
    const messages = await prismaClient.messages.findMany({
      where: { pharmacy_id: Number(pharmacyId) },
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
  pharmacyId: number,
  contactNumber: string,
  cursorId?: string,
  limit: number = 20,
) => {
  try {
    const take = limit + 1;
    const messages = await prismaClient.messages.findMany({
      where: {
        pharmacy_id: pharmacyId,
        OR: [
          { from_number: contactNumber.trim() },
          { to_number: contactNumber.trim() },
        ],
      },
      ...(cursorId ? { cursor: { id: BigInt(cursorId) }, skip: 1 } : {}),
      take,
      orderBy: { created_at: 'desc' },
    });

    const hasMore = messages.length > limit;
    const data = hasMore ? messages.slice(0, limit) : messages;
    return {
      data,
      nextCursor: hasMore && data.length > 0 ? data[data.length - 1].id.toString() : null,
    };
  } catch (error: any) {
    console.error("Error fetching messages by user number:", error);
    logAndNotify({
        userId: 0,
        pharmacyId,
        action: "APP_ERROR",
        metadata: { error_title: "Error fetching user messages", error: error.message, stack: error.stack, context: "getMessagesByUserNumberService" }
    }).catch(e => console.error(e));
    throw error;
  }
};

export const getOrderMessageCountByUserMobileService = async (mobile: string, pharmacyId?: number) => {
  try {
    return await prismaClient.messages.count({
      where: {
        message_type: 11,
        to_number: mobile.trim(),
        ...(pharmacyId ? { pharmacy_id: pharmacyId } : {}),
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

export const getUserMessagesCount = async (userNumber: string, pharmacyId?: number) => {
  try {
    const count = await prismaClient.messages.count({
      where: {
        from_number: userNumber.trim(),
        ...(pharmacyId ? { pharmacy_id: pharmacyId } : {}),
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
    // if (Number(message_type) === 11) {
    //   const contact = await prismaClient.contacts.findFirst({
    //     where: {
    //       contact_mobile: fromNumber,
    //       users: { is: { pharmacy_id: pharmacyId } },
    //     },
    //     select: { contact_name: true, contact_mobile: true }
    //   });

    //   logAndNotify({
    //     userId: 0, // System or associated user
    //     pharmacyId: pharmacyId,
    //     action: "ORDER_REQUEST",
    //     metadata: {
    //       contactNumber: fromNumber,
    //       message,
    //       contactName: contact?.contact_name || fromNumber,
    //       contactNumber: contact?.contact_mobile || fromNumber
    //     }
    //   }).catch(e => console.error("Error in logAndNotify for ORDER_REQUEST:", e));
    // }

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
  pharmacyId: number | undefined,
  updateData: Partial<{
    message: string | null;
    image_url: string | null;
  }>,
) => {
  try {
    const updatedMessage = await prismaClient.messages.update({
      where: { id, ...(pharmacyId ? { pharmacy_id: pharmacyId } : {}) },
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

export const deleteMessageService = async (id: bigint, pharmacyId: number | undefined) => {
  try {
        return prismaClient.messages.delete({ where: { id, ...(pharmacyId ? { pharmacy_id: pharmacyId } : {}) } });
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
  contactNumber,
  message,
}: {
  pharmacyId: number;
  contactNumber: string;
  message?: string;
}) => {
  const contact = await prismaClient.contacts.findFirst({
    where: {
      contact_mobile: contactNumber,
      users: { is: { pharmacy_id: pharmacyId } },
    },
    select: { contact_name: true, contact_mobile: true },
  });
  const resolvedContactNumber = contact?.contact_mobile || contactNumber;
  await logAndNotify({
    userId: 0,
    pharmacyId,
    action: "ORDER_REQUEST",
    metadata: {
      contactNumber: resolvedContactNumber,
      from_number: resolvedContactNumber,
      contactName: contact?.contact_name || resolvedContactNumber,
      message: message || "New Order Request",
    },
  });
  return { success: true };
};

export const checkAmbigiousMessageService = async ({
  pharmacyId,
  contactNumber,
  message,
}: {
  pharmacyId: number;
  contactNumber: string;
  message?: string;
}) => {
  const contact = await prismaClient.contacts.findFirst({
    where: {
      contact_mobile: contactNumber,
      users: { is: { pharmacy_id: pharmacyId } },
    },
    select: { contact_name: true, contact_mobile: true },
  });
  const resolvedContactNumber = contact?.contact_mobile || contactNumber;
  await logAndNotify({
    userId: 0,
    pharmacyId,
    action: "AMBIGIUOS_MESSAGE",
    metadata: {
      contactNumber: resolvedContactNumber,
      from_number: resolvedContactNumber,
      contactName: contact?.contact_name || resolvedContactNumber,
      message: message || "New Ambiguous Message",
    },
  });
  return { success: true };
};

export const processWebhookMessageService = async (record: any) => {
  try {
    const pharmacyId = Number(record.pharmacy_id);
    const messageType = Number(record.message_type);
    if ([1, 2, 3, 11, 13].includes(messageType) && Number.isInteger(pharmacyId) && pharmacyId > 0) {
      const subscription = await prismaClient.subscriptions.findFirst({
        where: { pharmacy_id: pharmacyId },
        orderBy: [{ subscription_start: "desc" }, { id: "desc" }],
        select: { id: true, subscription_state: true },
      });

      if (subscription?.subscription_state === "SUSPENDED") {
        await logAndNotify({
          userId: 0,
          pharmacyId,
          action: "SUBSCRIPTION_SUSPENDED",
          metadata: {
            subscription_id: subscription.id,
            message_type: messageType,
          },
        });
      }
    }
    if (messageType !== 11 && messageType !== 13) return;

    const contactNumber = String(record.from_number ?? "").trim();
    if (!Number.isInteger(pharmacyId) || pharmacyId <= 0) {
      throw new Error("A valid pharmacy_id is required to send a message notification.");
    }
    if (!contactNumber) {
      throw new Error("from_number is required to include the customer's contact number in the notification.");
    }

    const notificationParams = {
      pharmacyId,
      contactNumber,
      message: typeof record.message === "string" ? record.message : undefined,
    };
    if (messageType === 13) {
      await checkAmbigiousMessageService(notificationParams);
    } else {
      await checkOrderMessageService(notificationParams);
    }
  } catch (error: any) {
    console.error("Error in processWebhookMessageService:", error);
    throw error;
  }
};