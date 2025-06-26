import { updateBattleStatusByRequestId } from '../../controllers/battle.controller';
import { WebSocketMessageType } from '../../types/messageTypes';
import { initializeDeck } from '../../utils/cardUtils';
import { clients, gameStates, pendingRequests, playerGameMap } from '../state';
import {
  ClientsMap,
  GameState,
  GameStatesMap,
  PendingRequestsMap,
  PlayerGameMap,
} from '../types';
import { generateId } from '../wsUtil';

interface HandleGameRequestAcceptedProps {
  ws: WebSocket;
  data: {
    requestId: string;
  };
}

// Implementation
export const handleGameRequestAccepted = async ({
  ws,
  data,
}: HandleGameRequestAcceptedProps): Promise<void> => {
  const { requestId } = data;
  const request = pendingRequests.get(requestId);

  if (!request) {
    ws.send(
      JSON.stringify({
        type: 'ERROR',
        message: 'Request expired or invalid',
      }),
    );
    return;
  }

  if (request.timeout) {
    clearTimeout(request.timeout);
  }

  pendingRequests.delete(requestId);

  const { user, opponent, isBattle } = request;

  // Double check players aren't in other games (race condition)
  if (playerGameMap.has(user.uid) || playerGameMap.has(opponent.uid)) {
    ws.send(
      JSON.stringify({
        type: 'ERROR',
        message: 'One or both players are already in a game',
      }),
    );
    return;
  }

  if (!isBattle) {
    if (opponent.balance < opponent.stake.amount + opponent.stake.charge) {
      ws.send(
        JSON.stringify({
          type: 'ERROR',
          message: 'opponent low balance',
        }),
      );
      return;
    }
  }
  //
  // else {
  //   if (opponent.balance < opponent.stake.amount + opponent.stake.charge) {
  //     ws.send(
  //       JSON.stringify({
  //         type: 'ERROR',
  //         message: 'opponent low balance',
  //       }),
  //     );
  //     return;
  //   }
  // }

  const fromPlayer = clients.get(user.uid);
  const toPlayer = clients.get(opponent.uid);

  if (!fromPlayer || !toPlayer) {
    ws.send(
      JSON.stringify({
        type: 'ERROR',
        message: 'One or both players disconnected',
      }),
    );
    return;
  }

  const { deck, playerHands, cuttingCard } = initializeDeck([
    user.uid,
    opponent.uid,
  ]);

  const gameId = generateId();
  const gameState: GameState = {
    gameId,
    players: playerHands,
    status: 'ACTIVE',
    userId: user.uid,
    currentTurn: user.uid,
    cuttingCard,
    deck,
    ready: new Set(),
    playedCards: [],
    currentCard: null,
    chosenSuit: null,
    createdAt: new Date(),
    stake: opponent.stake,
    isBattle,
    meta: {
      [user.uid]: {
        username: user.username,
        avatar: user.avatar,
        balance: user.balance,
      },
      [opponent.uid]: {
        username: opponent.username,
        avatar: opponent.avatar,
        balance: opponent.balance,
      },
    },
  };

  console.log(JSON.stringify(gameState));

  // Update player-game mappings
  playerGameMap.set(user.uid, gameId);
  playerGameMap.set(opponent.uid, gameId);
  gameStates.set(gameId, gameState);

  const response = {
    type: WebSocketMessageType.GAME_REQUEST_ACCEPTED,
    data: {
      gameState,
    },
  };

  fromPlayer.ws.send(JSON.stringify(response));
  toPlayer.ws.send(JSON.stringify(response));

  await updateBattleStatusByRequestId(requestId, 'ONGOING');
};
