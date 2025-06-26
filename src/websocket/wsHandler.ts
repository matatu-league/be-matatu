// WebSocketHandler
import { WebSocketMessageType } from '../types/messageTypes';
import { handleGameRequest } from './handlers/handleGameRequest';
import { handleGameRequestAccepted } from './handlers/handleGameRequestAccepted';
import { handleGameRequestDeclined } from './handlers/handleGameRequestDeclined';
import { handleGameStart } from './handlers/handleGameStart';
import { handleIdentify } from './handlers/handleIdentify';
import { handleMove } from './handlers/handleMove';
import { handleOnlineUsersRequest } from './handlers/handleOnlineUsersRequest';
import { handlePlayerReady } from './handlers/handlePlayerReady';
import { handleUpdateStake } from './handlers/handleUpdateStake';
import { handleDisconnect } from './wsUtil';
import { WebSocket } from 'ws';

export const handleWebSocketConnection = (ws: WebSocket) => {
  console.log('New client connected');
  ws.on('message', async (message: string) => {
    try {
      const payload = JSON.parse(message);
      const data = payload.data;

      switch (payload.type) {
        case WebSocketMessageType.IDENTIFY:
          await handleIdentify({ ws, data });
          break;
        case WebSocketMessageType.UPDATE_STAKE:
          await handleUpdateStake({ ws, data });
          break;
        case WebSocketMessageType.START:
          await handleGameStart({ ws, data });
          break;
        case WebSocketMessageType.MOVE:
          await handleMove({ ws, data });
          break;
        case WebSocketMessageType.PING:
          ws.send(JSON.stringify({ type: 'PONG' }));
          break;
        case WebSocketMessageType.GAME_REQUEST:
          await handleGameRequest({ ws, data });
          // await handleNearbyPlayers(ws, data);
          break;
        case WebSocketMessageType.PLAYER_READY:
          await handlePlayerReady({ ws, data });
          break;
        case WebSocketMessageType.GAME_REQUEST_ACCEPTED:
          await handleGameRequestAccepted({ ws, data });
          break;
        case WebSocketMessageType.GAME_REQUEST_DECLINED:
          await handleGameRequestDeclined({ ws, data });
          break;
        case WebSocketMessageType.ONLINE_USERS:
          await handleOnlineUsersRequest(ws);
          break;
        default:
          console.warn(`Unknown message type: ${data.type}`);
          ws.send(
            JSON.stringify({ type: 'ERROR', message: 'Unknown message type' }),
          );
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({ type: 'ERROR', message: error.message }));
    }
  });
  ws.on('close', () => {
    handleDisconnect(ws);
  });
};
