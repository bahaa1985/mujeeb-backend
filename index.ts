import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import ngrok from '@ngrok/ngrok';
import './utils/firebase';
import { authenticateToken } from './middleware/authenticateToken';
import { USER_ROUTER } from './modules/user/user.route';
import { AUTH_LOGIN_ROUTER } from './modules/auth/login.route'
import { AUTH_LOGGED_ROUTER } from './modules/auth/logged.route';
import { AUTH_LOGOUT_ROUTER } from './modules/auth/logout.route';
import { PHARMACY_ROUTER } from './modules/pharmacy/pharmacy.route';
import { MESSAGES_ROUTER } from './modules/messages/messages.route';
import { CONTACTS_ROUTER } from './modules/contacts/contacts.route';
import { INVENTORY_ROUTER } from './modules/inventory/inventory.route';
import { EVOLUTION_INSTANCE_ROUTER } from './modules/evolution_instance/instance.route';
import { SUBSCRIPTION_ROUTER } from './modules/subscriptions/subscriptions.route';
import { LOGS_ROUTER } from './modules/logs/log.route';
import { NOTIFICATION_ROUTER } from './modules/notifications/notification.route';

const app = express();


const FRONTEND_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175'
];
// app.use(cors())
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || FRONTEND_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
// Allow larger JSON payloads for bulk inventory uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(require('cookie-parser')())
//ngrok public url
async function forwardToApp() {
	const forwarder = await ngrok.forward({
		addr: "localhost:3000",
		authtoken_from_env: true,
		domain: "cotton-guidance-uncouple.ngrok-free.dev",
	});
	console.log(`Available at: ${forwarder.url()}`);
}
forwardToApp();
// Cleanup function to disconnect ngrok on exit
const cleanup = async () => {
  try {
    await ngrok.disconnect();
    await ngrok.kill();
  } catch (err) {
    // ignore
  }
  process.exit(0);
};

// الاستماع لإشارات إغلاق التطبيق
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// home route:
app.get('/',authenticateToken, (req: any, res: any) => {
  if(!req.user){
    res.redirect('/login')
  }
  // console.log("hello ",req.user.username);
  const username = req.user?.username
  res.send('Hello '+username+ ' !')
});

// routes
app.use('/users', USER_ROUTER)
app.use('/login', AUTH_LOGIN_ROUTER)
app.use('/logout', AUTH_LOGOUT_ROUTER)
app.use('/me',AUTH_LOGGED_ROUTER)
app.use('/pharmacy', PHARMACY_ROUTER)
app.use('/messages', MESSAGES_ROUTER)
app.use('/contacts', CONTACTS_ROUTER)
app.use('/inventory', INVENTORY_ROUTER)
app.use('/evolution', EVOLUTION_INSTANCE_ROUTER)
app.use('/subscriptions', SUBSCRIPTION_ROUTER)
app.use('/logs',LOGS_ROUTER)
app.use('/notifications', NOTIFICATION_ROUTER)

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});