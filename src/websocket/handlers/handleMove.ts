import { WebSocket } from 'ws';
import { WebSocketMessageType } from '../../types/messageTypes';
import { CardType, GameState, WsProps } from '../types';
import { endGame } from './endGame';
import { clients, gameStates, PLAY_TIMEOUT_DURATION } from '../state';
import { startTimeout } from '../wsUtil';
import { reshufflePlayedCards } from '../../utils/cardUtils';

const PENALTY_CARDS = [2, 3, 50];

// Helper function to validate drawn cards against deck
const validateDrawnCards = (
  deck: CardType[],
  drawnCards: CardType[],
): boolean => {
  if (drawnCards.length > deck.length) {
    return false;
  }

  // Get the last N cards from deck (top of stack) where N is the number of drawn cards
  const topCards = deck.slice(-drawnCards.length);

  // Check if each drawn card matches the corresponding card from the top of deck
  return drawnCards.every((drawnCard, index) => {
    const deckCard = topCards[index];
    return deckCard && deckCard.v === drawnCard.v && deckCard.s === drawnCard.s;
  });
};

// Helper function to handle deck reshuffling
const handleDeckReshuffle = (
  gameState: GameState,
  gameId: string,
  from,
): { reshuffled: boolean; count: number } => {
  const minimumDeckSize = 5;

  if (
    gameState.deck.length <= minimumDeckSize &&
    gameState.playedCards.length > 1 // Need at least 2 cards to keep top card and reshuffle others
  ) {
    // Keep the top card (last played card) in played cards
    const topCard = gameState.playedCards[gameState.playedCards.length - 1];

    // Get all played cards except the top one for reshuffling
    const cardsToReshuffle = gameState.playedCards.slice(0, -1);

    // Store the current deck cards (will go on top)
    const remainingDeckCards = [...gameState.deck];

    // Reshuffle the played cards (excluding top card)
    const reshuffleResult = reshufflePlayedCards(
      [], // Start with empty deck
      cardsToReshuffle,
    );

    const reshuffledCount = cardsToReshuffle.length;

    // Build new deck: reshuffled cards at bottom, remaining deck cards on top
    gameState.deck = [...reshuffleResult.newDeck, ...remainingDeckCards];

    // Keep only the top card in played cards
    gameState.playedCards = [topCard];

    

    // Notify all players about the reshuffle

    // const { moveTimeout, waitTimeout, ...newGameState } = gameState;

    // console.log(
    //   JSON.stringify(newGameState),
    //   `Reshuffled ${reshuffledCount} played cards back into deck (kept top card). New deck size: ${gameState.deck.length}`,
    // );

    // const player = clients.get(from);
    // player?.ws.send(
    //   JSON.stringify({
    //     type: WebSocketMessageType.RESHUFFLE,
    //     data: {
    //       gameId,
    //       gameState: newGameState,
    //       reshuffledCardsCount: reshuffledCount,
    //     },
    //   }),
    // );

    return { reshuffled: true, count: reshuffledCount };
  }
  return { reshuffled: false, count: 0 };
};

// Helper function to process draw actions
const processDrawAction = (
  gameState: GameState,
  from: string,
  drawnCards: CardType[],
  ws: WebSocket,
): {
  success: boolean;
  reshuffled: boolean;
} => {
  // Handle potential reshuffle before validation
  const reshuffleResult = handleDeckReshuffle(
    gameState,
    gameState.gameId || '',
    from,
  );

  // Validate that the drawn cards match the top cards of the deck
  // if (!validateDrawnCards(gameState.deck, drawnCards)) {
  //   ws.send(
  //     JSON.stringify({
  //       type: 'ERROR',
  //       message: 'Network issue: drawn cards do not match deck state',
  //     }),
  //   );
  //   return {
  //     success: false,
  //     reshuffleInfo: { occurred: reshuffleResult.reshuffled },
  //   };
  // }
  // Remove the drawn cards from the deck (from the end/top)
  gameState.deck.splice(-drawnCards.length);

  // Add the drawn cards to the player's hand
  gameState.players[from].push(...drawnCards);

  console.log(
    `Player ${from} drew ${drawnCards.length} cards. Deck size now: ${gameState.deck.length}`,
  );

  return {
    success: true,
    reshuffled: reshuffleResult.reshuffled,
  };
};

// Helper function to process penalty cards
const processPenaltyCard = (gameState: GameState, action: CardType): void => {
  const isPenaltyCard = (value: number | undefined) =>
    value !== undefined && PENALTY_CARDS.includes(value);

  const getPenaltyValue = (value: number) => (value === 50 ? 5 : value);

  const currentValue = gameState.currentCard?.v;
  const previousPenaltyCard = isPenaltyCard(currentValue)
    ? gameState.currentCard
    : null;

  if (isPenaltyCard(action.v)) {
    const newPenaltyValue = getPenaltyValue(action.v!);

    if (previousPenaltyCard) {
      const previousValue = getPenaltyValue(previousPenaltyCard.v);

      if (previousValue === newPenaltyValue) {
        gameState.activePenaltyCount = newPenaltyValue;
        console.log('======0');
      } else if (previousValue > newPenaltyValue) {
        console.log('=======1');
        gameState.activePenaltyCount = 0;
      } else {
        console.log('=======2');
        gameState.activePenaltyCount = newPenaltyValue;
      }
    } else {
      console.log('=======3');
      gameState.activePenaltyCount = newPenaltyValue;
    }
  }
};

// Helper function to process play actions
const processPlayAction = (
  gameState: GameState,
  from: string,
  action: CardType,
  newSuit?: string,
): { isCuttingCard: boolean; remainingCards: number } => {
  // Clear chosen suit if it exists
  if (gameState.chosenSuit) {
    gameState.chosenSuit = null;
  }

  // Process penalty cards
  processPenaltyCard(gameState, action);

  // Determine if this is a cutting card
  const isCuttingCard = action.v === 7 && action.s === gameState.cuttingCard.s;

  // Set new suit if provided (e.g. after a joker)
  if (newSuit) {
    gameState.chosenSuit = newSuit;
  }

  // Remove the played card from the player's hand
  gameState.players[from] = gameState.players[from].filter(
    (c) => !(c.v === action.v && c.s === action.s),
  );

  // Add the played card to playedCards and update currentCard
  gameState.playedCards.push(action);
  gameState.currentCard = action;

  // Return result including remaining cards count
  return {
    isCuttingCard,
    remainingCards: gameState.players[from].length,
  };
};

// Main implementation
export const handleMove = async ({ ws, data }: WsProps): Promise<void> => {
  const { gameId, from, to, cards, newSuit } = data;
  const gameState = gameStates.get(gameId);

  console.log('=========cards', cards);

  // Basic game state validations
  if (!gameState) {
    ws.send(JSON.stringify({ type: 'ERROR', message: 'Game not found' }));
    return;
  }
  if (!gameState.players[from]) {
    ws.send(
      JSON.stringify({ type: 'ERROR', message: 'Player not found in game' }),
    );
    return;
  }

  gameState.waitTimeout = null;

  let cuttingCardPlayed = false;
  let reshuffleOccurred = false;
  // Separate draw and play actions
  const drawActions = cards.filter((card) => card.type === 'DRAW');
  const playActions = cards.filter((card) => card.type === 'PLAY');

  // Process draw actions first
  if (drawActions.length > 0) {
    // Extract the actual drawn cards from the draw actions
    const drawnCards = drawActions.map((action) => ({
      v: action.v,
      s: action.s,
    })) as CardType[];

    const drawResult = processDrawAction(gameState, from, drawnCards, ws);

    if (!drawResult.success) {
      return; // Error already sent in processDrawAction
    }

    reshuffleOccurred = drawResult.reshuffled;
  }

  // Process play actions
  for (const action of playActions) {
    const actionCard: CardType = { v: action.v, s: action.s };
    const result = processPlayAction(gameState, from, actionCard, newSuit);

    if (result.isCuttingCard) {
      cuttingCardPlayed = true;
    }

    // End game immediately if player has no more cards
    if (result.remainingCards === 1) {
      const opponent = Object.keys(gameState.players).find((id) => id !== from);
      endGame({
        gameId,
        winner: from,
        loser: opponent,
        reason: 'NO_CARDS',
        additionalData: { from, to, cards, newSuit },
      });
      return;
    }
  }

  // Game over conditions
  // if (gameState.players[from].length === 0) {
  //   const opponent = Object.keys(gameState.players).find((id) => id !== from);
  //   endGame({
  //     gameId,
  //     winner: from,
  //     loser: opponent,
  //     reason: 'NO_CARDS',
  //     additionalData: { from, to, cards, newSuit },
  //   });
  //   return;
  // }

  if (cuttingCardPlayed) {
    const allPlayers = Object.keys(gameState.players);
    const playerCardSums = allPlayers.map((id) => ({
      id,
      totalValue: gameState.players[id].reduce(
        (sum, card) => sum + Number(card.v),
        0,
      ),
    }));
    playerCardSums.sort((a, b) => a.totalValue - b.totalValue);
    endGame({
      gameId,
      winner: playerCardSums[0].id,
      loser: playerCardSums[1].id,
      reason: 'CUTTING_CARD',
      additionalData: { from, to, cards, newSuit },
    });
    return;
  }

  // Continue game
  gameState.currentTurn = to;

  startTimeout(gameId);

  const turnExpiresAt = Date.now() + PLAY_TIMEOUT_DURATION;
  gameState.turnExpiresAt = turnExpiresAt;
  gameStates.set(gameId, gameState);

  // Notify all players about the move
  Object.keys(gameState.players).forEach((playerId) => {
    const player = clients.get(playerId);

    const moveDataCards = cards.map((card) => {
      if (card.type === 'DRAW') {
        return {
          type: 'DRAW',
          s: card.s,
          v: card.v,
        };
      }
      gameState.currentCard = card as CardType;

      if (newSuit) {
        gameState.chosenSuit = newSuit;
      } else {
        gameState.chosenSuit = null;
      }

      return {
        type: 'PLAY',
        s: card.s,
        v: card.v,
      };
    });

    const { waitTimeout, moveTimeout, ...newGameState } = gameState;

    const moveData = {
      from,
      to,
      cards: moveDataCards,
      newSuit,
      gameState: newGameState,
      reshuffled: reshuffleOccurred
    };

    player?.ws.send(
      JSON.stringify({
        type: WebSocketMessageType.MOVE,
        data: moveData,
      }),
    );
  });

  if (gameState.activePenaltyCount) {
    gameState.activePenaltyCount = 0;
    return;
  }
  // Reset penalty count after notifying all players
};
