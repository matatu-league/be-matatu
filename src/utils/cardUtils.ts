import { CardType, Suit } from '../websocket/types';

export interface DeckInitializationResult {
  deck: CardType[];
  playerHands: Record<string, CardType[]>;
  cuttingCard: CardType;
}

export interface ReshuffleResult {
  newDeck: CardType[];
  shuffledPlayedCards: CardType[];
}

// Constants
const SUITS: Suit[] = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades];
const VALUES: number[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15]; // 11=J, 12=Q, 13=K, 15=A
const JOKERS: CardType[] = [
  { v: 50, s: Suit.Black },
  { v: 50, s: Suit.Red },
];

// Main Function
export function initializeDeck(players: string[]): DeckInitializationResult {
  // Create standard 52 + 2 Joker deck
  let deck: CardType[] = SUITS.flatMap((s) =>
    VALUES.map((v) => ({
      v,
      s,
    })),
  );

  // Add Jokers
  deck.push(...JOKERS);

  // Shuffle the deck
  deck = shuffleArray([...deck]);

  // Ensure no 7 is at top or bottom of deck
  deck = ensureNo7AtEnds(deck);

  // Separate special cards from the deck
  const specialCards = extractSpecialCards(deck);
  
  // Initialize player hands with empty arrays
  const playerHands: Record<string, CardType[]> = {
    [players[0]]: [],
    [players[1]]: [],
  };

  // Distribute special cards strategically (jokers, 2s, 3s, aces, jacks, and 8s)
  distributeSpecialCards(playerHands, players, specialCards, deck);

  // Get cutting card (last card in deck)
  const cuttingCard: CardType = deck.pop()!; // Non-null assertion as we know deck has cards

  return {
    deck,
    playerHands,
    cuttingCard,
  };
}

// Extract special cards (jokers, 2s, 3s, aces, jacks, and 8s) from deck
function extractSpecialCards(deck: CardType[]): {
  jokers: CardType[];
  twos: CardType[];
  threes: CardType[];
  aces: CardType[];
  jacks: CardType[];
  eights: CardType[];
  remaining: CardType[];
} {
  const jokers: CardType[] = [];
  const twos: CardType[] = [];
  const threes: CardType[] = [];
  const aces: CardType[] = [];
  const jacks: CardType[] = [];
  const eights: CardType[] = [];
  const remaining: CardType[] = [];

  for (let i = deck.length - 1; i >= 0; i--) {
    const card = deck[i];
    
    if (card.v === 50) { // Jokers
      jokers.push(card);
      deck.splice(i, 1);
    } else if (card.v === 2) { // Twos
      twos.push(card);
      deck.splice(i, 1);
    } else if (card.v === 3) { // Threes
      threes.push(card);
      deck.splice(i, 1);
    } else if (card.v === 15) { // Aces
      aces.push(card);
      deck.splice(i, 1);
    } else if (card.v === 11) { // Jacks
      jacks.push(card);
      deck.splice(i, 1);
    } else if (card.v === 8) { // Eights
      eights.push(card);
      deck.splice(i, 1);
    }
  }

  return { jokers, twos, threes, aces, jacks, eights, remaining: deck };
}

// Distribute special cards to ensure proper distribution
function distributeSpecialCards(
  playerHands: Record<string, CardType[]>,
  players: string[],
  specialCards: { 
    jokers: CardType[]; 
    twos: CardType[]; 
    threes: CardType[]; 
    aces: CardType[];
    jacks: CardType[];
    eights: CardType[];
  },
  remainingDeck: CardType[]
): void {
  const player1 = players[0];
  const player2 = players[1];
  
  // Validate we have the expected number of special cards
  if (specialCards.aces.length !== 4) {
    throw new Error(`Expected 4 aces, but found ${specialCards.aces.length}`);
  }
  if (specialCards.jacks.length !== 4) {
    throw new Error(`Expected 4 jacks, but found ${specialCards.jacks.length}`);
  }
  if (specialCards.eights.length !== 4) {
    throw new Error(`Expected 4 eights, but found ${specialCards.eights.length}`);
  }
  
  // Shuffle and distribute aces (2 to each player)
  const shuffledAces = shuffleArray(specialCards.aces);
  playerHands[player1].push(...shuffledAces.slice(0, 2));
  playerHands[player2].push(...shuffledAces.slice(2, 4));
  
  // Shuffle and distribute jacks (2 to each player)
  const shuffledJacks = shuffleArray(specialCards.jacks);
  playerHands[player1].push(...shuffledJacks.slice(0, 2));
  playerHands[player2].push(...shuffledJacks.slice(2, 4));
  
  // Shuffle and distribute eights (2 to each player)
  const shuffledEights = shuffleArray(specialCards.eights);
  playerHands[player1].push(...shuffledEights.slice(0, 2));
  playerHands[player2].push(...shuffledEights.slice(2, 4));
  
  // Randomly decide which player gets jokers (and which gets 2s/3s)
  const jokerPlayer = Math.random() < 0.5 ? player1 : player2;
  const penaltyPlayer = jokerPlayer === player1 ? player2 : player1;
  
  // Give all jokers to the joker player (2 cards)
  playerHands[jokerPlayer].push(...specialCards.jokers);
  
  // Give all 2s and 3s to the penalty player (8 cards total: 4 twos + 4 threes)
  playerHands[penaltyPlayer].push(...specialCards.twos);
  playerHands[penaltyPlayer].push(...specialCards.threes);
  
  // Calculate how many more cards each player needs to reach exactly 7
  const jokerPlayerNeed = 7 - playerHands[jokerPlayer].length;
  const penaltyPlayerNeed = 7 - playerHands[penaltyPlayer].length;
  
  // Handle joker player (has 2 aces + 2 jacks + 2 eights + 2 jokers = 8 cards, need to reduce to 7)
  if (jokerPlayerNeed < 0) {
    // Too many cards, need to put some back
    const excessCards = Math.abs(jokerPlayerNeed);
    
    // Get all non-guaranteed cards (everything except aces, jacks, eights, and jokers)
    const playerAces = playerHands[jokerPlayer].filter(card => card.v === 15);
    const playerJacks = playerHands[jokerPlayer].filter(card => card.v === 11);
    const playerEights = playerHands[jokerPlayer].filter(card => card.v === 8);
    const playerJokers = playerHands[jokerPlayer].filter(card => card.v === 50);
    const playerOtherCards = playerHands[jokerPlayer].filter(card => 
      card.v !== 15 && card.v !== 11 && card.v !== 8 && card.v !== 50
    );
    
    // If we have other cards, remove them first
    if (playerOtherCards.length >= excessCards) {
      const shuffledOthers = shuffleArray(playerOtherCards);
      const othersToKeep = shuffledOthers.slice(0, playerOtherCards.length - excessCards);
      const othersToReturn = shuffledOthers.slice(othersToKeep.length);
      
      playerHands[jokerPlayer] = [...playerAces, ...playerJacks, ...playerEights, ...playerJokers, ...othersToKeep];
      remainingDeck.push(...othersToReturn);
    } else {
      // If not enough other cards, we need to remove some guaranteed cards
      // Priority: keep 2 aces, 2 jacks, 2 eights, then jokers
      const guaranteedCards = [...playerAces, ...playerJacks, ...playerEights];
      const shuffledGuaranteed = shuffleArray(guaranteedCards);
      const guaranteedToKeep = shuffledGuaranteed.slice(0, Math.min(6, guaranteedCards.length));
      const guaranteedToReturn = shuffledGuaranteed.slice(guaranteedToKeep.length);
      
      // Try to maintain at least 2 of each type if possible
      let finalCards = [...guaranteedToKeep, ...playerJokers, ...playerOtherCards];
      if (finalCards.length > 7) {
        finalCards = finalCards.slice(0, 7);
      }
      
      playerHands[jokerPlayer] = finalCards;
      remainingDeck.push(...guaranteedToReturn);
    }
  } else if (jokerPlayerNeed > 0) {
    // Need more cards
    for (let i = 0; i < jokerPlayerNeed && remainingDeck.length > 0; i++) {
      playerHands[jokerPlayer].push(remainingDeck.shift()!);
    }
  }
  
  // Handle penalty player (has 2 aces + 2 jacks + 2 eights + 4 twos + 4 threes = 14 cards, need to reduce to 7)
  if (penaltyPlayerNeed < 0) {
    // Too many cards, need to put some back
    const excessCards = Math.abs(penaltyPlayerNeed);
    
    // Get all penalty cards (2s and 3s) from player's hand
    const playerPenaltyCards = playerHands[penaltyPlayer].filter(card => card.v === 2 || card.v === 3);
    const playerAces = playerHands[penaltyPlayer].filter(card => card.v === 15);
    const playerJacks = playerHands[penaltyPlayer].filter(card => card.v === 11);
    const playerEights = playerHands[penaltyPlayer].filter(card => card.v === 8);
    const playerOtherCards = playerHands[penaltyPlayer].filter(card => 
      card.v !== 2 && card.v !== 3 && card.v !== 15 && card.v !== 11 && card.v !== 8
    );
    
    // Shuffle penalty cards and keep only what we need after guaranteed cards
    const guaranteedCards = [...playerAces, ...playerJacks, ...playerEights]; // 6 cards
    const availableSlots = 7 - guaranteedCards.length; // 1 slot
    
    const shuffledPenaltyCards = shuffleArray(playerPenaltyCards);
    const penaltyCardsToKeep = shuffledPenaltyCards.slice(0, Math.min(availableSlots, playerPenaltyCards.length));
    const penaltyCardsToReturn = shuffledPenaltyCards.slice(penaltyCardsToKeep.length);
    
    // Rebuild player hand: keep guaranteed cards, keep some penalty cards
    playerHands[penaltyPlayer] = [...guaranteedCards, ...penaltyCardsToKeep, ...playerOtherCards.slice(0, Math.max(0, availableSlots - penaltyCardsToKeep.length))];
    
    // Put excess cards back in deck
    remainingDeck.push(...penaltyCardsToReturn, ...playerOtherCards.slice(Math.max(0, availableSlots - penaltyCardsToKeep.length)));
  } else if (penaltyPlayerNeed > 0) {
    // Need more cards
    for (let i = 0; i < penaltyPlayerNeed && remainingDeck.length > 0; i++) {
      playerHands[penaltyPlayer].push(remainingDeck.shift()!);
    }
  }
  
  // Final adjustment to ensure exactly 7 cards each
  while (playerHands[player1].length < 7 && remainingDeck.length > 0) {
    playerHands[player1].push(remainingDeck.shift()!);
  }
  
  while (playerHands[player2].length < 7 && remainingDeck.length > 0) {
    playerHands[player2].push(remainingDeck.shift()!);
  }
  
  // If either player has more than 7 cards, remove excess (but preserve guaranteed cards)
  [player1, player2].forEach(player => {
    if (playerHands[player].length > 7) {
      const aces = playerHands[player].filter(card => card.v === 15);
      const jacks = playerHands[player].filter(card => card.v === 11);
      const eights = playerHands[player].filter(card => card.v === 8);
      const otherCards = playerHands[player].filter(card => card.v !== 15 && card.v !== 11 && card.v !== 8);
      
      // Keep all aces, jacks, and eights, then fill remaining slots with other cards
      const guaranteedCards = [...aces, ...jacks, ...eights];
      const availableSlots = 7 - guaranteedCards.length;
      const shuffledOthers = shuffleArray(otherCards);
      
      playerHands[player] = [...guaranteedCards, ...shuffledOthers.slice(0, availableSlots)];
      
      // Put excess cards back in deck
      const excessCards = shuffledOthers.slice(availableSlots);
      remainingDeck.push(...excessCards);
    }
  });
  
  // Shuffle each player's hand to randomize card order
  playerHands[player1] = shuffleArray(playerHands[player1]);
  playerHands[player2] = shuffleArray(playerHands[player2]);
  
  // Verify distribution
  const player1Aces = playerHands[player1].filter(card => card.v === 15).length;
  const player2Aces = playerHands[player2].filter(card => card.v === 15).length;
  const player1Jacks = playerHands[player1].filter(card => card.v === 11).length;
  const player2Jacks = playerHands[player2].filter(card => card.v === 11).length;
  const player1Eights = playerHands[player1].filter(card => card.v === 8).length;
  const player2Eights = playerHands[player2].filter(card => card.v === 8).length;
  
  if (player1Aces !== 2 || player2Aces !== 2) {
    throw new Error(`Ace distribution failed: ${player1} has ${player1Aces} aces, ${player2} has ${player2Aces} aces`);
  }
  
  if (player1Jacks < 2 || player2Jacks < 2) {
    console.warn(`Jack distribution warning: ${player1} has ${player1Jacks} jacks, ${player2} has ${player2Jacks} jacks`);
  }
  
  if (player1Eights < 2 || player2Eights < 2) {
    console.warn(`Eight distribution warning: ${player1} has ${player1Eights} eights, ${player2} has ${player2Eights} eights`);
  }
  
  console.log(`${jokerPlayer} received all jokers (${specialCards.jokers.length} jokers)`);
  console.log(`${penaltyPlayer} received penalty cards (${playerHands[penaltyPlayer].filter(c => c.v === 2 || c.v === 3).length} penalty cards)`);
  console.log(`Card distribution: ${player1} - Aces: ${player1Aces}, Jacks: ${player1Jacks}, Eights: ${player1Eights}`);
  console.log(`Card distribution: ${player2} - Aces: ${player2Aces}, Jacks: ${player2Jacks}, Eights: ${player2Eights}`);
  console.log(`Final hand sizes: ${player1}=${playerHands[player1].length}, ${player2}=${playerHands[player2].length}`);
}

// New Function: Reshuffle played cards and add to bottom of deck
export function reshufflePlayedCards(
  currentDeck: CardType[],
  playedCards: CardType[],
): ReshuffleResult {
  // Don't reshuffle if there are no played cards
  if (playedCards.length === 0) {
    return {
      newDeck: [...currentDeck],
      shuffledPlayedCards: [],
    };
  }

  // Shuffle the played cards (no special restrictions needed)
  const shuffledPlayedCards = shuffleArray([...playedCards]);

  // Add shuffled played cards to the bottom of the current deck
  const newDeck = [...currentDeck, ...shuffledPlayedCards];

  return {
    newDeck,
    shuffledPlayedCards,
  };
}

// Alternative function if you want to reshuffle when deck is running low
export function reshuffleWhenLow(
  currentDeck: CardType[],
  playedCards: CardType[],
  minimumCards: number = 5,
): ReshuffleResult {
  // Only reshuffle if current deck is running low
  if (currentDeck.length >= minimumCards) {
    return {
      newDeck: [...currentDeck],
      shuffledPlayedCards: [],
    };
  }

  return reshufflePlayedCards(currentDeck, playedCards);
}

// Utility Functions
function shuffleArray(array: CardType[]): CardType[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function ensureNo7AtEnds(deck: CardType[]): CardType[] {
  const deckCopy = [...deck];
  const lastIndex = deckCopy.length - 1;

  // Handle edge cases
  if (deckCopy.length <= 2) {
    return deckCopy;
  }

  // Find all non-7 cards in the middle positions (not first or last)
  const middleNon7Indices: number[] = [];
  for (let i = 1; i < lastIndex; i++) {
    if (deckCopy[i].v !== 7) {
      middleNon7Indices.push(i);
    }
  }

  // If we don't have enough non-7 cards in the middle, something is very wrong
  if (middleNon7Indices.length < 2) {
    console.warn(
      'Warning: Not enough non-7 cards to ensure 7s are not at ends',
    );
    return deckCopy;
  }

  let swapIndex = 0; // Track which middle non-7 card to use next

  // Check if first card is a 7
  if (deckCopy[0].v === 7 && swapIndex < middleNon7Indices.length) {
    const swapPosition = middleNon7Indices[swapIndex];
    [deckCopy[0], deckCopy[swapPosition]] = [
      deckCopy[swapPosition],
      deckCopy[0],
    ];
    swapIndex++;
  }

  // Check if last card is a 7
  if (deckCopy[lastIndex].v === 7 && swapIndex < middleNon7Indices.length) {
    const swapPosition = middleNon7Indices[swapIndex];
    [deckCopy[lastIndex], deckCopy[swapPosition]] = [
      deckCopy[swapPosition],
      deckCopy[lastIndex],
    ];
    swapIndex++;
  }

  return deckCopy;
}