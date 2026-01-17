import { useState, useCallback, useMemo, useEffect } from "react";
import { useChess } from "../../hooks/useChess";
import Board from "./Board";
import { PieceIcons } from "./PieceIcons";
import type { Square } from "chess.js";
import CustomDragLayer from "./CustomDragLayer";
import {
  Crown,
  RotateCcw,
  Home,
  ChevronLeft,
  Cpu,
  Users,
  Swords,
  Clock,
  Trophy,
  Zap,
} from "lucide-react";

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

  const [gameMode, setGameMode] = useState<"PvC" | "PvP" | null>(null);
  const [difficulty, setDifficulty] = useState(1);
  const [difficultySelect, setDifficultySelect] = useState(false);
  const [colorSelect, setColorSelect] = useState(false);
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const [showModal, setShowModal] = useState(true);

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
      console.log(
        "AI Turn triggered - turn:",
        turn,
        "playerColor:",
        playerColor,
      );
      const timer = setTimeout(() => {
        import("../../lib/chess/engine")
          .then(({ getBestMove }) => {
            console.log("Engine loaded, computing best move...");
            const aiMove = getBestMove(game, difficulty);
            console.log("AI move computed:", aiMove);
            if (
              aiMove &&
              typeof aiMove === "object" &&
              "from" in aiMove &&
              "to" in aiMove
            ) {
              // Pass from/to separately since makeMove expects that format
              const executedMove = makeMove(
                aiMove.from,
                aiMove.to,
                aiMove.promotion || "q",
              );
              console.log("Executed move:", executedMove);
              if (executedMove) {
                setLastMove({ from: executedMove.from, to: executedMove.to });
              }
            }
          })
          .catch((err) => console.error("Engine import error:", err));
      }, 150); // Quick response - just enough delay to feel natural
      return () => clearTimeout(timer);
    }
  }, [
    fen,
    turn,
    gameMode,
    playerColor,
    isGameOver,
    game,
    makeMove,
    difficulty,
  ]); // Added 'fen' to trigger on board changes

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
    {
      level: 1,
      name: "Beginner",
      description: "Random moves",
      icon: "🌱",
      color: "from-green-500 to-emerald-600",
    },
    {
      level: 2,
      name: "Casual",
      description: "Basic captures",
      icon: "🎯",
      color: "from-blue-500 to-cyan-600",
    },
    {
      level: 3,
      name: "Intermediate",
      description: "2-move lookahead",
      icon: "🧠",
      color: "from-purple-500 to-violet-600",
    },
    {
      level: 4,
      name: "Advanced",
      description: "3-move lookahead",
      icon: "⚔️",
      color: "from-orange-500 to-amber-600",
    },
    {
      level: 5,
      name: "Master",
      description: "4-move lookahead",
      icon: "👑",
      color: "from-red-500 to-rose-600",
    },
  ];

  // START SCREEN logic
  if (!gameMode) {
    if (difficultySelect) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 w-full max-w-lg">
            <button
              onClick={() => setDifficultySelect(false)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </button>

            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 mb-4 shadow-lg shadow-purple-500/25">
                <Cpu className="w-8 h-8" />
              </div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Choose Difficulty
              </h1>
              <p className="text-slate-400">Select your opponent's strength</p>
            </div>

            <div className="flex flex-col gap-3">
              {levels.map((lvl) => (
                <button
                  key={lvl.level}
                  onClick={() => handleDifficultySelect(lvl.level)}
                  className="group relative flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
                >
                  <div
                    className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${lvl.color} text-2xl shadow-lg`}
                  >
                    {lvl.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-lg">{lvl.name}</div>
                    <div className="text-sm text-slate-400">
                      {lvl.description}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${i < lvl.level ? "bg-amber-400" : "bg-slate-700"}`}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (colorSelect) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-slate-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 w-full max-w-lg">
            <button
              onClick={() => {
                setColorSelect(false);
                setDifficultySelect(true);
              }}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </button>

            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-4 shadow-lg shadow-amber-500/25">
                <Crown className="w-8 h-8" />
              </div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                Choose Your Side
              </h1>
              <p className="text-slate-400">White moves first</p>
            </div>

            <div className="flex gap-6 justify-center">
              <button
                onClick={() => startGame("w")}
                className="group relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-100 to-slate-200 text-slate-900 rounded-3xl hover:scale-105 transition-all duration-300 w-44 h-52 shadow-xl hover:shadow-2xl"
              >
                <div className="absolute inset-0 rounded-3xl bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-7xl mb-4 drop-shadow-lg relative z-10">
                  ♔
                </span>
                <span className="font-bold text-xl relative z-10">White</span>
                <span className="text-sm text-slate-600 relative z-10">
                  Move First
                </span>
              </button>
              <button
                onClick={() => startGame("b")}
                className="group relative flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-800 to-slate-900 text-white border border-slate-700 rounded-3xl hover:scale-105 transition-all duration-300 w-44 h-52 shadow-xl hover:shadow-2xl"
              >
                <div className="absolute inset-0 rounded-3xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-7xl mb-4 drop-shadow-lg relative z-10">
                  ♚
                </span>
                <span className="font-bold text-xl relative z-10">Black</span>
                <span className="text-sm text-slate-400 relative z-10">
                  Respond
                </span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Main Menu
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-amber-500/5 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Chess board pattern decoration */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="grid grid-cols-8 h-full">
            {[...Array(64)].map((_, i) => (
              <div
                key={i}
                className={`aspect-square ${(Math.floor(i / 8) + i) % 2 === 0 ? "bg-white" : ""}`}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo */}
          <div className="relative mb-4">
            <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 opacity-30" />
            <div className="relative flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Crown className="w-9 h-9 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-6xl sm:text-7xl font-black mb-3 tracking-tight">
            <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              CHESS
            </span>
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              MASTER
            </span>
          </h1>
          <p className="text-slate-400 mb-12 text-lg tracking-wide">
            The Ultimate Chess Experience
          </p>

          <div className="flex flex-col sm:flex-row gap-5 w-full max-w-xl">
            <button
              onClick={() => handleModeSelect("PvC")}
              className="group flex-1 relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600" />
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-8 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Cpu className="w-8 h-8" />
                </div>
                <span className="font-bold text-xl mb-1">vs Computer</span>
                <span className="text-blue-100 text-sm">Challenge the AI</span>
              </div>
            </button>

            <button
              onClick={() => handleModeSelect("PvP")}
              className="group flex-1 relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-600" />
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-8 flex flex-col items-center">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8" />
                </div>
                <span className="font-bold text-xl mb-1">vs Friend</span>
                <span className="text-purple-100 text-sm">
                  Local Multiplayer
                </span>
              </div>
            </button>
          </div>

          {/* Footer features */}
          <div className="flex gap-8 mt-16 text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Smart AI</span>
            </div>
            <div className="flex items-center gap-2">
              <Swords className="w-4 h-4 text-blue-500" />
              <span>5 Difficulty Levels</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-purple-500" />
              <span>Track Progress</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col">
      <CustomDragLayer />

      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToMenu}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 transition-all text-sm font-medium group"
            >
              <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Menu</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 transition-all text-sm font-medium group"
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-[-90deg] transition-transform" />
              <span className="hidden sm:inline">Restart</span>
            </button>
            <button
              onClick={handleUndo}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 transition-all text-sm font-medium group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Undo</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-slate-800/80 to-slate-800/40 border border-slate-700/50">
              {gameMode === "PvC" ? (
                <>
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium">
                    Level {difficulty}
                  </span>
                  <div className="flex gap-0.5 ml-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${i < difficulty ? "bg-amber-400" : "bg-slate-700"}`}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium">Local Match</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {/* Left Panel - Board Section */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* Opponent Strip */}
          <PlayerStrip
            name={gameMode === "PvC" ? "Computer" : "Opponent"}
            isThinking={
              gameMode === "PvC" && turn !== playerColor && !isGameOver
            }
            avatar={
              gameMode === "PvC" ? (
                <Cpu className="w-5 h-5" />
              ) : (
                <Users className="w-5 h-5" />
              )
            }
            capturedPieces={playerColor === "w" ? capturedWhite : capturedBlack}
            playerColor={playerColor}
            isActive={turn !== playerColor}
            variant="opponent"
          />

          {/* Board */}
          <div className="flex justify-center">
            <div className="w-full max-w-[min(85vh,600px)]">
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
          </div>

          {/* Player Strip */}
          <PlayerStrip
            name="You"
            isThinking={false}
            avatar="👤"
            capturedPieces={playerColor === "w" ? capturedBlack : capturedWhite}
            playerColor={playerColor === "w" ? "b" : "w"}
            isActive={turn === playerColor}
            variant="player"
          />
        </div>

        {/* Right Panel - Info Sidebar */}
        <aside className="w-full lg:w-80 flex flex-col gap-4">
          {/* Turn Indicator */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl p-6 text-center">
            {isGameOver ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div className="text-xl font-bold text-amber-400">{result}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                    turn === "w"
                      ? "bg-gradient-to-br from-slate-100 to-slate-300 shadow-slate-400/20"
                      : "bg-gradient-to-br from-slate-700 to-slate-900 shadow-slate-500/20 border border-slate-600"
                  }`}
                >
                  <span className="text-3xl">{turn === "w" ? "♔" : "♚"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${turn === playerColor ? "bg-green-400 animate-pulse" : "bg-slate-600"}`}
                  />
                  <span className="text-lg font-semibold">
                    {turn === "w" ? "White" : "Black"} to move
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Move History */}
          <div className="flex-1 bg-slate-900/50 backdrop-blur border border-slate-800/50 rounded-2xl overflow-hidden flex flex-col min-h-[300px] lg:min-h-0">
            <div className="px-5 py-4 border-b border-slate-800/50 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold">Move History</h3>
              <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
                {moveHistory.length} moves
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {moveHistory.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                  No moves yet
                </div>
              ) : (
                <div className="space-y-1">
                  {moveHistory.map((move, index) =>
                    index % 2 === 0 ? (
                      <div
                        key={index}
                        className="flex items-center py-2 px-3 rounded-lg hover:bg-slate-800/50 transition-colors group"
                      >
                        <span className="w-8 text-slate-500 text-sm font-mono">
                          {Math.floor(index / 2) + 1}.
                        </span>
                        <span className="w-16 font-mono font-medium">
                          {move}
                        </span>
                        {moveHistory[index + 1] && (
                          <span className="w-16 font-mono text-slate-400">
                            {moveHistory[index + 1]}
                          </span>
                        )}
                      </div>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* Game Over Modal */}
      {isGameOver && showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 fade-in duration-300">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Game Over</h2>
            <p className="text-xl text-amber-400 font-semibold mb-8">
              {result}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleReset}
                className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-xl font-bold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/25"
              >
                Play Again
              </button>
              <button
                onClick={handleBackToMenu}
                className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-medium transition-all"
              >
                Main Menu
              </button>
              <button
                onClick={handleModalClose}
                className="w-full py-3 text-slate-400 hover:text-white transition-colors text-sm"
              >
                Continue Viewing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Premium Player Strip Component
function PlayerStrip({
  name,
  isThinking,
  avatar,
  capturedPieces,
  playerColor,
  isActive,
  variant,
}: {
  name: string;
  isThinking: boolean;
  avatar: React.ReactNode;
  capturedPieces: string[];
  playerColor: string;
  isActive: boolean;
  variant: "player" | "opponent";
}) {
  return (
    <div
      className={`w-full bg-slate-900/50 backdrop-blur border rounded-2xl p-4 transition-all duration-300 ${
        isActive
          ? "border-blue-500/50 shadow-lg shadow-blue-500/10"
          : "border-slate-800/50"
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all duration-300 ${
              isActive
                ? variant === "player"
                  ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25"
                  : "bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/25"
                : "bg-slate-800"
            }`}
          >
            {typeof avatar === "string" ? avatar : avatar}
          </div>
          <div>
            <div className="font-semibold flex items-center gap-2">
              {name}
              {isThinking && (
                <span className="flex items-center gap-1.5 text-xs text-blue-400">
                  <span className="flex gap-0.5">
                    <span
                      className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </span>
                  Thinking
                </span>
              )}
            </div>
            {isActive && !isThinking && (
              <span className="text-xs text-green-400">Your turn</span>
            )}
          </div>
        </div>

        {/* Captured Pieces */}
        <div className="flex items-center gap-1">
          {capturedPieces.length === 0 ? (
            <span className="text-xs text-slate-600">No captures</span>
          ) : (
            <div className="flex -space-x-2">
              {capturedPieces.slice(0, 8).map((p: string, i: number) => {
                const safeColor = playerColor === "w" ? "w" : "b";
                const Icon = PieceIcons[safeColor][p];
                return (
                  <div
                    key={i}
                    className="w-7 h-7 relative transition-transform hover:scale-110 hover:z-10"
                  >
                    <Icon style={{ width: "100%", height: "100%" }} />
                  </div>
                );
              })}
              {capturedPieces.length > 8 && (
                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold">
                  +{capturedPieces.length - 8}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Game;
