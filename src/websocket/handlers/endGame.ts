import { log } from 'node:console';
import User from '../../models/User';
import { WebSocketMessageType } from '../../types/messageTypes';
import { clients, gameStates, playerGameMap } from '../state';
import { handleNearbyPlayers } from './handleNearbyPlayers';
import { validateNewStake } from '../wsUtil';

interface EndGameProps {
  gameId: string;
  winner: string;
  loser?: string;
  reason: string;
  additionalData?: Record<string, any>;
}

// Implementation
export const endGame = async ({
  gameId,
  winner,
  loser,
  reason,
  additionalData = {},
}: EndGameProps): Promise<void> => {
  const gameState = gameStates.get(gameId);
  console.log('GAME_OVER 0000');
  if (!gameState) return;

  playerGameMap.delete(winner);
  playerGameMap.delete(loser!);

  // Clear timeout if exists
  if (gameState.moveTimeout) {
    clearTimeout(gameState.moveTimeout);
    gameState.moveTimeout = null;
  }

  // Clear timeout if exists
  if (gameState.waitTimeout) {
    clearTimeout(gameState.waitTimeout);
    gameState.waitTimeout = null;
  }

  const { charge = 0, amount = 0, points = 0 } = gameState.stake || {};
  handleNearbyPlayers(winner);
  handleNearbyPlayers(loser!);

  let loserStake = null;

  // Update balances
  try {
    const [winnerUser, loserUser] = await Promise.all([
      User.findOne({ uid: winner }),
      User.findOne({ uid: loser }),
    ]);

    if (winnerUser) {
      winnerUser.balance += amount - charge;
      winnerUser.points += points;
      winnerUser.gamesPlayed += 1;
      winnerUser.gamesWon += 1;
      winnerUser.winRate = Math.round(
        (winnerUser.gamesWon / winnerUser.gamesPlayed) * 100,
      );
      winnerUser.lastPlayed = new Date();
      await winnerUser.save();
    }

    if (loserUser) {
      loserUser.balance -= amount + charge;
      loserUser.points += points;
      loserUser.gamesPlayed += 1;
      loserUser.winRate = Math.round(
        (loserUser.gamesWon / loserUser.gamesPlayed) * 100,
      );
      loserStake = await validateNewStake(loserUser.balance);
      loserUser.lastPlayed = new Date();
      await loserUser.save();
    }
  } catch (err) {
    console.error('Failed to update balances:', err);
  }

  // Notify players
  const gameOverData = {
    winner,
    loser,
    reason,
    stake: gameState.stake,
    loserStake,
    ...additionalData,
  };

  const allPlayers = Object.keys(gameState.players);
  allPlayers.forEach((playerId) => {
    let client = clients.get(playerId);

    if (client) {
      // client.balance = user.balance;
      client.stake = gameState.stake;

      // console.log('client=====',gameState.stake, client)

      client.ws.send(
        JSON.stringify({
          type: WebSocketMessageType.GAME_OVER,
          data: gameOverData,
        }),
      );
    }
  });

  // await broadcastOnlineUsers();

  // Clean up game state
  setTimeout(() => {
    gameStates.delete(gameId);
  }, 5000);
};
