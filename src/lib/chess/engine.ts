import { minimax } from './ai/search';
import { evaluateBoard } from './ai/evaluate';
import { Chess, Move } from 'chess.js';

// Stockfish web worker instance
let stockfishWorker: Worker | null = null;
let stockfishReady = false;
let stockfishFailed = false;

// Initialize Stockfish worker using stockfish.js CDN as fallback
function initStockfish(): Promise<Worker> {
    return new Promise((resolve, reject) => {
        if (stockfishFailed) {
            reject(new Error('Stockfish previously failed'));
            return;
        }
        
        if (stockfishWorker && stockfishReady) {
            resolve(stockfishWorker);
            return;
        }

        try {
            // Try to load Stockfish from CDN (more reliable for web)
            stockfishWorker = new Worker(
                'https://unpkg.com/stockfish@16.0.0/src/stockfish-nnue-16-single.js'
            );

            const timeout = setTimeout(() => {
                stockfishFailed = true;
                reject(new Error('Stockfish initialization timeout'));
            }, 5000);

            stockfishWorker.onmessage = (event) => {
                const msg = String(event.data);
                if (msg === 'uciok' || msg.includes('readyok')) {
                    clearTimeout(timeout);
                    stockfishReady = true;
                    resolve(stockfishWorker!);
                }
            };

            stockfishWorker.onerror = (error) => {
                clearTimeout(timeout);
                stockfishFailed = true;
                console.error('Stockfish worker error:', error);
                reject(error);
            };

            stockfishWorker.postMessage('uci');
            stockfishWorker.postMessage('isready');
        } catch (error) {
            stockfishFailed = true;
            console.error('Failed to initialize Stockfish:', error);
            reject(error);
        }
    });
}

// Get evaluation for the current position
export function getEvaluation(game: Chess): number {
    return evaluateBoard(game);
}

// Get best move using Stockfish for higher levels
async function getStockfishMove(game: Chess, level: number): Promise<Move | null> {
    try {
        const worker = await initStockfish();
        
        return new Promise((resolve) => {
            const depth = 8 + (level - 6) * 3; // Level 6=8, 7=11, 8=14, 9=17, 10=20
            const skillLevel = 10 + (level - 6) * 2; // 10-18 skill
            
            const handleMessage = (event: MessageEvent) => {
                const message = String(event.data);
                
                if (message.startsWith('bestmove')) {
                    worker.removeEventListener('message', handleMessage);
                    
                    const uciMove = message.split(' ')[1];
                    if (!uciMove || uciMove === '(none)') {
                        resolve(null);
                        return;
                    }
                    
                    // Convert UCI move to chess.js Move
                    const from = uciMove.substring(0, 2) as Move['from'];
                    const to = uciMove.substring(2, 4) as Move['to'];
                    const promotion = uciMove.length > 4 ? uciMove[4] : undefined;
                    
                    try {
                        const gameClone = new Chess(game.fen());
                        const move = gameClone.move({ from, to, promotion });
                        resolve(move);
                    } catch {
                        resolve(null);
                    }
                }
            };
            
            worker.addEventListener('message', handleMessage);
            
            // Configure Stockfish
            worker.postMessage(`setoption name Skill Level value ${skillLevel}`);
            worker.postMessage(`position fen ${game.fen()}`);
            worker.postMessage(`go depth ${depth}`);
            
            // Timeout fallback
            setTimeout(() => {
                worker.removeEventListener('message', handleMessage);
                resolve(null);
            }, 5000);
        });
    } catch (error) {
        console.error('Stockfish error:', error);
        return null;
    }
}

export const getBestMove = async (game: Chess, difficultyLevel: number = 1): Promise<Move | null | string> => {
    // CLONE THE GAME to avoid polluting the actual game state validation
    const gameClone = new Chess(game.fen());

    const possibleMoves = gameClone.moves({ verbose: true });
    if (possibleMoves.length === 0) return null;

    // --- LEVELS 6-10: STOCKFISH ---
    if (difficultyLevel >= 6) {
        const stockfishMove = await getStockfishMove(game, difficultyLevel);
        if (stockfishMove) return stockfishMove;
        // Fallback to minimax if Stockfish fails
        console.warn('Stockfish failed, falling back to minimax');
    }

    // --- LEVEL 1: BEGINNER (Random) ---
    if (difficultyLevel <= 1) {
        return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }

    // --- LEVEL 2: EASY (Greedy Captures) ---
    if (difficultyLevel === 2) {
        const captures = possibleMoves.filter(m => m.captured);
        if (captures.length > 0) {
            return captures[Math.floor(Math.random() * captures.length)];
        }
        return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }

    // --- LEVEL 3-5 or STOCKFISH FALLBACK: MINIMAX with Iterative Deepening ---
    // For levels 6-10 fallback, use deeper search
    const TIME_LIMIT = difficultyLevel >= 6 ? 2000 : 800; // More time for higher levels
    const endTime = Date.now() + TIME_LIMIT;

    // Target Depths - enhanced for Stockfish fallback
    let maxDepth = 2;
    if (difficultyLevel === 4) maxDepth = 3;
    if (difficultyLevel === 5) maxDepth = 4;
    if (difficultyLevel === 6) maxDepth = 4;  // Stockfish fallback depths
    if (difficultyLevel === 7) maxDepth = 5;
    if (difficultyLevel === 8) maxDepth = 5;
    if (difficultyLevel === 9) maxDepth = 6;
    if (difficultyLevel === 10) maxDepth = 6;

    // Who is AI? (Assuming AI moved so it's their turn)
    const isMaximizing = gameClone.turn() === 'w'; // White wants +score

    // Randomize top-level moves for variety
    const shuffleArray = (array: Move[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };
    const shuffledMoves = shuffleArray([...possibleMoves]);

    let bestMove = shuffledMoves[0]; // Default fallback
    // If we have some heuristic sort for top level, apply it here

    // Iterative Deepening Loop
    try {
        for (let d = 1; d <= maxDepth; d++) {
            let currentDownloadBestMove: Move | null = null;
            let currentDownloadBestValue = isMaximizing ? -Infinity : Infinity;

            // Search at depth 'd'
            // We reuse shuffledMoves order, but ideally we should sort them based on PREVIOUS iteration's scores (PV).
            // For simplicity, we just search.

            for (const move of shuffledMoves) {
                gameClone.move(move);

                // Check time before diving?
                if (Date.now() > endTime) {
                    gameClone.undo();
                    throw new Error('Timeout');
                }

                const boardValue = minimax(gameClone, d - 1, -Infinity, Infinity, !isMaximizing, endTime);
                gameClone.undo();

                if (isMaximizing) {
                    if (boardValue > currentDownloadBestValue) {
                        currentDownloadBestValue = boardValue;
                        currentDownloadBestMove = move;
                    }
                } else {
                    if (boardValue < currentDownloadBestValue) {
                        currentDownloadBestValue = boardValue;
                        currentDownloadBestMove = move;
                    }
                }
            }

            // Completed depth 'd' fully without timeout
            if (currentDownloadBestMove) {
                bestMove = currentDownloadBestMove;
            }
        }
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'Timeout') {
            console.log("AI Time limit reached. Returning best move from last completed depth.");
        } else {
            throw err;
        }
    }

    return bestMove;
};
