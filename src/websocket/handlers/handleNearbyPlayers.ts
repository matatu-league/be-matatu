import User from '../../models/User';

// Type Definitions
interface NearbyPlayer {
  userId: string;
  username: string;
  points: number;
  position: number;
}

interface ErrorResponse {
  type: 'ERROR';
  message: string;
}

type NearbyPlayersResponse = NearbyPlayer[] | ErrorResponse;

// Implementation
export const handleNearbyPlayers = async (uid: string): Promise<NearbyPlayersResponse> => {
  const user = await User.findOne({ uid }).exec();
  if (!user) {
    return { type: 'ERROR', message: 'User not found' };
  }

  // Get top players sorted by points
  const users = await User.find()
    .sort({ points: -1 })
    .select('id username points') // Only fetch required fields
    .lean()
    .exec();

  const currentIndex = users.findIndex(
    (u) => u._id.toString() === user._id.toString(),
  );

  if (currentIndex === -1) {
    return { type: 'ERROR', message: 'User not found in leaderboard' };
  }

  const rank = {
    position: currentIndex + 1,
  };

  // Build nearby list
  const nearby: NearbyPlayer[] = [];

  if (currentIndex > 0) {
    nearby.push({
      userId: users[currentIndex - 1]._id.toString(),
      username: users[currentIndex - 1].username,
      points: users[currentIndex - 1].points,
      position: currentIndex, // 1-based index
    });
  }

  nearby.push({
    userId: user._id.toString(),
    username: user.username,
    points: user.points,
    position: currentIndex + 1,
  });

  if (currentIndex < users.length - 1) {
    nearby.push({
      userId: users[currentIndex + 1]._id.toString(),
      username: users[currentIndex + 1].username,
      points: users[currentIndex + 1].points,
      position: currentIndex + 2,
    });
  }

  await User.updateOne(
    { uid },
    {
      $set: {
        rank: nearby,
        position: rank.position,
      },
    }
  ).exec();

  return nearby;
};