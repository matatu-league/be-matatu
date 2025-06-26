import admin from '../firebase/config';
import User from '../models/User';

export async function sendPushNotification(userId, title, body, data = {}) {
  try {
    // 1. Find user by custom `uid` field (not _id)
    const user = await User.findOne({ uid: userId });

    console.log('user', data);

    if (!user || !user.fcmToken) {
      throw new Error('User not found or FCM token missing');
    }
    // 2. Construct the FCM message
    const message = {
      notification: {
        title,
        body,
      },
      data,
      token: user.fcmToken,
    };

    // 3. Send the message
    const response = await admin.messaging().send(message);
    return { success: true, response };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
}
