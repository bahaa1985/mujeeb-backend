import {
    createMessageService,
  deleteMessageService,
  getMessagesByPharmacyIdService,
  getMessagesByUserNumberService,
  getUserMessagesCount,
  getPharmacyMessagesCount,
  getOrderMessageCountByUserMobileService,
  getOrderMessageCountByPharmacyService,
  updateMessageService,
  checkOrderMessageService,
  processWebhookMessageService,
} from "./messages.service";
import { prismaClient } from "../../utils/prisma-adapter";


const serializeMessage = (message: any) => {
  return {
    ...message,
    id: message.id?.toString(),
    pharmacy_id: Number(message.pharmacy_id?.toString()),
    message_type: message.message_type?.toString(),
    created_at: message.created_at?.toISOString?.() || message.created_at,
  };
};

export const getMessagesByPharmacyIdController = async (req: any, res: any) => {
  const pharmacyId = Number(req.user?.role_id) === 1
    ? Number(req.params.pharmacyId || req.user?.pharmacy_id)
    : Number(req.user?.pharmacy_id);
  // const contactPhone = req.query.contactPhone as string | undefined;
  // const pharmacyPhone = req.query.pharmacyPhone as string | undefined;
  // if (pharmacyPhone) {
  //   const pharmacyUser = await prismaClient.users.findFirst({
  //     where: { mobile: pharmacyPhone, pharmacy_id: Number(pharmacyId) },
  //   });
  //   if (!pharmacyUser) {
  //     return res.status(404).json({ message: "Pharmacy user not found" });
  //   }
  // }
  try {
    const messages = await getMessagesByPharmacyIdService(
      pharmacyId,
      // contactPhone,
      // pharmacyPhone || req.user?.mobile,
    );
    res.status(200).json(messages.map(serializeMessage));
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error });
  }
};

export const getMessagesByUserNumberController = async (req: any, res: any) => {
  const contactNumber = (req.query.contactNumber || req.query.contactPhone) as string | undefined;
  const authenticatedUser = req.user;
  const pharmacyId = Number(authenticatedUser?.role_id) === 1
    ? Number(req.query.pharmacyId)
    : Number(authenticatedUser?.pharmacy_id);
  const cursorId = req.query.cursorId as string | undefined;
  const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);

  if (!Number.isInteger(pharmacyId) || pharmacyId <= 0) {
    return res.status(400).json({ message: "Valid pharmacy ID is required" });
  }
  if (!contactNumber?.trim()) {
    return res.status(400).json({ message: "Contact number is required" });
  }
  if (!Number.isInteger(limit) || limit <= 0) {
    return res.status(400).json({ message: "Limit must be a positive integer" });
  }
  if (cursorId !== undefined && (!/^\d+$/.test(cursorId) || BigInt(cursorId) <= 0n)) {
    return res.status(400).json({ message: "Cursor ID must be a positive integer" });
  }

  try {
    const result = await getMessagesByUserNumberService(pharmacyId, contactNumber, cursorId, limit);
    res.status(200).json({
      data: result.data.map(serializeMessage),
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error });
  }
};

export const getUserMessagesCountController = async (req: any, res: any) => {
  const userNumber = req.params.userNumber?.trim();
  if (!userNumber) {
    return res.status(400).json({ message: "User number is required" });
  }

  try {
    const pharmacyId = Number(req.user?.role_id) === 1 ? undefined : Number(req.user?.pharmacy_id);
    const count = await getUserMessagesCount(userNumber, pharmacyId);
    res.status(200).json(count);
  } catch (error) {
    res.status(500).json({ message: "Error counting user messages", error });
  }
};

export const getPharmacyMessagesCountController = async (req: any, res: any) => {
  const pharmacyId = Number(req.user?.role_id) === 1
    ? Number(req.params.pharmacyId || req.user?.pharmacy_id)
    : Number(req.user?.pharmacy_id);
  if (!Number.isInteger(pharmacyId) || pharmacyId <= 0) {
    return res.status(400).json({ message: "Valid pharmacy ID is required" });
  }

  try {
    const count = await getPharmacyMessagesCount(pharmacyId);
    res.status(200).json(count);
  } catch (error) {
    res.status(500).json({ message: "Error counting pharmacy messages", error });
  }
};

export const getOrderMessageCountByUserMobileController = async (req: any, res: any) => {
  const mobile = req.params.mobile?.trim();
  if (!mobile) {
    return res.status(400).json({ message: "User mobile is required" });
  }

  try {
    const pharmacyId = Number(req.user?.role_id) === 1 ? undefined : Number(req.user?.pharmacy_id);
    const count = await getOrderMessageCountByUserMobileService(mobile, pharmacyId);
    res.status(200).json(count);
  } catch (error) {
    res.status(500).json({ message: "Error counting user order messages", error });
  }
};

export const getOrderMessageCountByPharmacyController = async (req: any, res: any) => {
  const pharmacyId = Number(req.user?.role_id) === 1
    ? Number(req.params.pharmacyId || req.user?.pharmacy_id)
    : Number(req.user?.pharmacy_id);
  if (!Number.isInteger(pharmacyId) || pharmacyId <= 0) {
    return res.status(400).json({ message: "Valid pharmacy ID is required" });
  }

  try {
    const count = await getOrderMessageCountByPharmacyService(pharmacyId);
    res.status(200).json(count);
  } catch (error) {
    res.status(500).json({ message: "Error counting pharmacy order messages", error });
  }
};

export const createMessageController = async (req: any, res: any) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

    const { to_number, message, image_url, message_type } = req.body;
  if (!to_number) {
    return res.status(400).json({ message: "Recipient number is required" });
  }

  try {
    const newMessage = await createMessageService({
      fromNumber: user.mobile,
      toNumber: to_number,
      instance_name: user.instance_name,
      message,
      imageUrl: image_url,
      message_type: message_type,
      pharmacyId: user.pharmacy_id,
      log: `Created by ${user.username}`,
    });
    res.status(201).json(serializeMessage(newMessage));
  } catch (error) {
    res.status(500).json({ message: "Error creating message", error });
  }
};

export const updateMessageController = async (req: any, res: any) => {
  const { id } = req.params;
  const { message, image_url } = req.body;
  const updateData: any = {};
  if (message !== undefined) updateData.message = message;
  if (image_url !== undefined) updateData.image_url = image_url;
  try {
    const pharmacyId = Number(req.user?.role_id) === 1 ? undefined : Number(req.user?.pharmacy_id);
    const updatedMessage = await updateMessageService(BigInt(id), pharmacyId, updateData);
    res.status(200).json(serializeMessage(updatedMessage));
  } catch (error) {
    res.status(500).json({ message: "Error updating message", error });
  }
};

export const deleteMessageController = async (req: any, res: any) => {
  const { id } = req.params;
  try {
    const pharmacyId = Number(req.user?.role_id) === 1 ? undefined : Number(req.user?.pharmacy_id);
    await deleteMessageService(BigInt(id), pharmacyId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: "Error deleting message", error });
  }
};

export const checkOrderMessageController = async (req: any, res: any) => {
  const { fromNumber, message } = req.body;
  const pharmacyId = Number(req.user?.role_id) === 1
    ? Number(req.body.pharmacyId || req.user?.pharmacy_id)
    : Number(req.user?.pharmacy_id);
  if (!pharmacyId || !fromNumber) {
    return res.status(400).json({ message: "fromNumber is required" });
  }
  try {
    const result = await checkOrderMessageService({
      pharmacyId: pharmacyId,
      fromNumber,
      message,
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error checking order message", error });
  }
};

export const handleWebhookController = async (req: any, res: any) => {
  const { type, table, record } = req.body;
  console.log("Webhook received:", { type, table, record });
  if (type === 'INSERT' && table === 'messages' && Number(record?.message_type) === 11) {
    try {
      await processWebhookMessageService(record);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error processing webhook", error });
    }
  } else {
    res.status(200).json({ message: "Ignored" });
  }
};