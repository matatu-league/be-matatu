import { WebSocketMessageType } from "../types/messageTypes";

export const handleWebSocketConnection = (ws) => {
  console.log('New client connected');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);

      switch (data.type) {
        case WebSocketMessageType.IDENTIFY:
          await handleIdentify(ws, data);
          break;
        case WebSocketMessageType.START:
          await handleGameStart(ws, data);
          break;
        case WebSocketMessageType.MOVE:
          await handleMove(ws, data);
          break;
        case WebSocketMessageType.DRAW:
          await handleDraw(ws, data);
          break;
        case WebSocketMessageType.WIN:
          await handleWin(ws, data);
          break;
        case WebSocketMessageType.PING:
          ws.send(JSON.stringify({ type: 'PONG' }));
          break;
        case WebSocketMessageType.GAME_REQUEST:
          await handleGameRequest(ws, data);
          break;
        case WebSocketMessageType.GAME_REQUEST_ACCEPTED:
          await handleGameRequestAccepted(ws, data);
          break;
        case WebSocketMessageType.GAME_REQUEST_DECLINED:
          await handleGameRequestDeclined(ws, data);
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