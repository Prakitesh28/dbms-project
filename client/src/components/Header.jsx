import React, { useState, useEffect } from 'react';
import { Search, Menu, CloudRain, Plus, Database, Command, Volume2, VolumeX, Sparkles, Sprout } from 'lucide-react';
import { soundManager } from '../utils/fun';

export default function Header({ 
  onOpenMobileMenu, 
  searchTerm, 
  setSearchTerm,
  weatherWarnings = [],
  onOpenWeatherModal,
  onOpenLogUsage,
  onOpenCommandPalette
}) {
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    setSoundOn(soundManager.isEnabled());
  }, []);

  const handleToggleSound = () => {
    const next = soundManager.toggle();
    setSoundOn(next);
  };

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-3 sm:px-8 w-full max-w-full min-w-0">
      {/* Left: Hamburger & Brand on Mobile, Search Input on Desktop */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 max-w-md">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile FarmLedger Logo & Name */}
        <div className="flex items-center gap-2 lg:hidden min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shrink-0 shadow-xs">
            <Sprout className="w-4 h-4 text-emerald-100" />
          </div>
          <span className="font-bold text-slate-900 text-sm tracking-tight truncate">
            FarmLedger
          </span>
        </div>

        {/* Desktop Search Bar (hidden on mobile) */}
        <div className="relative w-full hidden lg:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => {
              if (onOpenCommandPalette) onOpenCommandPalette();
            }}
            placeholder="Search records or press ⌘K..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-14 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all cursor-pointer sm:cursor-text"
          />
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="absolute right-2 top-2 flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-slate-200/70 border border-slate-300 rounded text-slate-600 hover:bg-slate-300 transition-colors"
            title="Open Command Palette (Ctrl+K)"
          >
            <Command className="w-3 h-3" />
            <span>K</span>
          </button>
        </div>
      </div>

      {/* Right Action Icons: Search Icon (Mobile), Weather Alert, Sound, Log Input, DB Indicator */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Mobile Search Icon Button */}
        <button
          onClick={onOpenCommandPalette}
          className="lg:hidden p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200"
          aria-label="Search records"
          title="Search (⌘K)"
        >
          <Search className="w-5 h-5 text-slate-600" />
        </button>

        {/* Weather Hazards Alert */}
        {weatherWarnings.length > 0 && (
          <button
            onClick={() => {
              soundManager.playPop();
              onOpenWeatherModal();
            }}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium hover:bg-amber-100 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 justify-center"
            title={`${weatherWarnings.length} upcoming weather hazards detected`}
          >
            <CloudRain className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="hidden sm:inline">Weather:</span>
            <span className="font-semibold text-xs">{weatherWarnings.length}</span>
          </button>
        )}

        {/* Audio FX Toggle */}
        <button
          onClick={handleToggleSound}
          title={soundOn ? 'Sound Effects Active' : 'Sound Effects Muted'}
          className={`p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 rounded-lg border text-xs transition-colors flex items-center justify-center ${
            soundOn 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
              : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
          }`}
        >
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Quick Log Input Usage Button */}
        <button
          onClick={() => {
            soundManager.playPop();
            onOpenLogUsage();
          }}
          className="btn-primary min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 py-2 px-3 sm:px-4 active:scale-95 transition-transform flex items-center justify-center gap-1.5 shrink-0"
          title="Log Input Usage"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Log Input</span>
        </button>

        {/* Live DB Indicator */}
        <div className="flex items-center gap-2 pl-1 sm:pl-3 sm:border-l border-slate-200 text-xs text-slate-600">
          <span className="relative flex h-2.5 w-2.5" title="Live DB Connected">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-slate-700 hidden lg:inline">Live DB Connected</span>
        </div>
      </div>
    </header>
  );
}
