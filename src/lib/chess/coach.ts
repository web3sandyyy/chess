import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Move } from 'chess.js';

// Initialize Gemini with API key from environment
const getGemini = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('Gemini API key not found. Coach features will use fallback messages.');
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

// Type for coach message responses
export type CoachPromptType = 'good' | 'mistake' | 'opening' | 'hint' | 'tip';

// Fallback messages when API is unavailable
const FALLBACK_MESSAGES: Record<CoachPromptType, string[]> = {
  good: [
    "Great move! You're developing your pieces well.",
    "Excellent choice! That improves your position.",
    "Nice! You're controlling important squares.",
    "Well played! Keep up the good development.",
    "Strong move! You're building a solid position."
  ],
  mistake: [
    "That move weakens your position. Consider piece safety!",
    "Be careful! Look for threats before moving.",
    "That might not be the best. Check for hanging pieces.",
    "Watch out! Your opponent might have a strong reply.",
    "Consider protecting your pieces more carefully."
  ],
  opening: [
    "You're in a classical opening position. Focus on development!",
    "Opening phase: Control the center and develop pieces.",
    "Good opening play! Castle early for king safety.",
    "Standard opening. Remember: knights before bishops!",
    "Opening principle: Don't move the same piece twice early."
  ],
  hint: [
    "Look for developing your minor pieces.",
    "Consider controlling the center squares.",
    "Think about king safety - have you castled?",
    "Look for tactical opportunities!",
    "Check if any of your pieces can be more active."
  ],
  tip: [
    "Tip: Active pieces are happy pieces!",
    "Remember: Create threats while improving your position.",
    "Principle: Pieces work better together.",
    "Advice: Look at the whole board before moving.",
    "Strategy: Improve your worst-placed piece."
  ]
};

const getRandomFallback = (type: CoachPromptType): string => {
  const messages = FALLBACK_MESSAGES[type];
  return messages[Math.floor(Math.random() * messages.length)];
};

// ==================== 5 COACH PROMPT TYPES ====================

/**
 * Type 1: GOOD MOVE - Triggered when eval improves by +0.8 or more
 */
export async function generateGoodMoveMessage(
  fen: string,
  move: Move,
  evalGain: number
): Promise<string> {
  const genAI = getGemini();
  if (!genAI) return getRandomFallback('good');
  
  const prompt = `You are a friendly chess coach. The student just made an excellent move!

Current position (FEN): ${fen}
Move played: ${move.san} (${move.from}→${move.to})
Evaluation improvement: +${(evalGain / 100).toFixed(1)} pawns

In exactly ONE short sentence (max 25 words):
1. Praise the move briefly
2. Explain WHY it's strong (center control/development/safety/attack)
3. Suggest what to focus on next

Use encouraging language. NO engine scores. NO variations.
Example: "Excellent! Nf3 develops your knight and controls e5. Next, aim to castle for king safety."`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    return getRandomFallback('good');
  }
}

/**
 * Type 2: MISTAKE - Triggered when eval drops by -0.8 or more
 */
export async function generateMistakeMessage(
  fen: string,
  move: Move,
  evalDrop: number,
  bestMove?: string
): Promise<string> {
  const genAI = getGemini();
  if (!genAI) return getRandomFallback('mistake');
  
  const prompt = `You are a supportive chess coach. The student made a mistake, but we learn from errors!

Current position (FEN): ${fen}
Move played: ${move.san} (caused ${(Math.abs(evalDrop) / 100).toFixed(1)} pawn disadvantage)
${bestMove ? `Better alternative: ${bestMove}` : ''}

In exactly ONE short sentence (max 25 words):
1. Gently point out what went wrong (hanging piece/weak square/missed threat)
2. ${bestMove ? `Explain why ${bestMove} was better` : 'Suggest what to look for'}
3. Give ONE principle to remember

Be encouraging, NOT discouraging. NO engine numbers.
Example: "Oops! That left your bishop undefended. d4 would develop with tempo. Remember: check piece safety before moving!"`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    return getRandomFallback('mistake');
  }
}

/**
 * Type 3: OPENING - Triggered when an opening is identified
 */
export async function generateOpeningMessage(
  openingName: string,
  eco: string,
  moves: string[],
  fen: string
): Promise<string> {
  const genAI = getGemini();
  if (!genAI) return `You're playing the ${openingName}! Focus on development and center control.`;
  
  const prompt = `You are a chess coach teaching openings to a beginner.

Opening detected: ${openingName} (ECO: ${eco})
Moves so far: ${moves.join(' ')}
Current position (FEN): ${fen}

In exactly ONE short sentence (max 30 words):
1. Name the opening
2. Explain its ONE key idea (e.g., "Sicilian fights for d4 control")
3. Suggest the main plan for the next few moves

Make it memorable! NO engine analysis.
Example: "Welcome to the Italian Game! White targets f7, Black's weakest point. Focus on solid development and consider ...Nf6 next."`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    return `You're playing the ${openingName}! A solid choice.`;
  }
}

/**
 * Type 4: HINT - User clicks the hint button
 */
export async function generateHintMessage(
  fen: string,
  bestMove: string,
  legalMoves: string[]
): Promise<string> {
  const genAI = getGemini();
  if (!genAI) return `Consider playing ${bestMove}! It improves your position.`;
  
  const prompt = `You are a chess coach giving a hint to a student who asked for help.

Current position (FEN): ${fen}
Best move: ${bestMove}
Some legal moves: ${legalMoves.slice(0, 5).join(', ')}

In exactly ONE short sentence (max 25 words):
1. GIVE the exact best move (e.g., "Play Nf3!")
2. Explain ONE clear reason why
3. Mention the chess principle it demonstrates

Be direct and helpful.
Example: "Play Nf3! It develops your knight while attacking e5. Principle: Develop pieces toward the center."`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    return `Consider playing ${bestMove}! It's the strongest move here.`;
  }
}

/**
 * Type 5: POSITIONAL TIP - Every 5 moves when playing well
 */
export async function generatePositionalTip(
  fen: string,
  evaluation: number,
  moveNumber: number
): Promise<string> {
  const genAI = getGemini();
  if (!genAI) return getRandomFallback('tip');
  
  const evalSide = evaluation > 0 ? 'White' : 'Black';
  const evalMagnitude = Math.abs(evaluation / 100).toFixed(1);
  
  const prompt = `You are a chess coach giving periodic positional advice.

Current position (FEN): ${fen}
Evaluation: ${evalSide} is better by ${evalMagnitude} pawns
Move number: ${moveNumber}

In exactly ONE short sentence (max 25 words):
1. Identify ONE thing to improve (piece activity/king safety/pawn structure)
2. Give ONE general principle
3. Point out ONE square or piece to watch

NO specific moves. Focus on understanding.
Example: "Your knight on b1 is undeveloped. Principle: Activate all pieces! Watch the open d-file for rook play."`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    return getRandomFallback('tip');
  }
}

/**
 * Get evaluation from position using simple heuristics
 * (Used when Stockfish eval isn't available)
 */
export function getSimpleEvaluation(fen: string): number {
  const pieceValues: Record<string, number> = {
    'p': -100, 'n': -320, 'b': -330, 'r': -500, 'q': -900, 'k': 0,
    'P': 100, 'N': 320, 'B': 330, 'R': 500, 'Q': 900, 'K': 0
  };
  
  const position = fen.split(' ')[0];
  let eval_ = 0;
  
  for (const char of position) {
    if (pieceValues[char] !== undefined) {
      eval_ += pieceValues[char];
    }
  }
  
  return eval_;
}
