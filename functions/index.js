const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.sendChatPushNotification = functions.firestore
  .document("chatRooms/{roomId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const roomId = context.params.roomId;

    const roomRef = admin.firestore().collection("chatRooms").doc(roomId);
    const roomSnap = await roomRef.get();
    if (!roomSnap.exists) return null;
    const roomData = roomSnap.data();

    const senderRef = admin.firestore().collection("users").doc(message.senderId);
    const senderSnap = await senderRef.get();
    const senderName = senderSnap.exists ? senderSnap.data().name : "Unknown";

    const members = roomData.members || [];
    const tokens = [];

    for (const memberId of members) {
      if (memberId === message.senderId) continue;
      const userSnap = await admin.firestore().collection("users").doc(memberId).get();
      if (userSnap.exists) {
        const userData = userSnap.data();
        if (userData.fcmTokens && userData.fcmTokens.length > 0) {
          if (userData.notifications && userData.notifications.chatPopupEnabled === false) continue;
          tokens.push(...userData.fcmTokens);
        }
      }
    }

    if (tokens.length === 0) return null;

    const messagePayload = {
      notification: {
        title: roomData.type === 'group' ? `${roomData.name} (${senderName})` : senderName,
        body: message.text || "新しいメッセージが届きました",
      },
      data: {
        type: "chat",
        roomId: roomId
      },
      tokens: tokens,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(messagePayload);
      console.log("Successfully sent message:", response);
      return response;
    } catch (error) {
      console.error("Error sending push notification:", error);
      return null;
    }
  });

// Optionally add a similar function for schedules
exports.sendSchedulePushNotification = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const userId = context.params.userId;

    // Check if schedules changed (basic check)
    const beforeSchedules = JSON.stringify(beforeData.schedules || {});
    const afterSchedules = JSON.stringify(afterData.schedules || {});
    
    if (beforeSchedules === afterSchedules) return null;

    // Only notify others, not the user themselves if they updated their own schedule
    // Actually, schedules are usually viewed by others. For this basic app, if a user updates their schedule,
    // notify everyone in their directory except themselves.
    
    // Check if the user has notification setting disabled
    if (afterData.notifications && afterData.notifications.schedulePopupEnabled === false) return null;

    const userName = afterData.name || "Unknown";
    
    // Get all users
    const usersSnap = await admin.firestore().collection("users").get();
    const tokens = [];

    usersSnap.forEach(doc => {
      if (doc.id === userId) return; // Don't notify the person who updated
      const uData = doc.data();
      if (uData.fcmTokens && uData.fcmTokens.length > 0) {
        if (uData.notifications && uData.notifications.schedulePopupEnabled === false) return;
        tokens.push(...uData.fcmTokens);
      }
    });

    if (tokens.length === 0) return null;

    const messagePayload = {
      notification: {
        title: "スケジュール更新",
        body: `${userName}さんのスケジュールが更新されました`,
      },
      data: {
        type: "schedule",
        userId: userId
      },
      tokens: tokens,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(messagePayload);
      console.log("Successfully sent schedule message:", response);
      return response;
    } catch (error) {
      console.error("Error sending schedule push notification:", error);
      return null;
    }
  });
