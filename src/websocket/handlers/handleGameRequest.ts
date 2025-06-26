import BattleSession from '../../models/BattleSession';
import { WebSocketMessageType } from '../../types/messageTypes';
import { sendPushNotification } from '../../utils/pushNotifications';
import { clients, pendingRequests, playerGameMap } from '../state';
import { WsRequestProps } from '../types';
import { generateId } from '../wsUtil';

export const handleGameRequest = async ({ ws, data }: WsRequestProps) => {
  const { user, opponent, stake, isBattle } = data;
  // Check if either player is already in a game
  if (playerGameMap.has(user.uid) || playerGameMap.has(opponent.uid)) {
    ws.send(
      JSON.stringify({
        type: 'ERROR',
        message: 'One or both players are already in a game',
      }),
    );
    return;
  }

  const toPlayer = clients.get(opponent.uid);
  const requestId = generateId();

  if (!isBattle) {
    const expiryTimeout = setTimeout(() => {
      pendingRequests.delete(requestId);
    }, 10000);
    pendingRequests.set(requestId, {
      user,
      opponent,
      stake,
      isBattle,
      timestamp: Date.now(),
      timeout: expiryTimeout,
    });
  } else {
    pendingRequests.set(requestId, {
      user,
      opponent,
      stake,
      isBattle,
      timestamp: Date.now(),
    });
    BattleSession.create({
      requestId,
      players: [user.uid, opponent.uid],
      stake,
      wins: { [user.uid]: 0, [opponent.uid]: 0 },
    });
  }

  if (toPlayer) {
    toPlayer.ws.send(
      JSON.stringify({
        type: WebSocketMessageType.GAME_REQUEST,
        data: {
          requestId,
          user,
          opponent,
          stake,
          expiresAt: Date.now() + 10000,
        },
      }),
    );
  }

  console.log('opponent.uid=========', opponent.uid);

  await sendPushNotification(
    opponent.uid,
    isBattle ? '⚔️ Battle Challenge!' : '🎮 Game Request!',
    `${user.username} has challenged you to a ${
      isBattle ? 'battle' : 'game'
    }! Tap to join.`,
    {
      requestId,
      type: isBattle ? 'BATTLE_REQUEST' : 'GAME_REQUEST',
      stake: JSON.stringify(stake),
    },
  );
  console.log(`Game request sent (ID: ${requestId})`);
};
