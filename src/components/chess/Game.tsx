import { useState, useCallback, useMemo, useEffect } from "react";
import { useChess } from "../../hooks/useChess";
import Board from "./Board";
import { PieceIcons } from "./PieceIcons";
import type { Square } from "chess.js";
import CustomDragLayer from "./CustomDragLayer";

function Game() {
  const {
    game,
    fen,
    turn,
    isGameOver,
    result,
    makeMove,
    undo,
    resetGame,
    getValidMoves,
  } = useChess();
  const [_selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    null,
  );

  const [gameMode, setGameMode] = useState<"PvC" | "PvP" | null>(null); // Null means menu open
  const [difficulty, setDifficulty] = useState(1); // 1-5
  const [difficultySelect, setDifficultySelect] = useState(false); // Show difficulty select screen
  const [colorSelect, setColorSelect] = useState(false); // Show color select screen
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w"); // Player is White
  const [showModal, setShowModal] = useState(true);

  // Reset modal visibility when game over changes
  useEffect(() => {
    if (isGameOver) setShowModal(true);
  }, [isGameOver]);

  const handleModalClose = () => setShowModal(false);

  const onDrop = useCallback(
    (sourceSquare: string, targetSquare: string) => {
      // Prevent move if computer's turn
      if (gameMode === "PvC" && turn !== playerColor) return;

      // @ts-expect-error - sourceSquare/targetSquare strings are valid for useChess but TS thinks they need to be squares or something else
      const move = makeMove(sourceSquare, targetSquare);
      if (move) {
        setLastMove({ from: sourceSquare, to: targetSquare });
        setValidMoves([]);
        setSelectedSquare(null);
      }
    },
    [makeMove, gameMode, turn, playerColor],
  );

  // UseUndo
  const handleUndo = () => {
    if (gameMode === "PvC") {
      // Undo twice if computer mode (player move + computer move)
      undo();
    } else {
      undo();
    }
    setLastMove(null);
  };

  const onDragStart = useCallback(
    (square: Square) => {
      const moves = getValidMoves(square);
      // moves is array of objects { to: 'e4', ... }
      setValidMoves(moves.map((m) => m.to));
      setSelectedSquare(square);
    },
    [getValidMoves],
  );

  const onDragEnd = useCallback(() => {
    setValidMoves([]);
  }, []);

  // Check detection
  const checkedSquare = useMemo(() => {
    if (game.inCheck()) {
      // Find King of current turn
      const board = game.board();
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const piece = board[r][c];
          if (piece && piece.type === "k" && piece.color === turn) {
            const file = String.fromCharCode("a".charCodeAt(0) + c);
            const rank = 8 - r;
            return `${file}${rank}`;
          }
        }
      }
    }
    return null;
  }, [game, fen, turn]);

  // AI Turn Effect
  useEffect(() => {
    if (gameMode === "PvC" && turn !== playerColor && !isGameOver) {
      const timer = setTimeout(() => {
        import("../../lib/chess/engine").then(({ getBestMove }) => {
          const aiMove = getBestMove(game, difficulty);
          if (aiMove) {
            // @ts-expect-error - aiMove is Move object or string, makeMove handles both but types might mismatch slightly
            const executedMove = makeMove(aiMove);
            if (executedMove) {
              setLastMove({ from: executedMove.from, to: executedMove.to });
            }
          }
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [turn, gameMode, playerColor, isGameOver, game, makeMove, difficulty]);

  // Move History and Captures (Hooks must be unconditional)
  const { capturedWhite, capturedBlack } = useMemo(() => {
    const history = game.history({ verbose: true });
    const capturedW: string[] = []; // Pieces lost by White (captured by Black)
    const capturedB: string[] = []; // Pieces lost by Black (captured by White)

    history.forEach((move) => {
      if (move.captured) {
        if (move.color === "w") {
          capturedB.push(move.captured);
        } else {
          capturedW.push(move.captured);
        }
      }
    });

    return { capturedWhite: capturedW, capturedBlack: capturedB };
  }, [game, fen]);

  // Move history for display
  const moveHistory = game.history();

  // Handle Game Reset (Back to Menu or Restart)
  const handleReset = () => {
    resetGame();
    setLastMove(null);
    setValidMoves([]);
  };

  const handleBackToMenu = () => {
    handleReset();
    setGameMode(null);
    setDifficultySelect(false);
    setColorSelect(false);
  };

  const handleModeSelect = (mode: "PvC" | "PvP") => {
    if (mode === "PvC") {
      setDifficultySelect(true);
    } else {
      setGameMode("PvP");
      setPlayerColor("w");
    }
  };

  const handleDifficultySelect = (level: number) => {
    setDifficulty(level);
    setDifficultySelect(false);
    setColorSelect(true);
  };

  const startGame = (color: "w" | "b") => {
    setPlayerColor(color);
    setColorSelect(false);
    setGameMode("PvC");
  };

  // DIFFICULTY DATA
  const levels = [
    { level: 1, name: "Beginner", stars: "⭐" },
    { level: 2, name: "Intermediate", stars: "⭐⭐" },
    { level: 3, name: "Advanced", stars: "⭐⭐⭐" },
    { level: 4, name: "Expert", stars: "⭐⭐⭐⭐" },
    { level: 5, name: "Master", stars: "⭐⭐⭐⭐⭐" },
  ];

  // START SCREEN logic
  // ... we will return different layouts based on state
  if (!gameMode) {
    if (difficultySelect) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white p-4">
          <h1 className="text-4xl font-bold mb-8">Select Difficulty</h1>
          <div className="flex flex-col gap-4 w-full max-w-md">
            {levels.map((lvl) => (
              <button
                key={lvl.level}
                onClick={() => handleDifficultySelect(lvl.level)}
                className="flex justify-between items-center p-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-700 font-medium"
              >
                <span className="text-lg">{lvl.name}</span>
                <span className="text-yellow-400">{lvl.stars}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setDifficultySelect(false)}
            className="mt-8 px-8 py-2 border border-neutral-600 rounded  hover:bg-neutral-800 transition"
          >
            Back
          </button>
        </div>
      );
    }

    if (colorSelect) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white p-4">
          <h1 className="text-4xl font-bold mb-8">Choose Side</h1>
          <div className="flex gap-6">
            <button
              onClick={() => startGame("w")}
              className="flex flex-col items-center justify-center p-8 bg-neutral-200 text-black rounded-xl hover:scale-105 transition active:scale-95 w-40 h-40"
            >
              <span className="text-6xl mb-2">♔</span>
              <span className="font-bold">White</span>
            </button>
            <button
              onClick={() => startGame("b")}
              className="flex flex-col items-center justify-center p-8 bg-neutral-800 text-white border border-neutral-600 rounded-xl hover:scale-105 transition active:scale-95 w-40 h-40"
            >
              <span className="text-6xl mb-2">♚</span>
              <span className="font-bold">Black</span>
            </button>
          </div>
          <button
            onClick={() => {
              setColorSelect(false);
              setDifficultySelect(true);
            }}
            className="mt-8 px-8 py-2 border border-neutral-600 rounded text-neutral-400 hover:bg-neutral-800 transition"
          >
            Back
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-neutral-900 to-black text-white p-4">
        <h1 className="text-6xl font-extrabold mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">
          CHESS MASTER
        </h1>
        <p className="text-neutral-400 mb-12 text-lg">Select Game Mode</p>
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl justify-center">
          <button
            onClick={() => handleModeSelect("PvC")}
            className="flex-1 p-8 bg-blue-600 rounded-xl hover:bg-blue-700 transition transform hover:-translate-y-1 shadow-lg shadow-blue-500/20 text-center font-bold text-xl flex flex-col items-center"
          >
            <span className="text-4xl mb-4">🤖</span>
            Play vs Computer
          </button>
          <button
            onClick={() => handleModeSelect("PvP")}
            className="flex-1 p-8 bg-purple-600 rounded-xl hover:bg-purple-700 transition transform hover:-translate-y-1 shadow-lg shadow-purple-500/20 text-center font-bold text-xl flex flex-col items-center"
          >
            <span className="text-4xl mb-4">👥</span>
            Play vs Friend
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col items-center p-4">
      <CustomDragLayer />

      {/* 1. Header Control Bar (Top) */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-6 p-4 bg-white dark:bg-neutral-900 rounded-lg shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={handleBackToMenu}
            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 rounded hover:opacity-80 transition font-medium text-sm"
          >
            Main Menu
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 rounded hover:opacity-80 transition font-medium text-sm"
          >
            Restart
          </button>
          <button
            onClick={handleUndo}
            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 rounded hover:opacity-80 transition font-medium text-sm"
          >
            Undo ↩️
          </button>
        </div>
        <div className="text-xl font-bold">
          {gameMode === "PvC" ? `Vs Computer (Lvl ${difficulty})` : "PvP"}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start w-full max-w-6xl">
        {/* Board Section */}
        <div className="flex-1 flex flex-col gap-4 items-center w-full">
          {/* Opponent Strip */}
          <PlayerStrip
            name={gameMode === "PvC" ? "Computer" : "Opponent"}
            isThinking={turn === (playerColor === "w" ? "b" : "w")}
            avatar="👤"
            capturedPieces={playerColor === "w" ? capturedWhite : capturedBlack}
            playerColor={playerColor} // Pieces shown are opponent's "captured stack" -> Actually here we show what they captured? No, what they lost?
            // Original logic: "capturedWhite" = Pieces lost by White.
            // If I am White, "capturedWhite" is what I lost. So it sits on Opponent's side.
            // Opponent side should show what I lost (capturedWhite).
            // wait, previous code: "(playerColor === 'w' ? capturedWhite : capturedBlack)"
            // Yes.
          />

          {/* Board Area */}
          <div className="w-full h-auto flex justify-center">
            <Board
              game={game}
              onMove={onDrop}
              validMoves={validMoves}
              lastMove={lastMove}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              checkedSquare={checkedSquare}
              orientation={playerColor === "w" ? "white" : "black"}
            />
          </div>

          {/* Player Strip (Me) */}
          <PlayerStrip
            name="You"
            isThinking={turn === playerColor}
            avatar="😎"
            capturedPieces={playerColor === "w" ? capturedBlack : capturedWhite}
            playerColor={playerColor === "w" ? "b" : "w"} // Show pieces belonging to opponent (that I captured)
          />
        </div>

        {/* Sidebar Info */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col items-center">
            <div
              className={`text-2xl font-bold mb-2 ${turn === "w" ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400"}`}
            >
              {isGameOver ? (
                <span className="text-red-500">{result}</span>
              ) : (
                <>
                  <span>{turn === "w" ? "White" : "Black"}</span> to move
                </>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 h-[500px] overflow-hidden flex flex-col">
            <h3 className="font-bold border-b border-neutral-200 dark:border-neutral-700 pb-2 mb-2">
              Move History
            </h3>
            <div className="overflow-y-auto flex-1 font-mono text-sm leading-6">
              {moveHistory.map((move, index) =>
                index % 2 === 0 ? (
                  <div
                    key={index}
                    className="flex border-b border-neutral-100 dark:border-neutral-800 py-1"
                  >
                    <span className="w-8 text-neutral-400">
                      {Math.floor(index / 2) + 1}.
                    </span>
                    <span className="w-16 font-medium">{move}</span>
                    {moveHistory[index + 1] && (
                      <span className="w-16 text-neutral-600 dark:text-neutral-400">
                        {moveHistory[index + 1]}
                      </span>
                    )}
                  </div>
                ) : null,
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
            <h2 className="text-2xl font-extrabold mb-4">Game Over</h2>
            <p className="text-lg mb-8">{result}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleReset}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition"
              >
                Play Again
              </button>
              <button
                onClick={handleModalClose}
                className="w-full py-3 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent for Player Strip
function PlayerStrip({
  name,
  isThinking,
  avatar,
  capturedPieces,
  playerColor,
}: any) {
  return (
    <div className="w-full bg-white dark:bg-neutral-900 p-4 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="text-3xl bg-neutral-100 dark:bg-neutral-800 w-12 h-12 flex items-center justify-center rounded-full">
          {avatar}
        </div>
        <div>
          <div className="font-bold flex items-center gap-2">
            {name}
            {isThinking && (
              <span className="text-xs text-blue-500 animate-pulse">
                Thinking...
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex -space-x-4 h-8">
        {capturedPieces.map((p: string, i: number) => {
          // Logic issue in original code handled here: if I'm white, I want to show pieces I captured (Black pieces).
          // In the usage above: `playerColor` for 'You' is calculated as `playerColor === 'w' ? 'b' : 'w'`.
          // So we just use `playerColor` prop to decide icon color directly.
          // But wait, PieceIcons map expects 'w' or 'b'.
          // If `playerColor` prop passed is 'b', we use 'b'.
          // Let's ensure strict typing later, for now 'w' | 'b'
          const safeColor = playerColor === "w" ? "w" : "b";
          const Icon = PieceIcons[safeColor][p];
          return (
            <div
              key={i}
              className="w-8 h-8 relative transition-transform hover:-translate-y-1"
            >
              <Icon style={{ width: "100%", height: "100%" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Game;
