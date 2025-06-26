import { WebSocket } from 'ws'; // or from 'uWebSockets.js' or native, depending on your setup
import { WebSocketMessageType } from '../../types/messageTypes';
import { clients } from '../state';
import { PlayerData } from '../types';

export type PublicPlayerData = Omit<PlayerData, 'ws'>;

interface OnlineUsersMessage {
  type: keyof typeof WebSocketMessageType;
  users: PublicPlayerData[];
}

export const handleOnlineUsersRequest = async (
  ws: WebSocket,
): Promise<void> => {
  const onlineUsers: PublicPlayerData[] = Array.from(clients.entries())
    .filter(([uid]) => !!uid)
    .map(([uid, { username, balance, avatar, stake }]) => ({
      uid,
      username,
      balance,
      avatar,
      stake,
    }));

  const message: OnlineUsersMessage = {
    type: 'ONLINE_USERS',
    users: onlineUsers,
  };

  ws.send(JSON.stringify(message));
};
