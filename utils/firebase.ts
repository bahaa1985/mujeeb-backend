import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// تأكد من اسم الملف، لو هو .json.json فعلاً سيبه زي ما هو، ولو خطأ مطبعي خليه .json بس
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
});

export const messaging = getMessaging();