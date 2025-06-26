// __tests__/rules.test.js
const { getNextAction, NextActionType } = require('./rules');

describe('Card Game Rules', () => {
  // Helper function to create card objects
  const card = (value, suit) => ({ v: value, s: suit });

  // Helper function to create test expectations
  const expectValid = (result, type, additionalProps = {}) => {
    expect(result.valid).toBe(true);
    expect(result.type).toBe(type);
    Object.entries(additionalProps).forEach(([key, value]) => {
      expect(result[key]).toBe(value);
    });
  };

  const expectInvalid = (result, message = null) => {
    expect(result.valid).toBe(false);
    expect(result.type).toBe(NextActionType.INVALID_MOVE);
  };

  describe('First Move (No Previous Card)', () => {
    test('should allow any regular card as first move', () => {
      const result = getNextAction({
        prevCard: null,
        playedCard: card(7, 'H'),
      });
      expectValid(result, NextActionType.END_TURN);
    });

    test('should allow Ace as first move with suit choice', () => {
      const result = getNextAction({
        prevCard: null,
        playedCard: card(15, 'D'),
      });
      expectValid(result, NextActionType.CHOOSE_SUIT, {
        allowSuitChoice: true,
      });
    });

    test('should allow Master card (Ace of Spades) as first move', () => {
      const result = getNextAction({
        prevCard: null,
        playedCard: card(15, 'S'),
      });
      expectValid(result, NextActionType.CHOOSE_SUIT, {
        allowSuitChoice: true,
      });
    });

    test('should allow penalty cards as first move', () => {
      const result2 = getNextAction({
        prevCard: null,
        playedCard: card(2, 'C'),
      });
      expectValid(result2, NextActionType.APPLY_PENALTY, { penaltyCards: 2 });

      const result3 = getNextAction({
        prevCard: null,
        playedCard: card(3, 'H'),
      });
      expectValid(result3, NextActionType.APPLY_PENALTY, { penaltyCards: 3 });
    });

    test('should allow skip cards as first move', () => {
      const result8 = getNextAction({
        prevCard: null,
        playedCard: card(8, 'D'),
      });
      expectValid(result8, NextActionType.SKIP_TURN, { skipTurns: 1 });

      const resultJack = getNextAction({
        prevCard: null,
        playedCard: card(11, 'S'),
      });
      expectValid(resultJack, NextActionType.SKIP_TURN, { skipTurns: 1 });
    });

    test('should allow jokers as first move', () => {
      const redJoker = getNextAction({
        prevCard: null,
        playedCard: card(50, 'R'),
      });
      expectValid(redJoker, NextActionType.CHOOSE_SUIT, {
        allowSuitChoice: true,
      });

      const blackJoker = getNextAction({
        prevCard: null,
        playedCard: card(50, 'B'),
      });
      expectValid(blackJoker, NextActionType.CHOOSE_SUIT, {
        allowSuitChoice: true,
      });
    });
  });

  describe('Basic Matching Rules', () => {
    describe('Same Suit Matching', () => {
      test('should allow same suit matches', () => {
        const hearts = getNextAction({
          prevCard: card(7, 'H'),
          playedCard: card(10, 'H'),
        });
        expectValid(hearts, NextActionType.END_TURN);

        const diamonds = getNextAction({
          prevCard: card(4, 'D'),
          playedCard: card(12, 'D'),
        });
        expectValid(diamonds, NextActionType.END_TURN);

        const clubs = getNextAction({
          prevCard: card(9, 'C'),
          playedCard: card(6, 'C'),
        });
        expectValid(clubs, NextActionType.END_TURN);

        const spades = getNextAction({
          prevCard: card(13, 'S'),
          playedCard: card(5, 'S'),
        });
        expectValid(spades, NextActionType.END_TURN);
      });
    });

    describe('Same Value Matching', () => {
      test('should allow same value matches across suits', () => {
        const sevens = getNextAction({
          prevCard: card(7, 'H'),
          playedCard: card(7, 'C'),
        });
        expectValid(sevens, NextActionType.END_TURN);

        const kings = getNextAction({
          prevCard: card(13, 'D'),
          playedCard: card(13, 'S'),
        });
        expectValid(kings, NextActionType.END_TURN);

        const fours = getNextAction({
          prevCard: card(4, 'C'),
          playedCard: card(4, 'H'),
        });
        expectValid(fours, NextActionType.END_TURN);
      });
    });

    describe('Invalid Moves', () => {
      test('should reject moves with different suit and value', () => {
        expectInvalid(
          getNextAction({
            prevCard: card(7, 'H'),
            playedCard: card(10, 'C'),
          }),
        );
        expectInvalid(
          getNextAction({
            prevCard: card(5, 'H'),
            playedCard: card(9, 'C'),
          }),
        );
        expectInvalid(
          getNextAction({
            prevCard: card(12, 'S'),
            playedCard: card(6, 'D'),
          }),
        );
      });
    });
  });

  describe('Selected Suit Rules', () => {
    test('should enforce selected suit matching over previous card', () => {
      // Previous card is 7H, selected suit is C, playing 5C should be valid
      const validMatch = getNextAction({
        prevCard: card(7, 'H'),
        playedCard: card(5, 'C'),
        selectedSuit: 'C',
      });
      expectValid(validMatch, NextActionType.END_TURN);

      // Previous card is 7H, selected suit is C, playing 5H should be invalid
      const invalidMatch = getNextAction({
        prevCard: card(7, 'H'),
        playedCard: card(5, 'H'),
        selectedSuit: 'C',
      });
      expectInvalid(invalidMatch, 'selected suit C');
    });

    test('should allow Master card to bypass selected suit', () => {
      const result = getNextAction({
        prevCard: card(7, 'H'),
        playedCard: card(15, 'S'),
        selectedSuit: 'C',
      });
      expectValid(result, NextActionType.CHOOSE_SUIT);
      expect(result.message).toContain('Choose a suit for the ace');
    });

    test('should allow regular Aces to bypass selected suit', () => {
      const result = getNextAction({
        prevCard: card(7, 'H'),
        playedCard: card(15, 'D'),
        selectedSuit: 'C',
      });
      expectValid(result, NextActionType.CHOOSE_SUIT);
      expect(result.message).toContain('Choose a suit for the ace');
    });

    test('should enforce joker color matching with selected suit', () => {
      // Red joker on selected red suit should be valid
      const redJokerValid = getNextAction({
        prevCard: card(7, 'C'),
        playedCard: card(50, 'R'),
        selectedSuit: 'H',
      });
      expectValid(redJokerValid, NextActionType.CHOOSE_SUIT);

      // Red joker on selected black suit should be invalid
      const redJokerInvalid = getNextAction({
        prevCard: card(7, 'H'),
        playedCard: card(50, 'R'),
        selectedSuit: 'C',
      });
      expectInvalid(redJokerInvalid);

      // Black joker on selected black suit should be valid
      const blackJokerValid = getNextAction({
        prevCard: card(7, 'H'),
        playedCard: card(50, 'B'),
        selectedSuit: 'S',
      });
      expectValid(blackJokerValid, NextActionType.CHOOSE_SUIT);

      // Black joker on selected red suit should be invalid
      const blackJokerInvalid = getNextAction({
        prevCard: card(7, 'S'),
        playedCard: card(50, 'B'),
        selectedSuit: 'D',
      });
      expectInvalid(blackJokerInvalid);
    });

    // test('should use selected suit in penalty calculations', () => {
    //   // Same suit penalty with selected suit
    //   const result = getNextAction({
    //     prevCard: card(2, 'H'),
    //     playedCard: card(3, 'C'),
    //     isPenaltyActive: true,
    //   });
    //   console.log('========', result);
    //   expectValid(result, NextActionType.REDUCE_PENALTY, {
    //     currentPenaltyCount: 0,
    //     nextPlayerPenaltyCount: 0,
    //     drawCards: 0,
    //   });
    // });
  });

  describe('Ace Rules', () => {
    test('should allow any Ace on any card', () => {
      const aceHearts = getNextAction({
        prevCard: card(7, 'C'),
        playedCard: card(15, 'H'),
      });
      expectValid(aceHearts, NextActionType.CHOOSE_SUIT);

      const aceDiamonds = getNextAction({
        prevCard: card(10, 'S'),
        playedCard: card(15, 'D'),
      });
      expectValid(aceDiamonds, NextActionType.CHOOSE_SUIT);

      const aceClubs = getNextAction({
        prevCard: card(4, 'H'),
        playedCard: card(15, 'C'),
      });
      expectValid(aceClubs, NextActionType.CHOOSE_SUIT);

      const masterCard = getNextAction({
        prevCard: card(6, 'D'),
        playedCard: card(15, 'S'),
      });
      expectValid(masterCard, NextActionType.CHOOSE_SUIT);
    });

    test('should allow cards on Aces with basic matching', () => {
      const result = getNextAction({
        prevCard: card(5, 'H'),
        playedCard: card(8, 'H'),
      });
      expectValid(result, NextActionType.SKIP_TURN);
    });

    test('should allow Ace on Ace', () => {
      const result = getNextAction({
        prevCard: card(15, 'H'),
        playedCard: card(15, 'D'),
      });
      expectValid(result, NextActionType.CHOOSE_SUIT);
    });
  });

  describe('Joker Rules', () => {
    describe('Red Joker', () => {
      test('should allow Red Joker on red suits', () => {
        const onHearts = getNextAction({
          prevCard: card(7, 'H'),
          playedCard: card(50, 'R'),
        });
        expectValid(onHearts, NextActionType.CHOOSE_SUIT);

        const onDiamonds = getNextAction({
          prevCard: card(10, 'D'),
          playedCard: card(50, 'R'),
        });
        expectValid(onDiamonds, NextActionType.CHOOSE_SUIT);
      });

      test('should reject Red Joker on black suits', () => {
        expectInvalid(
          getNextAction({
            prevCard: card(7, 'C'),
            playedCard: card(50, 'R'),
          }),
        );
        expectInvalid(
          getNextAction({
            prevCard: card(9, 'S'),
            playedCard: card(50, 'R'),
          }),
        );
      });

      test('should allow red cards on Red Joker', () => {
        const hearts = getNextAction({
          prevCard: card(50, 'R'),
          playedCard: card(9, 'H'),
        });
        expectValid(hearts, NextActionType.END_TURN);

        const diamonds = getNextAction({
          prevCard: card(50, 'R'),
          playedCard: card(13, 'D'),
        });
        expectValid(diamonds, NextActionType.END_TURN);
      });

      test('should reject black cards on Red Joker', () => {
        expectInvalid(
          getNextAction({
            prevCard: card(50, 'R'),
            playedCard: card(7, 'C'),
          }),
        );
        expectInvalid(
          getNextAction({
            prevCard: card(50, 'R'),
            playedCard: card(5, 'S'),
          }),
        );
      });
    });

    describe('Black Joker', () => {
      test('should allow Black Joker on black suits', () => {
        const onClubs = getNextAction({
          prevCard: card(6, 'C'),
          playedCard: card(50, 'B'),
        });
        expectValid(onClubs, NextActionType.CHOOSE_SUIT);

        const onSpades = getNextAction({
          prevCard: card(11, 'S'),
          playedCard: card(50, 'B'),
        });
        expectValid(onSpades, NextActionType.CHOOSE_SUIT);
      });

      test('should reject Black Joker on red suits', () => {
        expectInvalid(
          getNextAction({
            prevCard: card(8, 'H'),
            playedCard: card(50, 'B'),
          }),
        );
        expectInvalid(
          getNextAction({
            prevCard: card(12, 'D'),
            playedCard: card(50, 'B'),
          }),
        );
      });

      test('should allow black cards on Black Joker', () => {
        const spades = getNextAction({
          prevCard: card(50, 'B'),
          playedCard: card(5, 'S'),
        });
        expectValid(spades, NextActionType.END_TURN);

        const clubs = getNextAction({
          prevCard: card(50, 'B'),
          playedCard: card(14, 'C'),
        });
        expectValid(clubs, NextActionType.END_TURN);
      });

      test('should reject red cards on Black Joker', () => {
        expectInvalid(
          getNextAction({
            prevCard: card(50, 'B'),
            playedCard: card(6, 'H'),
          }),
        );
        expectInvalid(
          getNextAction({
            prevCard: card(50, 'B'),
            playedCard: card(9, 'D'),
          }),
        );
      });
    });
  });

  describe('Penalty Cards (2s and 3s)', () => {
    describe('Normal Play', () => {
      test('should apply penalties when played normally', () => {
        const two = getNextAction({
          prevCard: card(7, 'H'),
          playedCard: card(2, 'H'),
        });
        expectValid(two, NextActionType.APPLY_PENALTY, {
          penaltyCards: 2,
          nextPlayerPenaltyCount: 2,
        });

        const three = getNextAction({
          prevCard: card(8, 'C'),
          playedCard: card(3, 'C'),
        });
        expectValid(three, NextActionType.APPLY_PENALTY, {
          penaltyCards: 3,
          nextPlayerPenaltyCount: 3,
        });
      });

      test('should allow same value penalty cards', () => {
        const twos = getNextAction({
          prevCard: card(2, 'H'),
          playedCard: card(2, 'S'),
        });
        expectValid(twos, NextActionType.APPLY_PENALTY);

        const threes = getNextAction({
          prevCard: card(3, 'D'),
          playedCard: card(3, 'C'),
        });
        expectValid(threes, NextActionType.APPLY_PENALTY);
      });
    });

    describe('Penalty Active State', () => {
      test('should allow penalty cards as counters', () => {
        const sameValue = getNextAction({
          prevCard: card(2, 'H'),
          playedCard: card(2, 'D'),
          isPenaltyActive: true,
          currentPenaltyCount: 2,
        });
        expectValid(sameValue, NextActionType.TRANSFER_PENALTY, {
          nextPlayerPenaltyCount: 2,
          currentPenaltyCount: 0,
        });

        // const invalidPenaltyMatchBlack = getNextAction({
        //   prevCard: card(50, 'B'),
        //   playedCard: card(2, 'D'),
        //   isPenaltyActive: true,
        //   currentPenaltyCount: 5,
        // });

        // expectInvalid(invalidPenaltyMatchBlack);

        // const invalidPenaltyMatchRed = getNextAction({
        //   prevCard: card(50, 'R'),
        //   playedCard: card(2, 'S'),
        //   isPenaltyActive: true,
        //   currentPenaltyCount: 5,
        // });

        // expectInvalid(invalidPenaltyMatchRed);

        const mixedPenalty = getNextAction({
          prevCard: card(50, 'R'),
          playedCard: card(2, 'H'),
          isPenaltyActive: true,
          currentPenaltyCount: 5,
        });

        console.log('=============mixedPenalty=======================');
        console.log(mixedPenalty);
        console.log('====================================');
        expectValid(mixedPenalty, NextActionType.REDUCE_PENALTY, {
          nextPlayerPenaltyCount: 0,
          currentPenaltyCount: 3,
          drawCards: 3,
          message: 'Color match stronger - penalty reduced, draw 3 cards',
        });

        const mixedPenaltyBlack = getNextAction({
          prevCard: card(50, 'B'),
          playedCard: card(2, 'S'),
          isPenaltyActive: true,
          currentPenaltyCount: 5,
        });

        expectValid(mixedPenaltyBlack, NextActionType.REDUCE_PENALTY, {
          nextPlayerPenaltyCount: 0,
          currentPenaltyCount: 3,
          drawCards: 3,
          message: 'Color match stronger - penalty reduced, draw 3 cards',
        });

        const mixedPenaltyBlack3 = getNextAction({
          prevCard: card(50, 'B'),
          playedCard: card(3, 'S'),
          isPenaltyActive: true,
          currentPenaltyCount: 5,
        });
        expectValid(mixedPenaltyBlack3, NextActionType.REDUCE_PENALTY, {
          nextPlayerPenaltyCount: 0,
          currentPenaltyCount: 2,
          drawCards: 2,
          message: 'Color match stronger - penalty reduced, draw 2 cards',
        });
      });

      test('should allow Master card to cancel penalties', () => {
        const result = getNextAction({
          prevCard: card(2, 'H'),
          playedCard: card(15, 'S'),
          isPenaltyActive: true,
          currentPenaltyCount: 2,
        });
        // expectValid(result, NextActionType.CHOOSE_SUIT, {
        //   nextPlayerPenaltyCount: 0,
        //   currentPenaltyCount: 0,
        // });
        expect(result.message).toContain('Master card cancels all penalties');
      });

      test('should reject non-penalty, non-Master cards when penalty active', () => {
        const result = getNextAction({
          prevCard: card(2, 'H'),
          playedCard: card(7, 'H'),
          isPenaltyActive: true,
          currentPenaltyCount: 2,
        });
        expectInvalid(
          result,
          'Must play a penalty card (2 or 3) or master card',
        );
      });

      test('should allow same suit with stronger card to reduce penalty', () => {
        const result = getNextAction({
          prevCard: card(2, 'H'),
          playedCard: card(3, 'H'),
          isPenaltyActive: true,
          currentPenaltyCount: 2,
        });
        expectValid(result, NextActionType.TRANSFER_PENALTY, {
          currentPenaltyCount: 0,
          nextPlayerPenaltyCount: 3,
        });
      });

      test('should allow same suit with weaker card to transfer penalty', () => {
        const result = getNextAction({
          prevCard: card(3, 'C'),
          playedCard: card(2, 'C'),
          isPenaltyActive: true,
          currentPenaltyCount: 3,
        });
        expectValid(result, NextActionType.REDUCE_PENALTY, {
          nextPlayerPenaltyCount: 0,
          currentPenaltyCount: 1,
        });
      });

      //   test('should allow color match with stronger card to reduce penalty', () => {
      //     const result = getNextAction({
      //       prevCard: card(2, 'H'),
      //       playedCard: card(3, 'D'),
      //       isPenaltyActive: true,
      //       currentPenaltyCount: 2,
      //     });
      //     expectValid(result, NextActionType.TRANSFER_PENALTY, {
      //       currentPenaltyCount: 0,
      //       nextPlayerPenaltyCount: 0,
      //       drawCards: 0,
      //     });
      //   });

      test('should allow color match with weaker card to increase penalty', () => {
        const result = getNextAction({
          prevCard: card(3, 'S'),
          playedCard: card(2, 'C'),
          isPenaltyActive: true,
          currentPenaltyCount: 3,
        });
        expectInvalid(result);
      });

      test('should handle partial penalty reduction when played card is weaker', () => {
        const result = getNextAction({
          prevCard: card(3, 'H'),
          playedCard: card(2, 'H'),
          isPenaltyActive: true,
          currentPenaltyCount: 5,
        });
        expectValid(result, NextActionType.REDUCE_PENALTY, {
          currentPenaltyCount: 3,
          nextPlayerPenaltyCount: 0,
          drawCards: 3,
        });
      });
    });
  });

  describe('Skip Card Rules (8s and Jacks)', () => {
    test('should apply skip turn for 8s', () => {
      const result = getNextAction({
        prevCard: card(7, 'H'),
        playedCard: card(8, 'H'),
      });
      expectValid(result, NextActionType.SKIP_TURN, {
        skipTurns: 1,
      });
    });

    test('should apply skip turn for Jacks', () => {
      const result = getNextAction({
        prevCard: card(11, 'C'),
        playedCard: card(11, 'S'),
      });
      expectValid(result, NextActionType.SKIP_TURN, {
        skipTurns: 1,
      });
    });

    test('should allow valid cards after skip cards', () => {
      const result = getNextAction({
        prevCard: card(8, 'D'),
        playedCard: card(5, 'D'),
      });
      expectValid(result, NextActionType.END_TURN);
    });

    test('should reject invalid cards after skip cards', () => {
      const result = getNextAction({
        prevCard: card(8, 'D'),
        playedCard: card(5, 'C'),
      });
      expectInvalid(result, '5 of C on 8 of D');
    });
  });

  describe('Master Card Rules (Ace of Spades)', () => {
    test('should allow Master card on any card', () => {
      const result = getNextAction({
        prevCard: card(7, 'C'),
        playedCard: card(15, 'S'),
      });
      expectValid(result, NextActionType.CHOOSE_SUIT);
      expect(result.message).toContain('Choose a suit for the ace');
    });

    test('should allow any card on Master card with basic matching', () => {
      const sameSuit = getNextAction({
        prevCard: card(15, 'S'),
        playedCard: card(7, 'S'),
      });
      expectValid(sameSuit, NextActionType.END_TURN);

      const sameValue = getNextAction({
        prevCard: card(15, 'S'),
        playedCard: card(15, 'H'),
      });
      expectValid(sameValue, NextActionType.CHOOSE_SUIT);
    });

    test('should reject invalid cards on Master card', () => {
      const result = getNextAction({
        prevCard: card(15, 'S'),
        playedCard: card(7, 'H'),
      });
      expectInvalid(result, '7 of H on 15 of S');
    });
  });

  describe('Edge Cases', () => {
    test('should handle invalid suit inputs gracefully', () => {
      const result = getNextAction({
        prevCard: card(7, 'H'),
        playedCard: card(7, 'X'), // Invalid suit
      });
      expectValid(result, NextActionType.END_TURN); // Same value match should still work
    });

    test('should handle null or undefined suits', () => {
      const result = getNextAction({
        prevCard: card(7, 'H'),
        playedCard: card(8, null),
      });
      expectInvalid(result);
    });

    test('should handle zero penalty count with penalty active', () => {
      const result = getNextAction({
        prevCard: card(2, 'H'),
        playedCard: card(7, 'H'),
        isPenaltyActive: true,
        currentPenaltyCount: 0,
      });
      expectValid(result, NextActionType.END_TURN);
    });

    test('should handle negative penalty counts', () => {
      const result = getNextAction({
        prevCard: card(2, 'H'),
        playedCard: card(3, 'H'),
        isPenaltyActive: true,
      });
      expectValid(result, NextActionType.APPLY_PENALTY, {
        currentPenaltyCount: 0,
        nextPlayerPenaltyCount: 3,
        valid: true,
      });
    });

    test('should allow jokers after penalty cards without selected suit', () => {
      const redJoker = getNextAction({
        prevCard: card(2, 'H'),
        playedCard: card(50, 'R'),
      });
      expectValid(redJoker, NextActionType.CHOOSE_SUIT);

      const blackJoker = getNextAction({
        prevCard: card(2, 'C'),
        playedCard: card(50, 'B'),
      });
      expectValid(blackJoker, NextActionType.CHOOSE_SUIT);
    });

    test('should allow any matching card after penalty has taken effect', () => {
      const result = getNextAction({
        prevCard: card(2, 'H'),
        playedCard: card(5, 'H'),
      });
      expectValid(result, NextActionType.END_TURN);

      const result1 = getNextAction({
        prevCard: card(3, 'H'),
        playedCard: card(2, 'H'),
      });

      expectValid(result1, NextActionType.APPLY_PENALTY, {
        currentPenaltyCount: 0,
        nextPlayerPenaltyCount: 2,
        valid: true,
      });

      // const result2 = getNextAction({
      //   prevCard: card(15, 'H'),
      //   playedCard: card(50, 'R'),
      //   selectedSuit: 'H',
      // });

      // console.log('==XXXX===');
      // console.log(result2);
      // console.log('====================================');

      // expectValid(result2, NextActionType.APPLY_PENALTY, {
      //   currentPenaltyCount: 0,
      //   nextPlayerPenaltyCount: 2,
      //   valid: true,
      // });

      const result3 = getNextAction({
        prevCard: card(50, 'R'),
        playedCard: card(8, 'H'),
        selectedSuit: 'H',
      });

      console.log('==XXXX3===');
      console.log(result3);
      console.log('====================================');

      expectValid(result3, NextActionType.APPLY_PENALTY, {
        currentPenaltyCount: 0,
        nextPlayerPenaltyCount: 2,
        valid: true,
      });
    });
  });
});
