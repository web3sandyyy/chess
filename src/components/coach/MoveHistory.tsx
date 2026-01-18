import { useChessStore } from '../../store/chessStore';
import { History, AlertTriangle, CheckCircle, Circle } from 'lucide-react';

export function MoveHistory() {
  const { game, evaluation } = useChessStore();
  const history = game.history({ verbose: true });

  // Group moves into pairs (white, black)
  const movePairs: Array<{ number: number; white?: typeof history[0]; black?: typeof history[0] }> = [];
  
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1]
    });
  }

  const getMoveStyle = (move: typeof history[0] | undefined) => {
    if (!move) return '';
    
    // Highlight captures
    if (move.captured) {
      return 'text-orange-400';
    }
    // Highlight checks
    if (move.san.includes('+')) {
      return 'text-red-400 font-semibold';
    }
    // Highlight checkmates
    if (move.san.includes('#')) {
      return 'text-red-500 font-bold';
    }
    // Highlight promotions
    if (move.promotion) {
      return 'text-purple-400';
    }
    return 'text-slate-200';
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/80">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-slate-400" />
          <span className="font-medium text-white text-sm">Move History</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${
            evaluation > 50 ? 'text-green-400' :
            evaluation < -50 ? 'text-red-400' :
            'text-slate-400'
          }`}>
            {evaluation > 0 ? '+' : ''}{(evaluation / 100).toFixed(1)}
          </span>
        </div>
      </div>

      {/* Move List */}
      <div className="max-h-[200px] overflow-y-auto p-2">
        {movePairs.length === 0 ? (
          <div className="text-center py-4 text-slate-500 text-sm">
            No moves yet
          </div>
        ) : (
          <div className="space-y-0.5">
            {movePairs.map((pair) => (
              <div
                key={pair.number}
                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-700/30 group"
              >
                <span className="w-6 text-xs text-slate-500 font-mono">
                  {pair.number}.
                </span>
                <span className={`flex-1 font-mono text-sm ${getMoveStyle(pair.white)}`}>
                  {pair.white?.san || '...'}
                </span>
                <span className={`flex-1 font-mono text-sm ${getMoveStyle(pair.black)}`}>
                  {pair.black?.san || ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-t border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Circle className="w-2 h-2 fill-orange-400 text-orange-400" />
            <span>Capture</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="w-2 h-2 text-red-400" />
            <span>Check</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-2 h-2 text-purple-400" />
            <span>Promotion</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MoveHistory;
