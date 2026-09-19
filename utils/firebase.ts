import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// تأكد من اسم الملف، لو هو .json.json فعلاً سيبه زي ما هو، ولو خطأ مطبعي خليه .json بس
import serviceAccount from './firebase-service-account.json';

initializeApp({
  credential: cert(serviceAccount as ServiceAccount),
});

export const messaging = getMessaging();