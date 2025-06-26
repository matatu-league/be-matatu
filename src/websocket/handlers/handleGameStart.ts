import { WebSocketMessageType } from '../../types/messageTypes';
import { gameStates } from '../state';
import { WsProps } from '../types';
import { broadcastToGame } from '../wsUtil';

export const handleGameStart = async ({
  ws,
  data,
}: WsProps): Promise<void> => {
  const { gameId } = data;
  const gameState = gameStates.get(gameId);

  if (!gameState) {
    ws.send(JSON.stringify({ type: 'ERROR', message: 'Game not found' }));
    return;
  }

  gameState.status = 'PLAYING';
  gameStates.set(gameId, gameState);

  broadcastToGame({
    gameId,
    message: {
      type: WebSocketMessageType.START,
      gameState,
    },
  });
};
