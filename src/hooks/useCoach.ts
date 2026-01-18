import { useCallback, useRef } from 'react';
import { useChessStore, type CoachMessage, type CoachMessageType } from '../store/chessStore';
import {
  generateGoodMoveMessage,
  generateMistakeMessage,
  generateOpeningMessage,
  generateHintMessage,
  generatePositionalTip,
  getSimpleEvaluation
} from '../lib/chess/coach';
import { getBestMove, getEvaluation } from '../lib/chess/engine';
import { detectOpening } from '../lib/chess/openingDetector';
import type { Move, Chess } from 'chess.js';

// Thresholds for triggering coach messages (in centipawns)
const GOOD_MOVE_THRESHOLD = 80;  // +0.8 pawns
const MISTAKE_THRESHOLD = -80;    // -0.8 pawns
const TIP_INTERVAL = 5;           // Every 5 moves

export function useCoach() {
  const {
    game,
    fen,
    prevEvaluation,
    moveCount,
    isCoachEnabled,
    isCoachLoading,
    setCoachMessage,
    setCoachLoading,
    setOpening,
    setEvaluation
  } = useChessStore();
  
  const lastTipMove = useRef(0);
  const lastOpeningAnnounced = useRef('');

  /**
   * Main function called after every user move
   * Analyzes the move and triggers appropriate coach message
   */
  const analyzeMove = useCallback(async (
    move: Move,
    gameState: Chess
  ): Promise<void> => {
    if (!isCoachEnabled || isCoachLoading) return;
    
    setCoachLoading(true);
    
    try {
      // Get new evaluation
      const newEval = getEvaluation(gameState) ?? getSimpleEvaluation(gameState.fen());
      setEvaluation(newEval);
      
      const evalChange = newEval - prevEvaluation;
      
      // Check for opening (first 10 moves)
      if (moveCount <= 20) {
        const opening = detectOpening(gameState.history());
        if (opening && opening.name !== lastOpeningAnnounced.current) {
          lastOpeningAnnounced.current = opening.name;
          setOpening(opening.name, opening.eco);
          
          const message = await generateOpeningMessage(
            opening.name,
            opening.eco,
            gameState.history(),
            gameState.fen()
          );
          
          setCoachMessage({
            type: 'opening',
            message,
            timestamp: Date.now()
          });
          setCoachLoading(false);
          return;
        }
      }
      
      // Type 1: Good Move (+0.8 eval gain)
      if (evalChange >= GOOD_MOVE_THRESHOLD) {
        const message = await generateGoodMoveMessage(
          gameState.fen(),
          move,
          evalChange
        );
        
        setCoachMessage({
          type: 'good',
          message,
          timestamp: Date.now()
        });
        setCoachLoading(false);
        return;
      }
      
      // Type 2: Mistake (-0.8 eval drop)
      if (evalChange <= MISTAKE_THRESHOLD) {
        // Try to get the best move that was missed
        const bestMove = await getBestMove(gameState, 3);
        const bestMoveSan = bestMove && typeof bestMove === 'object' && 'san' in bestMove ? bestMove.san : undefined;
        
        const message = await generateMistakeMessage(
          gameState.fen(),
          move,
          evalChange,
          bestMoveSan
        );
        
        setCoachMessage({
          type: 'mistake',
          message,
          timestamp: Date.now()
        });
        setCoachLoading(false);
        return;
      }
      
      // Type 5: Positional Tip (every 5 moves if no blunder)
      if (moveCount - lastTipMove.current >= TIP_INTERVAL && evalChange > MISTAKE_THRESHOLD) {
        lastTipMove.current = moveCount;
        
        const message = await generatePositionalTip(
          gameState.fen(),
          newEval,
          moveCount
        );
        
        setCoachMessage({
          type: 'tip',
          message,
          timestamp: Date.now()
        });
      }
      
    } catch (error) {
      console.error('Coach analysis error:', error);
    } finally {
      setCoachLoading(false);
    }
  }, [
    isCoachEnabled,
    isCoachLoading,
    moveCount,
    prevEvaluation,
    setCoachLoading,
    setCoachMessage,
    setEvaluation,
    setOpening
  ]);

  /**
   * Type 4: User requests a hint
   */
  const requestHint = useCallback(async (): Promise<void> => {
    if (isCoachLoading) return;
    
    setCoachLoading(true);
    
    try {
      // Get the best move
      const bestMove = await getBestMove(game, 4);
      const bestMoveSan = bestMove && typeof bestMove === 'object' && 'san' in bestMove ? bestMove.san : 'Nf3';
      
      // Get legal moves for context
      const legalMoves = game.moves();
      
      const message = await generateHintMessage(
        fen,
        bestMoveSan,
        legalMoves
      );
      
      setCoachMessage({
        type: 'hint',
        message,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Hint generation error:', error);
      setCoachMessage({
        type: 'hint',
        message: "Look for developing your pieces or controlling the center!",
        timestamp: Date.now()
      });
    } finally {
      setCoachLoading(false);
    }
  }, [game, fen, isCoachLoading, setCoachLoading, setCoachMessage]);

  /**
   * Send a custom coach message
   */
  const sendCoachMessage = useCallback((
    type: CoachMessageType,
    message: string
  ): void => {
    const coachMsg: CoachMessage = {
      type,
      message,
      timestamp: Date.now()
    };
    setCoachMessage(coachMsg);
  }, [setCoachMessage]);

  /**
   * Clear the current coach message
   */
  const clearCoachMessage = useCallback((): void => {
    setCoachMessage(null);
  }, [setCoachMessage]);

  return {
    analyzeMove,
    requestHint,
    sendCoachMessage,
    clearCoachMessage,
    isLoading: isCoachLoading
  };
}
