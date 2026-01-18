import { create } from 'zustand';
import { Chess, type Move, type Square } from 'chess.js';

export type CoachMessageType = 'good' | 'mistake' | 'opening' | 'hint' | 'tip' | 'welcome' | null;

export interface CoachMessage {
  type: CoachMessageType;
  message: string;
  timestamp: number;
}

interface ChessState {
  // Game state
  game: Chess;
  fen: string;
  turn: 'w' | 'b';
  isGameOver: boolean;
  result: string | null;
  
  // AI & Difficulty
  difficulty: number; // 1-10
  playerColor: 'w' | 'b';
  gameMode: 'PvC' | 'PvP' | null;
  
  // Evaluation
  evaluation: number;
  prevEvaluation: number;
  
  // Opening
  openingName: string;
  openingEco: string;
  
  // Coach
  coachMessage: CoachMessage | null;
  coachHistory: CoachMessage[];
  isCoachLoading: boolean;
  isCoachEnabled: boolean;
  
  // Move tracking
  moveCount: number;
  lastMove: { from: string; to: string } | null;
  
  // Actions
  makeMove: (from: Square, to: Square, promotion?: string) => Move | null;
  undo: () => boolean;
  resetGame: () => void;
  getValidMoves: (square: Square) => Move[];
  
  // Setters
  setDifficulty: (level: number) => void;
  setPlayerColor: (color: 'w' | 'b') => void;
  setGameMode: (mode: 'PvC' | 'PvP' | null) => void;
  setEvaluation: (eval_: number) => void;
  setOpening: (name: string, eco: string) => void;
  setCoachMessage: (msg: CoachMessage | null) => void;
  setCoachLoading: (loading: boolean) => void;
  toggleCoach: () => void;
  setLastMove: (move: { from: string; to: string } | null) => void;
}

export const useChessStore = create<ChessState>((set, get) => ({
  // Initial game state
  game: new Chess(),
  fen: new Chess().fen(),
  turn: 'w',
  isGameOver: false,
  result: null,
  
  // AI & Difficulty
  difficulty: 3,
  playerColor: 'w',
  gameMode: null,
  
  // Evaluation (centipawns, positive = white advantage)
  evaluation: 0,
  prevEvaluation: 0,
  
  // Opening
  openingName: '',
  openingEco: '',
  
  // Coach
  coachMessage: {
    type: 'welcome',
    message: "Welcome to AI Chess Coach! I'll help you learn as you play. Make your first move!",
    timestamp: Date.now()
  },
  coachHistory: [],
  isCoachLoading: false,
  isCoachEnabled: true,
  
  // Move tracking
  moveCount: 0,
  lastMove: null,
  
  // Actions
  makeMove: (from, to, promotion = 'q') => {
    const { game } = get();
    try {
      const move = game.move({ from, to, promotion });
      if (move) {
        set(state => ({
          fen: game.fen(),
          turn: game.turn(),
          moveCount: state.moveCount + 1,
          lastMove: { from, to },
          prevEvaluation: state.evaluation,
          isGameOver: game.isGameOver(),
          result: game.isGameOver() 
            ? game.isCheckmate() 
              ? `Checkmate! ${game.turn() === 'w' ? 'Black' : 'White'} wins!`
              : game.isDraw() 
                ? 'Draw!'
                : game.isStalemate() 
                  ? 'Stalemate!'
                  : null
            : null
        }));
        return move;
      }
    } catch {
      return null;
    }
    return null;
  },
  
  undo: () => {
    const { game } = get();
    const move = game.undo();
    if (move) {
      set(state => ({
        fen: game.fen(),
        turn: game.turn(),
        moveCount: Math.max(0, state.moveCount - 1),
        lastMove: null,
        isGameOver: false,
        result: null
      }));
      return true;
    }
    return false;
  },
  
  resetGame: () => {
    const newGame = new Chess();
    set({
      game: newGame,
      fen: newGame.fen(),
      turn: 'w',
      isGameOver: false,
      result: null,
      evaluation: 0,
      prevEvaluation: 0,
      openingName: '',
      openingEco: '',
      coachMessage: {
        type: 'welcome',
        message: "New game started! Good luck!",
        timestamp: Date.now()
      },
      coachHistory: [],
      moveCount: 0,
      lastMove: null
    });
  },
  
  getValidMoves: (square) => {
    const { game } = get();
    return game.moves({ square, verbose: true });
  },
  
  // Setters
  setDifficulty: (level) => set({ difficulty: Math.max(1, Math.min(10, level)) }),
  setPlayerColor: (color) => set({ playerColor: color }),
  setGameMode: (mode) => set({ gameMode: mode }),
  setEvaluation: (eval_) => set(state => ({ 
    prevEvaluation: state.evaluation,
    evaluation: eval_ 
  })),
  setOpening: (name, eco) => set({ openingName: name, openingEco: eco }),
  setCoachMessage: (msg) => set(state => ({
    coachMessage: msg,
    coachHistory: msg ? [...state.coachHistory, msg] : state.coachHistory
  })),
  setCoachLoading: (loading) => set({ isCoachLoading: loading }),
  toggleCoach: () => set(state => ({ isCoachEnabled: !state.isCoachEnabled })),
  setLastMove: (move) => set({ lastMove: move })
}));
