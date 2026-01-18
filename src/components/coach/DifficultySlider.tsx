import { useChessStore } from '../../store/chessStore';
import { Cpu, User, Zap } from 'lucide-react';

const difficultyLabels: Record<number, { name: string; description: string }> = {
  1: { name: 'Beginner', description: 'Random moves' },
  2: { name: 'Easy', description: 'Captures pieces' },
  3: { name: 'Casual', description: 'Basic strategy' },
  4: { name: 'Intermediate', description: 'Thinks ahead' },
  5: { name: 'Advanced', description: 'Strong tactics' },
  6: { name: 'Expert', description: 'Stockfish Lvl 1' },
  7: { name: 'Master', description: 'Stockfish Lvl 2' },
  8: { name: 'Grandmaster', description: 'Stockfish Lvl 3' },
  9: { name: 'Super GM', description: 'Stockfish Lvl 4' },
  10: { name: 'Maximum', description: 'Full Stockfish' }
};

export function DifficultySlider() {
  const { difficulty, setDifficulty } = useChessStore();
  const currentLevel = difficultyLabels[difficulty];

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          <span className="font-medium text-white text-sm">AI Difficulty</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            difficulty <= 2 ? 'bg-green-500/20 text-green-400' :
            difficulty <= 5 ? 'bg-yellow-500/20 text-yellow-400' :
            difficulty <= 8 ? 'bg-orange-500/20 text-orange-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {currentLevel.name}
          </span>
        </div>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min="1"
          max="10"
          value={difficulty}
          onChange={(e) => setDifficulty(parseInt(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          style={{
            background: `linear-gradient(to right, 
              rgb(99, 102, 241) 0%, 
              rgb(99, 102, 241) ${(difficulty - 1) * 11.11}%, 
              rgb(51, 65, 85) ${(difficulty - 1) * 11.11}%, 
              rgb(51, 65, 85) 100%)`
          }}
        />
        
        {/* Level markers */}
        <div className="flex justify-between mt-1 px-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
            <div
              key={level}
              className={`w-1 h-1 rounded-full ${
                level <= difficulty ? 'bg-indigo-400' : 'bg-slate-600'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="flex items-center justify-between mt-3 text-xs">
        <div className="flex items-center gap-1 text-slate-400">
          <User className="w-3 h-3" />
          <span>Beginner</span>
        </div>
        <div className="text-slate-300">{currentLevel.description}</div>
        <div className="flex items-center gap-1 text-slate-400">
          <Zap className="w-3 h-3" />
          <span>Maximum</span>
        </div>
      </div>

      {/* Engine indicator */}
      {difficulty >= 6 && (
        <div className="mt-3 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-xs text-indigo-300">
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            <span>Stockfish engine active (depth {8 + (difficulty - 6) * 3})</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default DifficultySlider;
