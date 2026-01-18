import { useState, useMemo } from 'react';
import { useChessStore } from '../../store/chessStore';
import { getPopularOpenings, searchOpenings, type Opening } from '../../lib/chess/openingDetector';
import { 
  BookOpen, 
  ChevronRight, 
  Search,
  Star,
  Info
} from 'lucide-react';

export function OpeningSidebar() {
  const { openingName, openingEco } = useChessStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOpening, setExpandedOpening] = useState<string | null>(null);

  const popularOpenings = useMemo(() => getPopularOpenings(), []);
  
  const filteredOpenings = useMemo(() => {
    if (!searchQuery.trim()) return popularOpenings;
    return searchOpenings(searchQuery);
  }, [searchQuery, popularOpenings]);

  const toggleOpening = (name: string) => {
    setExpandedOpening(expandedOpening === name ? null : name);
  };

  return (
    <div className="flex flex-col h-full bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/80">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Opening Explorer</h3>
            <p className="text-xs text-slate-400">Learn popular openings</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search openings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
          />
        </div>
      </div>

      {/* Current Opening Badge */}
      {openingName && (
        <div className="px-4 py-3 border-b border-slate-700/50 bg-indigo-500/10">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-slate-400">Current Opening:</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-xs font-mono rounded">
              {openingEco}
            </span>
            <span className="text-sm font-medium text-white truncate">
              {openingName}
            </span>
          </div>
        </div>
      )}

      {/* Opening List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {filteredOpenings.map((opening) => (
            <OpeningCard
              key={opening.name}
              opening={opening}
              isExpanded={expandedOpening === opening.name}
              isCurrent={opening.name === openingName}
              onToggle={() => toggleOpening(opening.name)}
            />
          ))}

          {filteredOpenings.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-sm">
              No openings found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>100+ openings in database</span>
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            Click to expand
          </span>
        </div>
      </div>
    </div>
  );
}

interface OpeningCardProps {
  opening: Opening;
  isExpanded: boolean;
  isCurrent: boolean;
  onToggle: () => void;
}

function OpeningCard({ opening, isExpanded, isCurrent, onToggle }: OpeningCardProps) {
  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        isCurrent
          ? 'border-indigo-500/50 bg-indigo-500/10'
          : 'border-slate-700/50 bg-slate-700/20 hover:bg-slate-700/40'
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        <span className="px-2 py-0.5 bg-slate-600/50 text-slate-300 text-xs font-mono rounded shrink-0">
          {opening.eco}
        </span>
        <span className="flex-1 text-sm font-medium text-white truncate">
          {opening.name}
        </span>
        <ChevronRight
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
            isExpanded ? 'rotate-90' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0 space-y-2 border-t border-slate-700/30 mt-0">
          <p className="text-xs text-slate-300 leading-relaxed pt-2">
            {opening.description}
          </p>
          
          {opening.moves.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {opening.moves.map((move, i) => (
                <span
                  key={i}
                  className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                    i % 2 === 0
                      ? 'bg-slate-600/50 text-slate-200'
                      : 'bg-slate-700/50 text-slate-300'
                  }`}
                >
                  {i % 2 === 0 && <span className="text-slate-500 mr-1">{Math.floor(i/2) + 1}.</span>}
                  {move}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OpeningSidebar;
