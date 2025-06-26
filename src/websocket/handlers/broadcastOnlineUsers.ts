import { WebSocketMessageType } from '../../types/messageTypes';
import { clients } from '../state';
import { PlayerData } from '../types';

export type PublicPlayerData = Omit<PlayerData, 'ws'>;

interface BroadcastMessage {
  type: keyof typeof WebSocketMessageType;
  data: PublicPlayerData[];
}

// Implementation
export const broadcastOnlineUsers = async (): Promise<void> => {
  const onlineUsers: PublicPlayerData[] = Array.from(clients.entries())
    .filter(([uid]) => uid) // Only include entries with valid UIDs
    .map(([uid, { username, avatar, balance, stake }]) => ({
      uid,
      username,
      avatar,
      balance,
      stake,
    }));

    console.log('====================================');
    console.log(onlineUsers);
    console.log('====================================');

  const message: string = JSON.stringify({
    type: WebSocketMessageType.ONLINE_USERS,
    data: onlineUsers,
  } as BroadcastMessage);

  // Send to all connected clients
  for (const [, { ws }] of clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(message);
    }
  }
};
