import { DateTime } from 'luxon';
import { Document } from 'mongoose';
import User from '../../models/User';
import WeeklyRanking from '../../models/WeeklyRanking';

// Type Definitions
interface RankingEntry {
  userId: string;
  username: string;
  points: number;
  position: number;
}

interface WeeklyRankingDocument extends Document {
  weekStart: Date;
  userId: string;
  username: string;
  points: number;
  position: number;
  history: Array<{
    weekStart: Date;
    points: number;
    position: number;
  }>;
}

// Helper function to get the start of the current week
export const getWeekStart = (
  date: Date | string | DateTime = DateTime.now().setZone('Africa/Nairobi'),
): Date => {
  let dt: DateTime;

  if (date instanceof Date) {
    dt = DateTime.fromJSDate(date).setZone('Africa/Nairobi');
  } else if (typeof date === 'string') {
    dt = DateTime.fromISO(date).setZone('Africa/Nairobi');
  } else {
    dt = date as DateTime;
  }

  const startOfWeek = dt.startOf('week'); // Sunday 00:00
  const sundayNight = startOfWeek.set({
    hour: 23,
    minute: 59,
    second: 59,
    millisecond: 999,
  });
  return sundayNight.toJSDate(); // Convert to JavaScript Date before returning
};

// Helper function to update rankings
export const updateRankings = async (): Promise<RankingEntry[]> => {
  const weekStart = getWeekStart();

  // Get all users sorted by points
  const users = await User.find().sort({ points: -1 }).exec();

  // Bulk update weekly rankings
  const bulkOps = users.map((user, index) => ({
    updateOne: {
      filter: { weekStart, userId: user._id },
      update: {
        $set: {
          weekStart,
          userId: user._id,
          username: user.username,
          position: index + 1,
        },
      },
      upsert: true,
    },
  }));

  if (bulkOps.length > 0) {
    await WeeklyRanking.bulkWrite(bulkOps);
  }

  // Return rankings for potential broadcast
  return users.map((user, index) => ({
    userId: user._id.toString(),
    username: user.username,
    points: user.points,
    position: index + 1,
  }));
};

// Helper function to reset weekly rankings
export const resetWeeklyRankings = async (): Promise<void> => {
  const weekStart = getWeekStart();
  const previousWeekStart = new Date(
    weekStart.getTime() - 7 * 24 * 60 * 60 * 1000,
  );

  // Archive current rankings
  const rankings = await WeeklyRanking.find({
    weekStart: previousWeekStart,
  }).exec();

  await Promise.all(
    rankings.map(async (ranking) => {
      ranking.history.push({
        weekStart: previousWeekStart,
        points: ranking.points,
        position: ranking.position,
      });
      ranking.points = 0;
      ranking.position = 0;
      await ranking.save();
    }),
  );

  // Reset rankings for all active users
  const users = await User.find().exec();
  await Promise.all(
    users.map((user) =>
      WeeklyRanking.findOneAndUpdate(
        { weekStart, userId: user._id },
        {
          weekStart,
          userId: user._id,
          username: user.username,
          points: 0,
          position: 0,
        },
        { upsert: true },
      ),
    ),
  );

  await updateRankings();
};
