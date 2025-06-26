import { WebSocket } from 'ws';
import { WebSocketMessageType } from '../../types/messageTypes';
import { gameStates, PLAY_TIMEOUT_DURATION } from '../state';
import { endGame } from './endGame';
import { GameStatesMap, WsProps } from '../types';
import { broadcastToGame } from '../wsUtil';

// Type Definitions
interface PlayerReadyData {
  gameId: string;
  uid: string;
}

// Implementation
export const handlePlayerReady = async ({
  ws,
  data,
}: WsProps): Promise<void> => {
  const { gameId, uid } = data;
  const turnExpiresAt = Date.now() + PLAY_TIMEOUT_DURATION;

  const gameState = gameStates.get(gameId);

  if (!gameState || !gameState.players[uid]) {
    ws.send(
      JSON.stringify({ type: 'ERROR', message: 'Invalid game or player' }),
    );
    return;
  }

  // Mark this player as ready
  gameState.ready.add(uid);

  const allReady = gameState.ready.size === 2;

  // If both players are ready and game hasn't started
  if (allReady && gameState.status !== 'STARTED') {
    gameState.status = 'STARTED';
    gameState.turnExpiresAt = turnExpiresAt;

    // Clear waiting timeout
    if (gameState.waitTimeout) {
      clearTimeout(gameState.waitTimeout);
      gameState.waitTimeout = null;
    }

    // Set move timeout (for player not making a move)
    if (!gameState.moveTimeout) {
      gameState.moveTimeout = setTimeout(() => {
        const currentTurnPlayer = gameState.currentTurn;
        const otherPlayer = Object.keys(gameState.players).find(
          (id) => id !== currentTurnPlayer,
        )!;

        console.log(`Player ${currentTurnPlayer} timed out`);
        endGame({
          gameId,
          winner: otherPlayer,
          loser: currentTurnPlayer,
          reason: 'TIMEOUT',
        });
      }, PLAY_TIMEOUT_DURATION);
    }
    const { moveTimeout, waitTimeout, ...newGameState } = gameState;
    // Notify both players the game is starting
    broadcastToGame({
      gameId,
      message: {
        type: WebSocketMessageType.START,
        data: {
          gameId,
          currentTurn: gameState.currentTurn,
          turnExpiresAt,
          gameState: newGameState,
        },
      },
    });

    return;
  }

  // If only one player is ready, set a wait timeout (only once)
  if (gameState.ready.size === 1 && !gameState.waitTimeout) {
    gameState.waitTimeout = setTimeout(() => {
      console.log(`Second player did not join in time for game ${gameId}`);
      endGame({ gameId, winner: uid, reason: 'OPPONENT_NO_SHOW' });
    }, PLAY_TIMEOUT_DURATION);
  }
};
