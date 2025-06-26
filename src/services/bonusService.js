// services/bonusService.js
import User from '../models/User';
import { sendPushNotification } from '../utils/pushNotifications';

const BONUS_INTERVAL_MS = 60 * 1000; // ✅ 1 minute
const MAX_BONUS_COINS = 4;

export const processBonusUpdates = async (req) => {
  const now = Date.now();
  const thresholdTime = new Date(now - BONUS_INTERVAL_MS);

  // Find users who are eligible for bonus coins
  const users = await User.find({
    bonusCoins: { $lt: MAX_BONUS_COINS },
    lastBonusTime: { $lte: thresholdTime },
    fcmToken: { $exists: true, $ne: null },
  });

  console.log('Eligible users:', users.map(u => u.uid));

  for (const user of users) {
    let lastBonus = user.lastBonusTime ? user.lastBonusTime.getTime() : 0;
    let bonusCoins = user.bonusCoins || 0;
    let coinsAdded = 0;

    while (
      now - lastBonus >= BONUS_INTERVAL_MS &&
      bonusCoins < MAX_BONUS_COINS
    ) {
      bonusCoins += 1;
      coinsAdded += 1;
      lastBonus += BONUS_INTERVAL_MS;
    }

    if (coinsAdded > 0) {
      user.bonusCoins = bonusCoins;
      user.lastBonusTime = new Date(lastBonus);
      await user.save();

      // Optional: Notify via socket if online
      if (req && typeof req.sendToUser === 'function') {
        req.sendToUser(user.uid, {
          type: 'BONUS_UPDATE',
          data: {
            bonusCoins: user.bonusCoins,
            lastBonusTime: user.lastBonusTime,
          },
        });
      }

      // Optional: Push notification
      await sendPushNotification(
        user.uid,
        `✨ You've Got Bonus Life!`,
        `You've earned 1 bonus life! Don't let it go to waste!`,
        { type: 'BONUS_AVAILABLE' },
      );
    }
  }
};
           