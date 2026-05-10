import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

admin.initializeApp();

export const sendPushOnNotification = onDocumentCreated(
  { document: 'notifications/{notificationId}', region: 'us-central1' },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const { toUserId, message, groupName } = data as {
      toUserId: string;
      message: string;
      groupName: string;
    };

    const userSnap = await admin.firestore().doc(`users/${toUserId}`).get();
    const fcmTokens: string[] = userSnap.data()?.fcmTokens ?? [];
    if (!fcmTokens.length) return;

    await Promise.all(
      fcmTokens.map((token) =>
        admin.messaging().send({
          token,
          data: { title: 'BetABeer', body: message, groupName },
          webpush: { headers: { Urgency: 'high' } },
        }).catch((err) => console.error(`Failed to send to token ${token}:`, err))
      )
    );
  }
);
