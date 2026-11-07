import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, X } from 'lucide-react';

export default function AchievementToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleUnlock = (e) => {
      setToast(e.detail);
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('farmledger_achievement_unlocked', handleUnlock);
    return () => {
      window.removeEventListener('farmledger_achievement_unlocked', handleUnlock);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed top-5 right-5 z-50 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
      <div className="bg-slate-900 border-2 border-amber-400 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3.5 relative overflow-hidden">
        {/* Glow corner */}
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="w-11 h-11 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-2xl shrink-0">
          {toast.icon || '🏆'}
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Achievement Unlocked!</span>
          </div>
          <h4 className="text-sm font-bold text-white mt-0.5">{toast.title}</h4>
          <p className="text-xs text-slate-300 mt-0.5 leading-snug">{toast.description}</p>
        </div>

        <button
          onClick={() => setToast(null)}
          className="text-slate-400 hover:text-white absolute top-3 right-3 p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

