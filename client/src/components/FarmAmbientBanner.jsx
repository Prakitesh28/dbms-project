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
  ChevronRight
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
    <div className="relative overflow-hidden bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-emerald-700/50">
      {/* Background Decorative ambient glow circles */}
      <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-32 -top-12 w-32 h-32 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Mascot & Dynamic Greeting */}
        <div className="flex items-start sm:items-center gap-3.5">
          <button
            onClick={handleMascotClick}
            title="Click me for a farm & DBMS trivia fact!"
            className={`w-12 h-12 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500/40 flex items-center justify-center text-2xl transition-transform active:scale-95 shrink-0 shadow-inner ${
              sproutBouncing ? 'animate-bounce' : 'hover:scale-105'
            }`}
          >
            🌱
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                <Icon className="w-4 h-4 text-amber-300" />
                {greeting}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-700/60 border border-emerald-500/30 text-emerald-200 font-medium hidden sm:inline">
                {farmName}
              </span>
            </div>

            {/* Interactive Trivia Snippet or Farm Status */}
            <div className="mt-1 text-xs text-emerald-100/90 flex items-center gap-2 flex-wrap">
              {showTrivia ? (
                <span className="text-amber-200 font-medium flex items-center gap-1 animate-in fade-in duration-200">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  {FARM_DBMS_TRIVIA[triviaIndex]}
                </span>
              ) : (
                <>
                  <span className="flex items-center gap-1 text-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    ACID Verified &bull; Triggers Active
                  </span>
                  <span className="text-emerald-400/60 hidden sm:inline">&bull;</span>
                  <button
                    onClick={handleMascotClick}
                    className="text-[11px] text-amber-300 hover:text-amber-200 underline underline-offset-2 decoration-amber-400/50"
                  >
                    Tap Sprout for Trivia 💡
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Sound Toggle & Viva Mastery Progress */}
        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          {/* Sound FX Toggle */}
          <button
            onClick={toggleSound}
            title={soundOn ? 'Sound Effects Enabled (Click to Mute)' : 'Sound Effects Muted (Click to Unmute)'}
            className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
              soundOn 
                ? 'bg-emerald-800/80 hover:bg-emerald-700 border-emerald-600/50 text-emerald-200' 
                : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-400'
            }`}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-emerald-300" /> : <VolumeX className="w-4 h-4" />}
            <span className="text-[11px] hidden sm:inline">{soundOn ? 'SFX On' : 'Muted'}</span>
          </button>

          {/* Gamification Badge Pill */}
          <button
            onClick={() => {
              soundManager.playPop();
              if (onNavigateToLab) onNavigateToLab('quiz');
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-200 text-xs font-semibold transition-all group"
            title="View unlocked DBMS & Farming badges in the Lab"
          >
            <Trophy className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
            <span>
              <span className="text-white font-bold">{unlockedCount}</span>
              <span className="text-amber-300/80">/{ACHIEVEMENTS.length}</span> Badges
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-300/70 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
