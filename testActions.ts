// src/utils/cardRules.ts
import { CardType, Gsv, Suit } from '@types';

// Constants
const RED_SUITS: Suit[] = [Suit.Hearts, Suit.Diamonds];
const BLACK_SUITS: Suit[] = [Suit.Spades, Suit.Clubs];
const ACE_VALUE = 15;
const SPADES_SUIT = 'S';
const RED_JOKER = 'R';
const BLACK_JOKER = 'B';

// Next action types
export enum NextActionType {
  INVALID_MOVE = 'INVALID_MOVE',
  PLAY_CARD = 'PLAY_CARD',
  CHOOSE_SUIT = 'CHOOSE_SUIT',
  APPLY_PENALTY = 'APPLY_PENALTY',
  SKIP_TURN = 'SKIP_TURN',
  DRAW_CARDS = 'DRAW_CARDS',
  END_TURN = 'END_TURN'
}

export interface NextAction {
  type: NextActionType;
  valid: boolean;
  message?: string;
  penaltyCards?: number;
  skipTurns?: number;
  allowSuitChoice?: boolean;
  metadata?: Record<string, any>;
}

interface IsValidMoveProps {
    gsv: Gsv;
    card: CardType;
}

/**
 * Determines if two suits have the same color (red or black)
 */
export const isSameColor = (suitA?: Suit, suitB?: Suit): boolean => {
    if (!suitA || !suitB) { return false; }

    return (
        (RED_SUITS.includes(suitA) && RED_SUITS.includes(suitB)) ||
        (BLACK_SUITS.includes(suitA) && BLACK_SUITS.includes(suitB))
    );
};

/**
 * Checks if a card can be played as a joker against the previous card
 */
const isValidJokerMove = (card: CardType, prevCard: CardType): boolean => {
    // Red joker rules
    if (card.s === RED_JOKER && RED_SUITS.includes(prevCard.s)) {
        return true;
    }

    if (prevCard.s === RED_JOKER && RED_SUITS.includes(card.s)) {
        return true;
    }

    // Black joker rules
    if (card.s === BLACK_JOKER && BLACK_SUITS.includes(prevCard.s)) {
        return true;
    }

    if (prevCard.s === BLACK_JOKER && BLACK_SUITS.includes(card.s)) {
        return true;
    }

    return false;
};

/**
 * Checks if a card matches the selected suit requirement
 */
const isValidSelectedSuitMove = (card: CardType, selectedSuit: Suit): boolean => {
    // Direct suit match
    if (selectedSuit === card.s) {
        return true;
    }

    // Joker color matching
    if ((card.s === RED_JOKER && RED_SUITS.includes(selectedSuit)) ||
        (card.s === BLACK_JOKER && BLACK_SUITS.includes(selectedSuit))) {

        return true;
    }

    return false;
};

/**
 * Checks if a card is a special master card that's always playable
 */
const isMasterCard = (card: CardType): boolean => {
    return (card.v === ACE_VALUE && card.s === SPADES_SUIT);
};

const isAce = (card: CardType): boolean => {
    return (card.v === ACE_VALUE);
};

const isBasicMatch = (card: CardType, prevCard: CardType): boolean => {
    return card.v === prevCard.v || card.s === prevCard.s;
};

/**
 * Determines the next action when a card is played
 */
const getCardEffectAction = (card: CardType): NextAction => {
    // Jokers - allow suit choice
    if (card.s === RED_JOKER || card.s === BLACK_JOKER) {
        return {
            type: NextActionType.CHOOSE_SUIT,
            valid: true,
            allowSuitChoice: true,
            message: 'Choose a suit for the joker'
        };
    }

    // Aces (15) - allow suit choice
    if (card.v === ACE_VALUE) {
        return {
            type: NextActionType.CHOOSE_SUIT,
            valid: true,
            allowSuitChoice: true,
            message: 'Choose a suit for the ace'
        };
    }

    // 2s - draw penalty cards
    if (card.v === 2) {
        return {
            type: NextActionType.APPLY_PENALTY,
            valid: true,
            penaltyCards: 2,
            message: 'Next player draws 2 cards'
        };
    }

    // 3s - draw penalty cards
    if (card.v === 3) {
        return {
            type: NextActionType.APPLY_PENALTY,
            valid: true,
            penaltyCards: 3,
            message: 'Next player draws 3 cards'
        };
    }

    // 8s - skip turn
    if (card.v === 8) {
        return {
            type: NextActionType.SKIP_TURN,
            valid: true,
            skipTurns: 1,
            message: 'Next player skips their turn'
        };
    }

    // Jacks (11) - skip turn
    if (card.v === 11) {
        return {
            type: NextActionType.SKIP_TURN,
            valid: true,
            skipTurns: 1,
            message: 'Next player skips their turn'
        };
    }

    // Regular cards - just end turn
    return {
        type: NextActionType.END_TURN,
        valid: true,
        message: 'Turn ends normally'
    };
};

/**
 * Main function to determine if a card move is valid and what action should follow
 */
export const getNextAction = (props: IsValidMoveProps): NextAction => {
    'worklet';

    const { card, gsv } = props;
    const { currentCard, activePenaltyCount, chosenSuit } = gsv.sharedGameState.value;

    // Check if it's player's turn
    if (!gsv.isPlayerTurn.value) {
        return {
            type: NextActionType.INVALID_MOVE,
            valid: false,
            message: 'Not your turn'
        };
    }

    // First move - any card is valid
    if (!currentCard) {
        return {
            type: NextActionType.PLAY_CARD,
            valid: true,
            message: 'First card played',
            ...getCardEffectAction(card)
        };
    }

    const prevCard = currentCard;

    // Selected suit requirements take priority
    if (chosenSuit) {
        if (isValidSelectedSuitMove(card, chosenSuit)) {
            return {
                type: NextActionType.PLAY_CARD,
                valid: true,
                message: `Played ${card.v} matching chosen suit`,
                ...getCardEffectAction(card)
            };
        } else {
            return {
                type: NextActionType.INVALID_MOVE,
                valid: false,
                message: `Must play a card matching the chosen suit: ${chosenSuit}`
            };
        }
    }

    // Handle active penalty situations
    if (activePenaltyCount > 0) {
        // Can only play penalty cards (2s, 3s) or master cards to counter penalties
        if (card.v === 2 || card.v === 3) {
            return {
                type: NextActionType.PLAY_CARD,
                valid: true,
                message: `Played penalty card, adding ${card.v} to penalty count`,
                ...getCardEffectAction(card)
            };
        } else if (isMasterCard(card)) {
            return {
                type: NextActionType.PLAY_CARD,
                valid: true,
                message: 'Master card cancels penalty',
                ...getCardEffectAction(card)
            };
        } else {
            return {
                type: NextActionType.INVALID_MOVE,
                valid: false,
                message: `Must play a penalty card (2 or 3) or master card when penalty is active`
            };
        }
    }

    // Basic matching (same value or suit)
    if (isBasicMatch(card, prevCard)) {
        return {
            type: NextActionType.PLAY_CARD,
            valid: true,
            message: `Played ${card.v} matching ${prevCard.v} or suit`,
            ...getCardEffectAction(card)
        };
    }

    // Master cards (Ace of Spades) are generally always playable
    if (isMasterCard(card)) {
        return {
            type: NextActionType.PLAY_CARD,
            valid: true,
            message: 'Master card played',
            ...getCardEffectAction(card)
        };
    }

    // Other Aces are playable when no penalty is active
    if (isAce(card)) {
        return {
            type: NextActionType.PLAY_CARD,
            valid: true,
            message: 'Ace played',
            ...getCardEffectAction(card)
        };
    }

    // Joker matching rules
    if (isValidJokerMove(card, prevCard)) {
        return {
            type: NextActionType.PLAY_CARD,
            valid: true,
            message: 'Joker played with color match',
            ...getCardEffectAction(card)
        };
    }

    // If none of the above conditions are met, the move is invalid
    return {
        type: NextActionType.INVALID_MOVE,
        valid: false,
        message: `Cannot play ${card.v} of ${card.s} on ${prevCard.v} of ${prevCard.s}`
    };
};

/**
 * Legacy function for backward compatibility
 */
export const isValidMove = (props: IsValidMoveProps): boolean => {
    'worklet';
    return getNextAction(props).valid;
};

/**
 * Determines what action a player can take when they can't/don't want to play a card
 */
export const getDrawAction = (gsv: Gsv): NextAction => {
    'worklet';

    if (!gsv.isPlayerTurn.value) {
        return {
            type: NextActionType.INVALID_MOVE,
            valid: false,
            message: 'Not your turn'
        };
    }

    const { activePenaltyCount } = gsv.sharedGameState.value;

    // If there's an active penalty, player must draw penalty cards
    if (activePenaltyCount > 0) {
        return {
            type: NextActionType.DRAW_CARDS,
            valid: true,
            penaltyCards: activePenaltyCount,
            message: `Draw ${activePenaltyCount} penalty cards`
        };
    }

    // Check if player has already drawn this turn
    if (gsv.sharedGameState.value.drawStatus.has(gsv.uid)) {
        // Check if cutting card allows additional draws
        if ([8, 11].includes(gsv.sharedGameState.value.cuttingCard.v)) {
            return {
                type: NextActionType.DRAW_CARDS,
                valid: true,
                penaltyCards: 1,
                message: 'Special cutting card allows additional draw'
            };
        } else {
            return {
                type: NextActionType.INVALID_MOVE,
                valid: false,
                message: 'Already drew this turn'
            };
        }
    }

    // Normal draw
    return {
        type: NextActionType.DRAW_CARDS,
        valid: true,
        penaltyCards: 1,
        message: 'Draw one card'
    };
};

/**
 * Legacy function for backward compatibility
 */
export const canDrawCard = (gsv: Gsv): boolean => {
    'worklet';
    return getDrawAction(gsv).valid;
};