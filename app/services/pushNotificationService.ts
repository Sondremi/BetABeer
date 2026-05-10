import { Platform } from 'react-native';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { firestore } from './firebase/FirebaseConfig';

const VAPID_KEY = process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY;

export const requestPermissionAndSaveToken = async (userId: string): Promise<void> => {
  if (Platform.OS !== 'web') return;
  if (typeof Notification === 'undefined') return;
  if (!VAPID_KEY) return;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const { getMessaging, getToken } = await import('firebase/messaging');
    const { app } = await import('./firebase/FirebaseConfig');

    const messaging = getMessaging(app);
    const swReg = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: swReg });

    if (!token) return;

    await updateDoc(doc(firestore, 'users', userId), {
      fcmTokens: arrayUnion(token),
    });
  } catch (error) {
    console.error('Push permission/token error:', error);
  }
};
