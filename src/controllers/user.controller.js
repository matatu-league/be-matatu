import User from '../models/User';
import AccountCounter from '../models/AccountCounter';

const handleNearbyPlayers = async (uid) => {
  // Fetch top players sorted by points
  const user = await User.findOne({ uid });

  const users = await User.find()
    .sort({ points: -1 })
    .select('id uid username points') // Add `uid` for update
    .exec();

  const currentIndex = users.findIndex(
    (u) => u.id.toString() === user.id.toString(),
  );

  if (currentIndex === -1) {
    return { type: 'ERROR', message: 'User not found in leaderboard' };
  }

  const position = currentIndex + 1;

  // Create nearby list (max 3 entries: one before, self, one after)
  const nearby = [];

  if (currentIndex > 0) {
    const prev = users[currentIndex - 1];
    nearby.push({
      userId: prev.id,
      username: prev.username,
      points: prev.points,
      position: currentIndex,
    });
  }

  nearby.push({
    userId: user.id,
    username: user.username,
    points: user.points,
    position: position,
  });

  if (currentIndex < users.length - 1) {
    const next = users[currentIndex + 1];
    nearby.push({
      userId: next.id,
      username: next.username,
      points: next.points,
      position: currentIndex + 2,
    });
  }

  // Update the current user's rank and position
  const updated = await User.findOneAndUpdate(
    { uid: user.uid },
    {
      $set: {
        rank: nearby,
        position,
      },
    },
    { new: true }, // Return updated document
  ).select('-password'); // Optional: exclude sensitive fields

  return updated;
};

export const createUser = async (req, res) => {
  const { uid, username, email, photoURL } = req.body;
  try {
    const existing = await User.findOne({ uid });
    if (existing) return res.status(200).json(existing);

    let counter = await AccountCounter.findOne();
    if (!counter) {
      counter = await AccountCounter.create({ lastAccountId: 2000 });
    }

    const accountId = counter.lastAccountId + 1;
    counter.lastAccountId = accountId;
    await counter.save();

    const newUser = await User.create({
      uid,
      accountId,
      username,
      email,
      photoURL,
    });

    res.status(201).json(newUser);
  } catch (err) {
    return res
      .status(500)
      .json({ message: 'Error creating user', error: err.message });
  }
};

export const getUser = async (req, res) => {
  const { uid } = req.params;

  try {
    const user = await handleNearbyPlayers(uid);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Error fetching user', error: err.message });
  }
};

export const updateUser = async (req, res) => {
  const { uid } = req.params;
  const updateData = req.body;

  try {
    const user = await User.findOneAndUpdate({ uid }, updateData, {
      new: true,
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ success: true, user });
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Error updating user', error: err.message });
  }
};
