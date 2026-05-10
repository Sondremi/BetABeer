"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPushOnNotification = void 0;
const admin = require("firebase-admin");
const firestore_1 = require("firebase-functions/v2/firestore");
admin.initializeApp();
exports.sendPushOnNotification = (0, firestore_1.onDocumentCreated)({ document: 'notifications/{notificationId}', region: 'us-central1' }, async (event) => {
    var _a, _b, _c;
    const data = (_a = event.data) === null || _a === void 0 ? void 0 : _a.data();
    if (!data)
        return;
    const { toUserId, message, groupName } = data;
    const userSnap = await admin.firestore().doc(`users/${toUserId}`).get();
    const fcmTokens = (_c = (_b = userSnap.data()) === null || _b === void 0 ? void 0 : _b.fcmTokens) !== null && _c !== void 0 ? _c : [];
    if (!fcmTokens.length)
        return;
    await Promise.all(fcmTokens.map((token) => admin.messaging().send({
        token,
        notification: { title: 'BetABeer', body: message },
        data: { groupName },
        webpush: {
            notification: {
                icon: 'https://bet-a-beer.netlify.app/icons/icon-192.png',
            },
        },
    }).catch((err) => console.error(`Failed to send to token ${token}:`, err))));
});
//# sourceMappingURL=index.js.map