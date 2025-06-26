import User from '../models/User';

export const updateBonusCoins = async (user) => {
  const now = Date.now();
  let lastBonus = user.lastBonusTime ? user.lastBonusTime.getTime() : 0;
  let bonusCoins = user.bonusCoins || 0;

  // 1 coin per minute, max 4
  const BONUS_INTERVAL = 1 * 60 * 1000; // 1 minute in ms
  const MAX_BONUS = 4;

  // Add coins if enough time has passed
  while (now - lastBonus >= BONUS_INTERVAL && bonusCoins < MAX_BONUS) {
    bonusCoins += 1;
    lastBonus += BONUS_INTERVAL;
  }

  if (bonusCoins !== user.bonusCoins) {
    user.bonusCoins = bonusCoins;
    user.lastBonusTime = new Date(lastBonus);
    await user.save();
  }

  const nextBonusIn =
    bonusCoins >= MAX_BONUS
      ? null
      : Math.max(0, BONUS_INTERVAL - (now - lastBonus)); // in ms

  return {
    bonusCoins: user.bonusCoins,
    nextBonusIn: nextBonusIn ? Math.ceil(nextBonusIn / 1000) : null, // in seconds
  };
};

export const getBonusStatus = async (req, res) => {
  try {
    const bonusData = await updateBonusCoins(req.user);
    return res.status(200).send({ data: bonusData });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const claimBonus = async (req, res) => {
  const { user } = req;
  try {
    if (user.bonusCoins > 0) {
      user.balance += 25;
      user.bonusCoins = 0;
      user.lastBonusTime = new Date();
      await user.save();
      return res.status(200).send({ balance: user.balance });
    } else {
      return res.status(400).json({ error: 'No bonus coins to claim.' });
    }
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};
