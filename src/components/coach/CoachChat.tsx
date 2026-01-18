import { useState, useEffect, useRef } from 'react';
import { useChessStore } from '../../store/chessStore';
import { useCoach } from '../../hooks/useCoach';
import { 
  MessageCircle, 
  Lightbulb, 
  Loader2, 
  Volume2, 
  VolumeX,
  Sparkles,
  AlertCircle,
  BookOpen,
  HelpCircle,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// Icon mapping for coach message types
const typeIcons = {
  good: <Sparkles className="w-5 h-5 text-green-400" />,
  mistake: <AlertCircle className="w-5 h-5 text-orange-400" />,
  opening: <BookOpen className="w-5 h-5 text-blue-400" />,
  hint: <HelpCircle className="w-5 h-5 text-purple-400" />,
  tip: <TrendingUp className="w-5 h-5 text-cyan-400" />,
  welcome: <MessageCircle className="w-5 h-5 text-indigo-400" />
};

const typeColors = {
  good: 'border-green-500/30 bg-green-500/5',
  mistake: 'border-orange-500/30 bg-orange-500/5',
  opening: 'border-blue-500/30 bg-blue-500/5',
  hint: 'border-purple-500/30 bg-purple-500/5',
  tip: 'border-cyan-500/30 bg-cyan-500/5',
  welcome: 'border-indigo-500/30 bg-indigo-500/5'
};

const typeLabels = {
  good: 'Great Move!',
  mistake: 'Learning Moment',
  opening: 'Opening Detected',
  hint: 'Hint',
  tip: 'Position Tip',
  welcome: 'Coach'
};

export function CoachChat() {
  const { coachMessage, coachHistory, isCoachLoading, isCoachEnabled, toggleCoach } = useChessStore();
  const { requestHint } = useCoach();
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  // Typewriter effect
  useEffect(() => {
    if (!coachMessage?.message) {
      setDisplayedText('');
      return;
    }

    const text = coachMessage.message;
    setDisplayedText('');
    setIsTyping(true);
    
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.substring(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 20); // Speed of typing

    return () => clearInterval(timer);
  }, [coachMessage?.message, coachMessage?.timestamp]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (messageRef.current) {
      messageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayedText]);

  const handleHintClick = async () => {
    if (!isCoachLoading) {
      await requestHint();
    }
  };

  const messageType = coachMessage?.type || 'welcome';

  return (
    <div className="flex flex-col h-full bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">AI Coach</h3>
            <p className="text-xs text-slate-400">Gemini 2.0 Flash</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-slate-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-slate-400" />
            )}
          </button>
          <button
            onClick={toggleCoach}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              isCoachEnabled 
                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {isCoachEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
        {/* History Toggle */}
        {coachHistory.length > 1 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition-colors"
          >
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showHistory ? 'Hide' : 'Show'} history ({coachHistory.length - 1} messages)
          </button>
        )}

        {/* Historical Messages */}
        {showHistory && coachHistory.slice(0, -1).map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-xl border ${typeColors[msg.type || 'welcome']} opacity-60`}
          >
            <div className="flex items-center gap-2 mb-1">
              {typeIcons[msg.type || 'welcome']}
              <span className="text-xs font-medium text-slate-300">
                {typeLabels[msg.type || 'welcome']}
              </span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {msg.message}
            </p>
          </div>
        ))}

        {/* Current Message */}
        {coachMessage && (
          <div
            ref={messageRef}
            className={`p-4 rounded-xl border ${typeColors[messageType]} transition-all duration-300`}
          >
            <div className="flex items-center gap-2 mb-2">
              {typeIcons[messageType]}
              <span className="text-xs font-medium text-slate-300">
                {typeLabels[messageType]}
              </span>
              {isTyping && (
                <span className="flex gap-1 ml-auto">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              )}
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {displayedText}
              {isTyping && <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 animate-pulse" />}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isCoachLoading && !coachMessage && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-700/50 bg-slate-700/20">
            <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
            <span className="text-sm text-slate-400">Coach is thinking...</span>
          </div>
        )}
      </div>

      {/* Hint Button */}
      <div className="p-4 border-t border-slate-700/50">
        <button
          onClick={handleHintClick}
          disabled={isCoachLoading || !isCoachEnabled}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
            isCoachLoading || !isCoachEnabled
              ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40'
          }`}
        >
          {isCoachLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Lightbulb className="w-5 h-5" />
              Get Hint
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default CoachChat;
