import { deleteBattleByRequestId } from '../../controllers/battle.controller';
import { WebSocketMessageType } from '../../types/messageTypes';
import { sendPushNotification } from '../../utils/pushNotifications';
import { clients, pendingRequests } from '../state';
import { WsRequestProps } from '../types';

export const handleGameRequestDeclined = async (payload: WsRequestProps) => {
  const { requestId } = payload.data;

  const request = pendingRequests.get(requestId);
  if (!request) return;
  if (request.timeout) {
    clearTimeout(request.timeout);
  }

  pendingRequests.delete(requestId);

  const sender = clients.get(request.user.uid);
  if (sender) {
    sender.ws.send(
      JSON.stringify({
        type: WebSocketMessageType.GAME_REQUEST_DECLINED,
        to: request.opponent.uid,
        from: request.user.uid,
      }),
    );
  }

  if (request.isBattle) {
    await sendPushNotification(
      request.user.uid, // sender of the challenge
      'Ooops Battle Declined!',
      `${request.opponent.username} has declined your battle request.`,
      {
        type: 'BATTLE_REQUEST_DECLINED',
        requestId,
        opponentId: request.opponent.uid,
      },
    );
    await deleteBattleByRequestId(requestId);
  }
};
