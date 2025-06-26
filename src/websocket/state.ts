import {
  ClientsMap,
  GameStatesMap,
  PlayerGameMap,
  PendingRequestsMap,
} from './types';

// Initialize typed maps
export const clients: ClientsMap = new Map(); // uid -> PlayerData
export const pendingRequests: PendingRequestsMap = new Map(); // requestId -> GameRequest
export const gameStates: GameStatesMap = new Map(); // gameId -> GameState
export const playerGameMap: PlayerGameMap = new Map(); // uid -> gameId

export const bestOf: number = 11;

export const PLAY_TIMEOUT_DURATION = 30000; // 30 seconds
export const REQUEST_TIMEOUT_DURATION = 10000; // 10 seconds
