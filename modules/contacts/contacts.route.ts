import express from 'express';
import bodyParser from 'body-parser';
import { authenticateToken } from '../../middleware/authenticateToken';
import { updateContactController, getContactsController, getBlockedContactsController, toggleBlockContactController } from './contacts.controller';

export const CONTACTS_ROUTER = express.Router();

CONTACTS_ROUTER.use(authenticateToken);
CONTACTS_ROUTER.get('/', getContactsController);
CONTACTS_ROUTER.get('/blocked', getBlockedContactsController);
CONTACTS_ROUTER.post('/toggle-block', bodyParser.json(), toggleBlockContactController);
// CONTACTS_ROUTER.post('/new', bodyParser.urlencoded({ extended: true }), createContactController);
CONTACTS_ROUTER.patch('/update', bodyParser.json(), updateContactController);

