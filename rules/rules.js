// src/rules.js

// ============================================================================
// CONSTANTS
// ============================================================================

const SUITS = {
  HEARTS: 'H',
  DIAMONDS: 'D',
  SPADES: 'S',
  CLUBS: 'C',
  RED_JOKER: 'R',
  BLACK_JOKER: 'B',
};

const CARD_VALUES = {
  TWO: 2,
  THREE: 3,
  EIGHT: 8,
  JACK: 11,
  ACE: 15,
};

const SUIT_COLORS = {
  RED: [SUITS.HEARTS, SUITS.DIAMONDS],
  BLACK: [SUITS.SPADES, SUITS.CLUBS],
};

const SPECIAL_CARDS = {
  PENALTY_VALUES: [CARD_VALUES.TWO, CARD_VALUES.THREE, 50],
  JOKERS: [SUITS.RED_JOKER, SUITS.BLACK_JOKER],
  SKIP_VALUES: [CARD_VALUES.EIGHT, CARD_VALUES.JACK],
};

const JOKER_PENALTY_VALUE = 5; // Jokers apply 5 penalty cards when played

const MASTER_CARD = {
  value: CARD_VALUES.ACE,
  suit: SUITS.SPADES,
};

// ============================================================================
// ENUMS
// ============================================================================

const NextActionType = {
  INVALID_MOVE: 'INVALID_MOVE',
  PLAY_CARD: 'PLAY_CARD',
  CHOOSE_SUIT: 'CHOOSE_SUIT',
  APPLY_PENALTY: 'APPLY_PENALTY',
  SKIP_TURN: 'SKIP_TURN',
  END_TURN: 'END_TURN',
  REDUCE_PENALTY: 'REDUCE_PENALTY',
  TRANSFER_PENALTY: 'TRANSFER_PENALTY',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validates if a joker move is legal
 * @param {Object} card - The card being played
 * @param {Object} prevCard - The previous card
 * @param {string|null} selectedSuit - Currently selected suit
 * @returns {boolean} True if the joker move is valid
 */
function isValidJokerMove(card, prevCard, selectedSuit = null) {
  if (!isJoker(card) && !isJoker(prevCard)) return false;

  // Identify the joker card (either card or prevCard)
  const jokerCard = isJoker(card) ? card : prevCard;

  // Determine the color group based on the joker type
  const isRedJoker = jokerCard.s === SUITS.RED_JOKER;
  const isBlackJoker = jokerCard.s === SUITS.BLACK_JOKER;

  // Target suit to match — use selectedSuit if given, otherwise the *non-joker* card's suit
  const targetSuit = selectedSuit ?? (isJoker(card) ? prevCard.s : card.s);

  if (isRedJoker) return SUIT_COLORS.RED.includes(targetSuit);
  if (isBlackJoker) return SUIT_COLORS.BLACK.includes(targetSuit);

  return false;
}

// ============================================================================
// CARD TYPE CHECKERS
// ============================================================================

/**
 * Checks if a card is the master card (Ace of Spades)
 * @param {Object} card - Card to check
 * @returns {boolean} True if card is master card
 */
function isMasterCard(card) {
  return card.v === MASTER_CARD.value && card.s === MASTER_CARD.suit;
}

/**
 * Checks if a card is an Ace
 * @param {Object} card - Card to check
 * @returns {boolean} True if card is an Ace
 */
function isAce(card) {
  return card.v === CARD_VALUES.ACE;
}

/**
 * Checks if a card is a penalty card (2, 3, or jokers)
 * @param {Object} card - Card to check
 * @returns {boolean} True if card is a penalty card
 */
function isPenaltyCard(card) {
  return SPECIAL_CARDS.PENALTY_VALUES.includes(card.v) || isJoker(card);
}

/**
 * Checks if a card is a joker
 * @param {Object} card - Card to check
 * @returns {boolean} True if card is a joker
 */
function isJoker(card) {
  return SPECIAL_CARDS.JOKERS.includes(card.s);
}

/**
 * Checks basic matching rules (value, suit, or joker color match)
 * @param {Object} card - Card being played
 * @param {Object} prevCard - Previous card
 * @param {string|null} selectedSuit - Currently selected suit
 * @returns {boolean} True if cards match by basic rules
 */
function isBasicMatch(card, prevCard, selectedSuit = null) {
  // If there's a selected suit, only match against that suit
  if (selectedSuit) {
    return card.s === selectedSuit;
  }

  // Original basic matching rules (value or suit match)
  const hasValueMatch = card.v === prevCard.v;
  const hasSuitMatch = card.s === prevCard.s;

  // Check for joker color matching
  const hasJokerColorMatch = isValidJokerMove(card, prevCard, selectedSuit);

  return hasValueMatch || hasSuitMatch || hasJokerColorMatch;
}

// ============================================================================
// CARD EFFECT HANDLERS
// ============================================================================

/**
 * Determines the action to take based on the card played
 * @param {Object} card - The card that was played
 * @param {boolean} isPenaltyActive - Whether penalties are currently active
 * @returns {Object} Action object describing what should happen next
 */
function getCardEffectAction(card, isPenaltyActive) {
  // Handle jokers
  if (isJoker(card)) {
    return {
      type: NextActionType.CHOOSE_SUIT,
      allowSuitChoice: true,
      penaltyCards: JOKER_PENALTY_VALUE,
      message: 'Choose a suit for the joker',
    };
  }

  // Handle master card during penalty
  if (isMasterCard(card) && isPenaltyActive) {
    return {
      type: NextActionType.END_TURN,
      message: 'Master card cancels all penalties',
    };
  }

  // Handle regular aces
  if (isAce(card) && !isPenaltyActive) {
    return {
      type: NextActionType.CHOOSE_SUIT,
      allowSuitChoice: true,
      message: 'Choose a suit for the ace',
    };
  }

  // Handle special card effects
  switch (card.v) {
    case CARD_VALUES.TWO:
      return {
        type: NextActionType.APPLY_PENALTY,
        penaltyCards: 2,
        message: 'Next player draws 2 cards',
      };

    case CARD_VALUES.THREE:
      return {
        type: NextActionType.APPLY_PENALTY,
        penaltyCards: 3,
        message: 'Next player draws 3 cards',
      };

    case CARD_VALUES.EIGHT:
    case CARD_VALUES.JACK:
      return {
        type: NextActionType.SKIP_TURN,
        skipTurns: 1,
        message: 'Next player skips their turn',
      };

    case 50: // Joker value for penalty calculations
      return {
        type: NextActionType.APPLY_PENALTY,
        penaltyCards: JOKER_PENALTY_VALUE,
        message: 'Next player draws 5 cards',
      };

    default:
      return {
        type: NextActionType.END_TURN,
        message: 'Turn ends normally',
      };
  }
}

// ============================================================================
// PENALTY CALCULATION
// ============================================================================

/**
 * Gets the penalty value for a card (jokers have penalty value 5, others use their face value)
 * @param {Object} card - The card to get penalty value for
 * @returns {number} The penalty value of the card
 */
function getCardPenaltyValue(card) {
  if (isJoker(card)) {
    return JOKER_PENALTY_VALUE; // Jokers have penalty value 5
  }
  return card.v; // Regular penalty cards use their face value
}

/**
 * Calculates penalty actions when penalty cards are played during active penalties
 * @param {Object} playedCard - The card being played
 * @param {Object} prevCard - The previous card
 * @param {number} currentPenaltyCount - Current penalty count
 * @param {string|null} selectedSuit - Currently selected suit
 * @returns {Object} Penalty action result
 */
function calculatePenaltyAction(
  playedCard,
  prevCard,
  currentPenaltyCount,
  selectedSuit = null,
) {
  const referenceSuit = selectedSuit || prevCard.s;
  const prevPenaltyValue = getCardPenaltyValue(prevCard);
  const playedPenaltyValue = getCardPenaltyValue(playedCard);

  // Card relationship checks - now includes jokers as penalty cards
  const hasSameValue =
    isPenaltyCard(prevCard) && prevPenaltyValue === playedPenaltyValue;
  const hasSameSuit = isPenaltyCard(prevCard) && referenceSuit === playedCard.s;
  const isPrevCardStronger =
    isPenaltyCard(prevCard) && prevPenaltyValue > playedPenaltyValue;
  const isPrevCardWeaker =
    isPenaltyCard(prevCard) && prevPenaltyValue < playedPenaltyValue;
  const hasColorMatch = isValidJokerMove(playedCard, prevCard, selectedSuit);

  // Handle different penalty scenarios
  if (hasSameValue) {
    return {
      type: NextActionType.TRANSFER_PENALTY,
      nextPlayerPenaltyCount: playedPenaltyValue,
      currentPenaltyCount: 0,
      message: `Penalty transferred to next player (${playedPenaltyValue} cards)`,
    };
  }

  if (hasSameSuit && isPrevCardWeaker) {
    return {
      type: NextActionType.TRANSFER_PENALTY,
      nextPlayerPenaltyCount: playedPenaltyValue,
      currentPenaltyCount: 0,
      message: `Same suit weaker card - penalty transferred (${playedPenaltyValue} cards)`,
    };
  }

  if (hasSameSuit && isPrevCardStronger) {
    const reduction = Math.min(currentPenaltyCount, playedPenaltyValue);
    const remainingPenalty = Math.max(
      currentPenaltyCount - playedPenaltyValue,
      0,
    );

    return {
      type: NextActionType.REDUCE_PENALTY,
      nextPlayerPenaltyCount: 0,
      currentPenaltyCount: remainingPenalty,
      drawCards: remainingPenalty,
      message: `Penalty reduced by ${reduction}, remaining: ${remainingPenalty} cards`,
    };
  }

  if (hasColorMatch && isPrevCardWeaker) {
    return {
      type: NextActionType.TRANSFER_PENALTY,
      nextPlayerPenaltyCount: currentPenaltyCount + playedPenaltyValue,
      currentPenaltyCount: 0,
      message: `Color match weaker - penalty increased to ${
        currentPenaltyCount + playedPenaltyValue
      } cards`,
    };
  }

  if (hasColorMatch && isPrevCardStronger) {
    const reduction = Math.min(currentPenaltyCount, playedPenaltyValue);
    const remainingPenalty = Math.max(
      currentPenaltyCount - playedPenaltyValue,
      0,
    );

    return {
      type: NextActionType.REDUCE_PENALTY,
      nextPlayerPenaltyCount: 0,
      currentPenaltyCount: remainingPenalty,
      drawCards: remainingPenalty,
      message: `Color match stronger - penalty reduced, draw ${remainingPenalty} cards`,
    };
  }

  // Default penalty card action
  const cardEffect = getCardEffectAction(playedCard);
  return {
    ...cardEffect,
    nextPlayerPenaltyCount:
      currentPenaltyCount + (cardEffect.penaltyCards || 0),
    currentPenaltyCount: 0,
  };
}

// ============================================================================
// MOVE VALIDATION
// ============================================================================

/**
 * Validates if a move is legal and returns the appropriate action
 * @param {Object} params - Move validation parameters
 * @returns {Object} Validation result with next action
 */
function getNextAction(params) {
  const {
    prevCard,
    playedCard,
    isPenaltyActive = false,
    selectedSuit = null,
    currentPenaltyCount = 0,
    nextPlayerPenaltyCount = 0,
  } = params;

  // First move - any card is valid
  if (!prevCard) {
    const cardEffect = getCardEffectAction(playedCard, isPenaltyActive);
    return {
      valid: true,
      nextPlayerPenaltyCount: cardEffect.penaltyCards || 0,
      currentPenaltyCount: 0,
      ...cardEffect,
    };
  }

  // Check if move is fundamentally invalid
  const isValidMove =
    isBasicMatch(playedCard, prevCard, selectedSuit) ||
    isMasterCard(playedCard) ||
    (selectedSuit && playedCard.s === selectedSuit) ||
    isValidJokerMove(playedCard, prevCard, selectedSuit) ||
    isAce(playedCard);

  if (!isValidMove) {
    return {
      valid: false,
      type: NextActionType.INVALID_MOVE,
      nextPlayerPenaltyCount,
      currentPenaltyCount,
      message: `Cannot play ${playedCard.v} of ${playedCard.s}`,
    };
  }

  // Handle active penalty situations
  if (isPenaltyActive && currentPenaltyCount > 0) {
    // Master card cancels all penalties
    if (isMasterCard(playedCard)) {
      const cardEffect = getCardEffectAction(playedCard, isPenaltyActive);
      return {
        valid: true,
        nextPlayerPenaltyCount: 0,
        currentPenaltyCount: 0,
        message: 'Master card cancels all penalties',
        ...cardEffect,
      };
    }

    // Handle penalty cards during active penalties
    if (
      isPenaltyCard(playedCard) &&
      isBasicMatch(playedCard, prevCard, selectedSuit)
    ) {
      const penaltyAction = calculatePenaltyAction(
        playedCard,
        prevCard,
        currentPenaltyCount,
        selectedSuit,
      );
      return {
        valid: true,
        ...penaltyAction,
      };
    }

    // Invalid - must play penalty card or master card during active penalty
    return {
      valid: false,
      type: NextActionType.INVALID_MOVE,
      nextPlayerPenaltyCount,
      currentPenaltyCount,
      message: `Must play a penalty card (2 or 3) or master card when penalty is active (${currentPenaltyCount} cards pending)`,
    };
  }

  // Handle special cards (Aces, Master card, Jokers)
  if (isAce(playedCard) || isJoker(playedCard)) {
    const cardEffect = getCardEffectAction(playedCard, isPenaltyActive);
    return {
      valid: true,
      nextPlayerPenaltyCount: cardEffect.penaltyCards || 0,
      currentPenaltyCount: 0,
      message: isAce(playedCard)
        ? 'Ace played'
        : 'Joker played with color match',
      ...cardEffect,
    };
  }

  // Regular card play
  const cardEffect = getCardEffectAction(playedCard, isPenaltyActive);
  return {
    valid: true,
    nextPlayerPenaltyCount: cardEffect.penaltyCards || 0,
    currentPenaltyCount: 0,
    ...cardEffect,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  getNextAction,
  NextActionType,
  // Export utility functions for testing
  isMasterCard,
  isAce,
  isPenaltyCard,
  isJoker,
  isValidJokerMove,
  isBasicMatch,
  getCardPenaltyValue,
};