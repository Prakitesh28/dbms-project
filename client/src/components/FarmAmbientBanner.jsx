import React, { useState, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  CloudSun, 
  Sparkles, 
  Trophy, 
  Volume2, 
  VolumeX, 
  Lightbulb, 
  ShieldCheck,
  ChevronRight,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { 
  soundManager, 
  achievementsManager, 
  ACHIEVEMENTS, 
  FARM_DBMS_TRIVIA,
  triggerConfetti 
} from '../utils/fun';

export default function FarmAmbientBanner({ 
  farmName = 'Green Valley Organic Farm',
  onNavigateToLab,
  onOpenWeather
}) {
  const [greeting, setGreeting] = useState('');
  const [timeIcon, setTimeIcon] = useState(Sun);
  const [triviaIndex, setTriviaIndex] = useState(0);
  const [showTrivia, setShowTrivia] = useState(false);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [sproutBouncing, setSproutBouncing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Determine dynamic time greeting
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning, Farmer!');
      setTimeIcon(CloudSun);
    } else if (hour < 17) {
      setGreeting('Good afternoon, Farmer!');
      setTimeIcon(Sun);
    } else {
      setGreeting('Good evening, Farmer!');
      setTimeIcon(Moon);
    }

    setSoundOn(soundManager.isEnabled());
    setUnlockedCount(achievementsManager.getUnlocked().length);

    // Randomize initial trivia
    setTriviaIndex(Math.floor(Math.random() * FARM_DBMS_TRIVIA.length));

    // Listen for achievement unlocks
    const handleAchievementUnlocked = () => {
      setUnlockedCount(achievementsManager.getUnlocked().length);
    };
    window.addEventListener('farmledger_achievement_unlocked', handleAchievementUnlocked);
    return () => {
      window.removeEventListener('farmledger_achievement_unlocked', handleAchievementUnlocked);
    };
  }, []);

  const handleMascotClick = (e) => {
    soundManager.playPop();
    setSproutBouncing(true);
    setTriviaIndex((prev) => (prev + 1) % FARM_DBMS_TRIVIA.length);
    setShowTrivia(true);
    setTimeout(() => setSproutBouncing(false), 500);
  };

  const toggleSound = () => {
    const next = soundManager.toggle();
    setSoundOn(next);
  };

  const Icon = timeIcon;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-sm border border-emerald-700/50 w-full max-w-full min-w-0">
      {/* Background Decorative ambient glow circles */}
      <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-32 -top-12 w-32 h-32 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

      {/* Collapsed Mode */}
      {isCollapsed ? (
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 truncate">
            <span className="text-lg">🌱</span>
            <span className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              {greeting}
            </span>
            <span className="text-[10px] text-amber-300 font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 shrink-0">
              {unlockedCount}/{ACHIEVEMENTS.length} Badges
            </span>
          </div>
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-800/50 flex items-center gap-1 text-[11px] shrink-0"
          >
            <span>Expand</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          {/* Top/Left: Mascot & Dynamic Greeting */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <button
              onClick={handleMascotClick}
              title="Click me for a farm & DBMS trivia fact!"
              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500/40 flex items-center justify-center text-xl sm:text-2xl transition-transform active:scale-95 shrink-0 shadow-inner ${
                sproutBouncing ? 'animate-bounce' : 'hover:scale-105'
              }`}
            >
              🌱
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
                  <Icon className="w-4 h-4 text-amber-300 shrink-0" />
                  {greeting}
                </span>
                <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-emerald-700/60 border border-emerald-500/30 text-emerald-200 font-medium truncate max-w-[150px] sm:max-w-none">
                  {farmName}
                </span>
              </div>

              {/* Interactive Trivia Snippet or Farm Status */}
              <div className="mt-1 text-xs text-emerald-100/90 leading-snug break-words">
                {showTrivia ? (
                  <span className="text-amber-200 font-medium flex items-center gap-1.5 animate-in fade-in duration-200">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                    <span>{FARM_DBMS_TRIVIA[triviaIndex]}</span>
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] sm:text-xs">
                    <span className="flex items-center gap-1 text-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ACID Verified &bull; Triggers Active
                    </span>
                    <button
                      onClick={handleMascotClick}
                      className="text-amber-300 hover:text-amber-200 underline underline-offset-2 decoration-amber-400/50 ml-1"
                    >
                      Tap Sprout for Trivia 💡
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Collapse button on mobile */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="md:hidden text-emerald-300 hover:text-white p-1 rounded-md"
              title="Collapse banner"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom/Right: Sound Toggle & Viva Mastery Progress */}
          <div className="grid grid-cols-2 md:flex items-center gap-2 w-full md:w-auto shrink-0 pt-2.5 md:pt-0 border-t border-emerald-700/40 md:border-t-0">
            {/* Sound FX Toggle */}
            <button
              onClick={toggleSound}
              title={soundOn ? 'Sound Effects Enabled' : 'Sound Effects Muted'}
              className={`p-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                soundOn 
                  ? 'bg-emerald-800/80 hover:bg-emerald-700 border-emerald-600/50 text-emerald-200' 
                  : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-400'
              }`}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-[11px]">{soundOn ? 'SFX On' : 'Muted'}</span>
            </button>

            {/* Gamification Badge Pill */}
            <button
              onClick={() => {
                soundManager.playPop();
                if (onNavigateToLab) onNavigateToLab('quiz');
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-200 text-xs font-semibold transition-all group"
              title="View unlocked DBMS & Farming badges in the Lab"
            >
              <Trophy className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform shrink-0" />
              <span className="truncate">
                <span className="text-white font-bold">{unlockedCount}</span>
                <span className="text-amber-300/80">/{ACHIEVEMENTS.length}</span> Badges
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-amber-300/70 group-hover:translate-x-0.5 transition-transform shrink-0" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

