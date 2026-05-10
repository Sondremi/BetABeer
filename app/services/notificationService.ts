import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  getDocs,
  doc,
} from 'firebase/firestore';
import { firestore } from './firebase/FirebaseConfig';

export type NotificationType = 'betFinished' | 'drinksReceived' | 'newBet';

export type AppNotification = {
  id: string;
  toUserId: string;
  type: NotificationType;
  groupId: string;
  groupName: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
};

type NewNotificationData = Omit<AppNotification, 'id' | 'createdAt' | 'read'>;

const NOTIFICATIONS_COLLECTION = 'notifications';

export const writeNotification = async (data: NewNotificationData): Promise<void> => {
  await addDoc(collection(firestore, NOTIFICATIONS_COLLECTION), {
    ...data,
    read: false,
    createdAt: serverTimestamp(),
  });
};

export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: AppNotification[]) => void
): (() => void) => {
  const q = query(
    collection(firestore, NOTIFICATIONS_COLLECTION),
    where('toUserId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as AppNotification[];
      callback(notifications);
    },
    (error) => console.error('subscribeToNotifications error:', error)
  );
};

export const markAsRead = async (notificationId: string): Promise<void> => {
  await updateDoc(doc(firestore, NOTIFICATIONS_COLLECTION, notificationId), { read: true });
};

export const markAllAsRead = async (userId: string): Promise<void> => {
  const q = query(
    collection(firestore, NOTIFICATIONS_COLLECTION),
    where('toUserId', '==', userId),
    where('read', '==', false)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  const batch = writeBatch(firestore);
  snapshot.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, { read: true });
  });
  await batch.commit();
};
