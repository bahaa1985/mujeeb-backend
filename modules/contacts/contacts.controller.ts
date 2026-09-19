import { updateContactService, getContactsByUserService, getBlockedContactsService, toggleBlockContactService } from './contacts.service';
import { prismaClient } from '../../utils/prisma-adapter';


const serializeContact = (contact: any) => ({
  ...contact,
  id: contact.id?.toString(),
  user_id: Number(contact.user_id?.toString()),
});

export const getContactsController = async (req: any, res: any) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const requestedUserMobile = req.query.userMobile || user.mobile;
    const requestedUser = await prismaClient.users.findFirst({
      where: { mobile: requestedUserMobile, pharmacy_id: user.pharmacy_id },
    });
    if (!requestedUser) {
      return res.status(404).json({ message: 'Pharmacy user not found' });
    }
    const contacts = await getContactsByUserService(requestedUserMobile);
    res.status(200).json(contacts.map(serializeContact));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching contacts', error });
  }
};

export const getBlockedContactsController = async (req: any, res: any) => {
  try {
    const blockedContacts = await getBlockedContactsService();
    res.status(200).json(blockedContacts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blocked contacts', error });
  }
};

export const toggleBlockContactController = async (req: any, res: any) => {
  const { phone, block } = req.body;
  if (!phone) {
    return res.status(400).json({ message: 'Phone number is required' });
  }

  try {
    const result = await toggleBlockContactService(phone, block);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error toggling block status', error });
  }
};


export const updateContactController = async (req: any, res: any) => {
  const user = req.user;
  console.log("Updating contact for user:", user);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { contact_mobile, user_mobile, contact_name } = req.body;
  if (!contact_mobile || !user_mobile || !contact_name?.trim()) {
    return res.status(400).json({
      message: 'contact_mobile, user_mobile, and contact_name are required',
    });
  }

  try {
    const requestedUser = await prismaClient.users.findFirst({
      where: { mobile: user_mobile, pharmacy_id: user.pharmacy_id },
    });
    if (!requestedUser) {
      return res.status(404).json({ message: 'Pharmacy user not found' });
    }

    const contact = await updateContactService(
      contact_mobile,
      user_mobile,
      contact_name.trim(),
    );
    res.status(201).json(serializeContact(contact));
  } catch (error) {
    if (error instanceof Error && error.message === 'Contact not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error updating contact', error });
  }
};
