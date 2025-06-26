import { handleMove } from './handleMove';
import { WebSocket } from 'ws';
import { WebSocketMessageType } from './../../types/messageTypes';
import { CardType, GameState } from './../types';
import { endGame } from './endGame';
import { clients, gameStates, PLAY_TIMEOUT_DURATION } from './../state';
import { startTimeout } from './../wsUtil';
import { reshufflePlayedCards } from './../../utils/cardUtils';

// Mock dependencies
jest.mock('./endGame');
jest.mock('./../wsUtil');
jest.mock('./../../utils/cardUtils');
jest.mock('./../state', () => ({
  clients: new Map(),
  gameStates: new Map(),
  PLAY_TIMEOUT_DURATION: 30000,
}));

describe('handleMove', () => {
  let mockWs: jest.Mocked<WebSocket>;
  let mockGameState: GameState;
  let mockClients: Map<string, { ws: jest.Mocked<WebSocket> }>;
  let mockGameStates: Map<string, GameState>;

  const createMockCard = (value: number, suit: string): CardType => ({
    v: value,
    s: suit,
  });

  const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
    gameId: 'test-game-id',
    players: {
      'player1': [
        createMockCard(5, 'hearts'),
        createMockCard(7, 'spades'),
        createMockCard(2, 'clubs'),
      ],
      'player2': [
        createMockCard(9, 'diamonds'),
        createMockCard(11, 'hearts'),
      ],
    },
    deck: [
      createMockCard(3, 'spades'),
      createMockCard(4, 'hearts'),
      createMockCard(6, 'clubs'),
    ],
    playedCards: [createMockCard(8, 'diamonds')],
    currentCard: createMockCard(8, 'diamonds'),
    currentTurn: 'player1',
    cuttingCard: createMockCard(7, 'spades'),
    chosenSuit: null,
    activePenaltyCount: 0,
    turnExpiresAt: Date.now() + 30000,
    waitTimeout: null,
    moveTimeout: null,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockWs = {
      send: jest.fn(),
    } as any;

    mockGameState = createMockGameState();
    
    mockClients = clients as jest.Mocked<typeof clients>;
    mockGameStates = gameStates as jest.Mocked<typeof gameStates>;
    
    mockClients.clear();
    mockGameStates.clear();
    
    mockGameStates.set('test-game-id', mockGameState);
    mockClients.set('player1', { ws: mockWs });
    mockClients.set('player2', { ws: mockWs });

    (reshufflePlayedCards as jest.Mock).mockReturnValue({
      newDeck: [createMockCard(1, 'hearts'), createMockCard(2, 'hearts')],
    });
  });

  describe('Basic Validations', () => {
    test('should return error when game not found', async () => {
      mockGameStates.delete('test-game-id');
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [],
        },
      });

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'ERROR', message: 'Game not found' })
      );
    });

    test('should return error when player not found in game', async () => {
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'nonexistent-player',
          to: 'player2',
          cards: [],
        },
      });

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'ERROR', message: 'Player not found in game' })
      );
    });
  });

  describe('Draw Actions', () => {
    test('should successfully process valid draw action', async () => {
      const drawnCards = [createMockCard(6, 'clubs')]; // Top card from deck
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'DRAW', v: 6, s: 'clubs' }],
        },
      });

      // Verify card was added to player's hand
      expect(mockGameState.players['player1']).toContainEqual(createMockCard(6, 'clubs'));
      // Verify card was removed from deck
      expect(mockGameState.deck).toHaveLength(2);
      expect(mockGameState.deck).not.toContainEqual(createMockCard(6, 'clubs'));
    });

    test('should handle multiple card draw', async () => {
      const drawnCards = [
        createMockCard(6, 'clubs'),
        createMockCard(4, 'hearts'),
      ];
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [
            { type: 'DRAW', v: 4, s: 'hearts' },
            { type: 'DRAW', v: 6, s: 'clubs' },
          ],
        },
      });

      expect(mockGameState.players['player1']).toHaveLength(5);
      expect(mockGameState.deck).toHaveLength(1);
    });

    test('should return error for invalid drawn cards', async () => {
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'DRAW', v: 999, s: 'invalid' }],
        },
      });

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'ERROR',
          message: 'Network issue: drawn cards do not match deck state',
        })
      );
    });

    test('should return error when trying to draw more cards than available in deck', async () => {
      mockGameState.deck = [createMockCard(1, 'hearts')]; // Only one card in deck
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [
            { type: 'DRAW', v: 1, s: 'hearts' },
            { type: 'DRAW', v: 2, s: 'hearts' },
          ],
        },
      });

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'ERROR',
          message: 'Network issue: drawn cards do not match deck state',
        })
      );
    });
  });

  describe('Deck Reshuffling', () => {
    test('should trigger reshuffle when deck is low and notify players', async () => {
      mockGameState.deck = [createMockCard(1, 'hearts')]; // Below minimum
      mockGameState.playedCards = [
        createMockCard(2, 'spades'),
        createMockCard(3, 'hearts'),
      ];

      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'DRAW', v: 1, s: 'hearts' }],
        },
      });

      expect(reshufflePlayedCards).toHaveBeenCalledWith(
        mockGameState.deck,
        mockGameState.playedCards
      );
      
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining(WebSocketMessageType.DECK_RESHUFFLED)
      );
    });

    test('should not reshuffle when deck size is sufficient', async () => {
      mockGameState.deck = Array(10).fill(null).map((_, i) => 
        createMockCard(i + 1, 'hearts')
      );

      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'DRAW', v: 10, s: 'hearts' }],
        },
      });

      expect(reshufflePlayedCards).not.toHaveBeenCalled();
    });

    test('should not reshuffle when no played cards available', async () => {
      mockGameState.deck = [createMockCard(1, 'hearts')];
      mockGameState.playedCards = [];

      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'DRAW', v: 1, s: 'hearts' }],
        },
      });

      expect(reshufflePlayedCards).not.toHaveBeenCalled();
    });
  });

  describe('Play Actions', () => {
    test('should successfully process valid play action', async () => {
      const playCard = createMockCard(5, 'hearts');
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 5, s: 'hearts' }],
        },
      });

      // Card should be removed from player's hand
      expect(mockGameState.players['player1']).not.toContainEqual(playCard);
      // Card should be added to played cards
      expect(mockGameState.playedCards).toContainEqual(playCard);
      // Current card should be updated
      expect(mockGameState.currentCard).toEqual(playCard);
    });

    test('should handle newSuit parameter for joker cards', async () => {
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 5, s: 'hearts' }],
          newSuit: 'diamonds',
        },
      });

      expect(mockGameState.chosenSuit).toBe('diamonds');
    });

    test('should clear chosen suit when playing regular cards', async () => {
      mockGameState.chosenSuit = 'diamonds';
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 5, s: 'hearts' }],
        },
      });

      expect(mockGameState.chosenSuit).toBeNull();
    });
  });

  describe('Penalty Card Processing', () => {
    test('should set penalty count for penalty card 2', async () => {
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 2, s: 'clubs' }],
        },
      });

      expect(mockGameState.activePenaltyCount).toBe(2);
    });

    test('should set penalty count for penalty card 3', async () => {
      mockGameState.players['player1'].push(createMockCard(3, 'hearts'));
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 3, s: 'hearts' }],
        },
      });

      expect(mockGameState.activePenaltyCount).toBe(3);
    });

    test('should set penalty count to 5 for penalty card 50', async () => {
      mockGameState.players['player1'].push(createMockCard(50, 'hearts'));
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 50, s: 'hearts' }],
        },
      });

      expect(mockGameState.activePenaltyCount).toBe(5);
    });

    test('should stack same penalty cards', async () => {
      mockGameState.currentCard = createMockCard(2, 'spades');
      mockGameState.activePenaltyCount = 2;
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 2, s: 'clubs' }],
        },
      });

      expect(mockGameState.activePenaltyCount).toBe(2);
    });

    test('should use higher penalty value when different penalty cards are played', async () => {
      mockGameState.currentCard = createMockCard(2, 'spades');
      mockGameState.activePenaltyCount = 2;
      mockGameState.players['player1'].push(createMockCard(3, 'hearts'));
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 3, s: 'hearts' }],
        },
      });

      expect(mockGameState.activePenaltyCount).toBe(3);
    });

    test('should reset penalty count after move is processed', async () => {
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 2, s: 'clubs' }],
        },
      });

      // Penalty count should be reset to 0 after processing
      expect(mockGameState.activePenaltyCount).toBe(0);
    });
  });

  describe('Cutting Card Logic', () => {
    test('should end game when cutting card is played', async () => {
      mockGameState.cuttingCard = createMockCard(7, 'spades');
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 7, s: 'spades' }],
        },
      });

      expect(endGame).toHaveBeenCalledWith({
        gameId: 'test-game-id',
        winner: 'player1', // Player with lower card total
        loser: 'player2',
        reason: 'CUTTING_CARD',
        additionalData: {
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 7, s: 'spades' }],
        },
      });
    });

    test('should not end game for non-cutting card of same value', async () => {
      mockGameState.cuttingCard = createMockCard(7, 'spades');
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 7, s: 'hearts' }], // Different suit
        },
      });

      expect(endGame).not.toHaveBeenCalled();
    });

    test('should determine winner by lowest card total when cutting card played', async () => {
      // Player1 has total value: 5 + 7 + 2 = 14 (after removing played card)
      // Player2 has total value: 9 + 11 = 20
      mockGameState.cuttingCard = createMockCard(7, 'spades');
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 7, s: 'spades' }],
        },
      });

      expect(endGame).toHaveBeenCalledWith(
        expect.objectContaining({
          winner: 'player1', // Lower total
          loser: 'player2',
          reason: 'CUTTING_CARD',
        })
      );
    });
  });

  describe('Game End Conditions', () => {
    test('should end game when player runs out of cards', async () => {
      mockGameState.players['player1'] = [createMockCard(5, 'hearts')]; // Only one card
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 5, s: 'hearts' }],
        },
      });

      expect(endGame).toHaveBeenCalledWith({
        gameId: 'test-game-id',
        winner: 'player1',
        loser: 'player2',
        reason: 'NO_CARDS',
        additionalData: {
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 5, s: 'hearts' }],
        },
      });
    });

    test('should handle duplicate end game check gracefully', async () => {
      mockGameState.players['player1'] = [createMockCard(5, 'hearts')];
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 5, s: 'hearts' }],
        },
      });

      // Should only call endGame once despite two checks
      expect(endGame).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mixed Actions', () => {
    test('should handle both draw and play actions in same move', async () => {
      const initialHandSize = mockGameState.players['player1'].length;
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [
            { type: 'DRAW', v: 6, s: 'clubs' },
            { type: 'PLAY', v: 5, s: 'hearts' },
          ],
        },
      });

      // Should have same number of cards (drew 1, played 1)
      expect(mockGameState.players['player1']).toHaveLength(initialHandSize);
      expect(mockGameState.currentCard).toEqual(createMockCard(5, 'hearts'));
    });

    test('should process multiple play actions', async () => {
      mockGameState.players['player1'].push(createMockCard(9, 'diamonds'));
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [
            { type: 'PLAY', v: 5, s: 'hearts' },
            { type: 'PLAY', v: 9, s: 'diamonds' },
          ],
        },
      });

      expect(mockGameState.playedCards).toContainEqual(createMockCard(5, 'hearts'));
      expect(mockGameState.playedCards).toContainEqual(createMockCard(9, 'diamonds'));
      expect(mockGameState.currentCard).toEqual(createMockCard(9, 'diamonds'));
    });
  });

  describe('Game State Updates', () => {
    test('should update current turn', async () => {
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 5, s: 'hearts' }],
        },
      });

      expect(mockGameState.currentTurn).toBe('player2');
    });

    test('should start timeout and set turn expiry', async () => {
      const beforeTime = Date.now();
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 5, s: 'hearts' }],
        },
      });

      expect(startTimeout).toHaveBeenCalledWith('test-game-id');
      expect(mockGameState.turnExpiresAt).toBeGreaterThanOrEqual(beforeTime + PLAY_TIMEOUT_DURATION);
    });

    test('should clear wait timeout', async () => {
      mockGameState.waitTimeout = 'some-timeout' as any;
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 5, s: 'hearts' }],
        },
      });

      expect(mockGameState.waitTimeout).toBeNull();
    });
  });

  describe('Player Notifications', () => {
    test('should notify all players about the move', async () => {
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 5, s: 'hearts' }],
        },
      });

      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining(WebSocketMessageType.MOVE)
      );
    });

    test('should include reshuffle info in move notification when reshuffle occurs', async () => {
      mockGameState.deck = [createMockCard(1, 'hearts')];
      mockGameState.playedCards = [createMockCard(2, 'spades')];
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'DRAW', v: 1, s: 'hearts' }],
        },
      });

      const sentMessage = JSON.parse(mockWs.send.mock.calls[1][0]); // Second call (first is reshuffle notification)
      expect(sentMessage.data.reshuffleInfo.occurred).toBe(true);
    });

    test('should exclude timeout properties from game state in notifications', async () => {
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 5, s: 'hearts' }],
        },
      });

      const sentMessage = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(sentMessage.data.gameState.waitTimeout).toBeUndefined();
      expect(sentMessage.data.gameState.moveTimeout).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty cards array', async () => {
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [],
        },
      });

      expect(mockGameState.currentTurn).toBe('player2');
      expect(startTimeout).toHaveBeenCalled();
    });

    test('should handle card with undefined value gracefully', async () => {
      mockGameState.players['player1'].push({ v: undefined, s: 'hearts' } as any);
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: undefined, s: 'hearts' }],
        },
      });

      // Should not crash and should continue processing
      expect(mockGameState.currentTurn).toBe('player2');
    });

    test('should handle missing game state properties', async () => {
      delete (mockGameState as any).chosenSuit;
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 5, s: 'hearts' }],
        },
      });

      expect(mockWs.send).toHaveBeenCalled();
    });

    test('should handle player with no cards in hand', async () => {
      mockGameState.players['player1'] = [];
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [],
        },
      });

      expect(endGame).toHaveBeenCalledWith(
        expect.objectContaining({
          winner: 'player1',
          reason: 'NO_CARDS',
        })
      );
    });

    test('should handle single player game state', async () => {
      mockGameState.players = { 'player1': [createMockCard(5, 'hearts')] };
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 5, s: 'hearts' }],
        },
      });

      expect(endGame).toHaveBeenCalledWith(
        expect.objectContaining({
          winner: 'player1',
          loser: undefined,
          reason: 'NO_CARDS',
        })
      );
    });
  });

  describe('Performance and Memory', () => {
    test('should handle large number of cards efficiently', async () => {
      const manyCards = Array(100).fill(null).map((_, i) => 
        createMockCard(i % 13 + 1, ['hearts', 'diamonds', 'clubs', 'spades'][i % 4])
      );
      
      mockGameState.players['player1'] = [...manyCards];
      mockGameState.deck = [...manyCards];
      
      const startTime = Date.now();
      
      await handleMove({
        ws: mockWs,
        data: {
          gameId: 'test-game-id',
          from: 'player1',
          to: 'player2',
          cards: [{ type: 'PLAY', v: 1, s: 'hearts' }],
        },
      });
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });
  });
});