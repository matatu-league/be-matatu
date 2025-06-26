import { clients } from '../state';
import { broadcastOnlineUsers } from './broadcastOnlineUsers';

export const handleUpdateStake = async ({ ws, data }) => {
  const { uid, stake } = data;

  const client = clients.get(uid);
  if (client) {
    client.stake = stake;
    console.log(`Updated stake for user ${uid} to ${stake}`);
    await broadcastOnlineUsers(); // notify all clients
  } else {
    console.warn(`User ${uid} not found when trying to update stake.`);
    ws.send(
      JSON.stringify({
        type: 'ERROR',
        message: 'User not connected',
      }),
    );
  }
};
