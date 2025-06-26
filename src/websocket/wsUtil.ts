import { WebSocket } from 'ws';
import { broadcastOnlineUsers } from './handlers/broadcastOnlineUsers';
import { clients, gameStates, PLAY_TIMEOUT_DURATION } from './state';
import {
  ClientsMap,
  PlayerData,
  PlayerInfo,
  UpdateStakePayload,
} from './types';
import { endGame } from './handlers/endGame';
import User from '../models/User';
import Prize from '../models/Prize';

interface GameRequest {
  from: string;
  to: string;
  stake: number;
  timestamp: number;
  timeout: NodeJS.Timeout;
}

interface GameState {
  players: Record<string, any[]>;
  deck?: any[];
  currentTurn?: string;
  status?: string;
  turnExpiresAt?: number;
  gameOver?: boolean;
  winner?: string;
  ready?: Set<string>;
  waitTimeout?: NodeJS.Timeout;
  moveTimeout?: NodeJS.Timeout;
}

type PendingRequestsMap = Map<string, GameRequest>;
type GameStatesMap = Map<string, GameState>;

// Utility Functions
interface NotifyExpiryProps {
  requestId: string;
  pendingRequests: PendingRequestsMap;
  clients: ClientsMap;
}

export const notifyExpiry = ({
  requestId,
  pendingRequests,
  clients,
}: NotifyExpiryProps): void => {
  const request = pendingRequests.get(requestId);
  if (!request) return;

  const sender = clients.get(request.from);
  if (sender) {
    sender.ws.send(
      JSON.stringify({
        type: 'GAME_REQUEST_EXPIRED',
        requestId,
      }),
    );
  }
};

export const generateId = (): string => {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
};

interface BroadcastToGameProps {
  gameId: string;
  message: any;
}

export const broadcastToGame = ({
  gameId,
  message,
}: BroadcastToGameProps): void => {
  const gameState = gameStates.get(gameId);
  if (!gameState) return;

  for (const uid of Object.keys(gameState.players)) {
    const client = clients.get(uid);
    if (client) {
      client.ws.send(JSON.stringify(message));
    }
  }
};

export const registerClient = (playerData: PlayerData): void => {
  clients.set(playerData.ws.uid, playerData);
  playerData.ws.uid = playerData.ws.uid;
};

interface SendToClientProps {
  ws: WebSocket;
  message: any;
}

export const sendToClient = ({ ws, message }: SendToClientProps): void => {
  ws.send(JSON.stringify(message));
};

interface HandleDisconnectProps {
  ws: WebSocket & { uid?: string };
  clients: ClientsMap;
}

export const handleDisconnect = async ({
  ws,
}: HandleDisconnectProps): Promise<void> => {
  if (ws?.uid) {
    clients.delete(ws.uid);
    console.log(`Player ${ws.uid} disconnected`);
    await broadcastOnlineUsers();
  }
};

export const startTimeout = (gameId: string) => {
  const gameState = gameStates.get(gameId);
  if (!gameState) return;

  // Always clear existing move timeout
  if (gameState.moveTimeout) {
    clearTimeout(gameState.moveTimeout);
  }

  gameState.moveTimeout = setTimeout(() => {
    const inactivePlayer = gameState.currentTurn;
    const opponent = Object.keys(gameState.players).find(
      (playerId) => playerId !== inactivePlayer,
    );

    console.log(`Player ${inactivePlayer} timed out`);
    endGame({
      gameId,
      winner: opponent!,
      loser: inactivePlayer,
      reason: 'TIMEOUT',
    });
  }, PLAY_TIMEOUT_DURATION);

  // Also clear waitTimeout if it exists (you might want to extract this separately)
  if (gameState.waitTimeout) {
    clearTimeout(gameState.waitTimeout);
    gameState.waitTimeout = null;
  }

  gameStates.set(gameId, gameState); // Update state
};

export const validateNewStake = async (balance: number) => {
  const prizeConfig = await Prize.findOne(); // adjust query if needed
  if (!prizeConfig) return null;

  const levels = prizeConfig.levels;
  // Sort from highest to lowest stake level
  const sortedLevels = [...levels].sort(
    (a, b) => b.amount + b.charge - (a.amount + a.charge),
  );

  return (
    sortedLevels.find((level) => balance >= level.amount + level.charge) || null
  );
};
