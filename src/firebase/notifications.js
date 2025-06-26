const admin = require('firebase-admin');

const sendPushNotification = async (token, payload) => {
  if (!token) throw new Error('No FCM token provided');

  const message = {
    token,
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: payload.data || {},
    android: {
      priority: 'high',
    },
    apns: {
      payload: {
        aps: {
          contentAvailable: true,
        },
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Push notification sent:', response);
    return response;
  } catch (error) {
    console.error('❌ Failed to send push notification:', error);
    throw error;
  }
};

// 1. Game Request
const sendGameRequestNotification = ({
  token,
  fromuid,
  fromPlayerName,
  stake,
}) =>
  sendPushNotification(token, {
    title: 'Matatu Challenge!',
    body: `${fromPlayerName} wants to verse you for ${stake} points.`,
    data: {
      type: 'GAME_REQUEST',
      stake: String(stake),
      fromuid,
      fromPlayerName,
    },
  });

// 2. Account Balance Update
const sendBalanceUpdateNotification = ({ token, newBalance }) =>
  sendPushNotification(token, {
    title: 'Account Update',
    body: `Your new balance is ${newBalance} points.`,
    data: {
      type: 'BALANCE_UPDATE',
      newBalance: String(newBalance),
    },
  });

// 3. Bonus Amount Update
const sendBonusNotification = ({ token, bonusAmount }) =>
  sendPushNotification(token, {
    title: 'Bonus Received!',
    body: `You just received a bonus of ${bonusAmount} points.`,
    data: {
      type: 'BONUS_UPDATE',
      bonusAmount: String(bonusAmount),
    },
  });

module.exports = {
  sendGameRequestNotification,
  sendBalanceUpdateNotification,
  sendBonusNotification,
};
