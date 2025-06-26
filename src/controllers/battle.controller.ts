// battleController.ts
// import { v4 as uuidv4 } from 'uuid';
import BattleSession from '../models/BattleSession';
import { WebSocketMessageType } from '../types/messageTypes';
// import { battleSessions } from '../state';
// import { clients } from '../state';
// import { WebSocketMessageType } from '../../types/messageTypes';
import { clients } from '../websocket/state';

export const recordBattleRound = async ({
  battleId,
  winner,
  gameId,
}: {
  battleId: string;
  winner: string;
  gameId: string;
}) => {
  const battle = await BattleSession.findOne({ battleId });
  if (!battle || battle.status === 'COMPLETED') return;

  battle.wins.set(winner, (battle.wins.get(winner) || 0) + 1);
  battle.currentRound += 1;
  battle.gameIds.push(gameId);

  const requiredWins = Math.ceil(battle.bestOf / 2);
  const winnerScore = battle.wins.get(winner);

  if (winnerScore >= requiredWins) {
    battle.status = 'COMPLETED';
    battle.winner = winner;
    notifyPlayers(battle.players, {
      type: WebSocketMessageType.BATTLE_COMPLETE,
      data: {
        battleId,
        winner,
        rounds: battle.bestOf,
        wins: Object.fromEntries(battle.wins),
      },
    });
    // battleSessions.delete(battleId);
  } else {
    notifyPlayers(battle.players, {
      type: WebSocketMessageType.NEXT_BATTLE_ROUND,
      data: {
        battleId,
        currentRound: battle.currentRound,
        wins: Object.fromEntries(battle.wins),
      },
    });
    // battleSessions.set(battleId, battle);
  }

  await battle.save();
};

export const deleteBattleByRequestId = async (requestId: string) => {
  try {
    const battle = await BattleSession.findOneAndDelete({ requestId });

    if (battle) {
      console.log(`🗑️ Battle with requestId ${requestId} deleted`);
    } else {
      console.log(`⚠️ No battle found with requestId ${requestId}`);
    }
  } catch (error) {
    console.error('❌ Failed to delete battle:', error.message);
    throw error;
  }
};

export const updateBattleStatusByRequestId = async (
  requestId: string,
  newStatus: 'PENDING' | 'ONGOING' | 'COMPLETED',
): Promise<boolean> => {
  try {
    const battle = await BattleSession.findOneAndUpdate(
      { requestId },
      { status: newStatus },
      { new: true },
    );

    if (!battle) {
      console.warn(`⚠️ No battle found for requestId ${requestId}`);
      return false;
    }

    // Update in-memory store if applicable
    console.log(
      `✅ Battle status updated to '${newStatus}' for requestId ${requestId}`,
    );
    return true;
  } catch (error) {
    console.error('❌ Failed to update battle status:', error.message);
    return false;
  }
};

export const resumeActiveBattles = async () => {
  const activeBattles = await BattleSession.find({ status: 'ONGOING' });
  activeBattles.forEach((battle) => {
    // battleSessions.set(battle.battleId, battle);
  });
};

function notifyPlayers(uids: string[], message: any) {
  uids.forEach((uid) => {
    const client = clients.get(uid);
    if (client?.ws) {
      client.ws.send(JSON.stringify(message));
    }
  });
}
