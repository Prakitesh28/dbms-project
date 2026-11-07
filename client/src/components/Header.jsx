import React, { useState, useEffect } from 'react';
import { Search, Menu, CloudRain, Plus, Database, Command, Volume2, VolumeX, Sparkles } from 'lucide-react';
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
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
      {/* Left: Mobile hamburger & Global Search / Command Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
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
            className="absolute right-2 top-2 hidden sm:flex items-center gap-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-slate-200/70 border border-slate-300 rounded text-slate-600 hover:bg-slate-300 transition-colors"
            title="Open Command Palette (Ctrl+K)"
          >
            <Command className="w-3 h-3" />
            <span>K</span>
          </button>
        </div>
      </div>

      {/* Right: Quick Action, Weather, Sound, System Status */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Weather Hazards Alert Pill */}
        {weatherWarnings.length > 0 && (
          <button
            onClick={() => {
              soundManager.playPop();
              onOpenWeatherModal();
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors"
            title={`${weatherWarnings.length} upcoming weather hazards detected`}
          >
            <CloudRain className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="hidden sm:inline">Weather Alert:</span>
            <span className="font-semibold">{weatherWarnings.length}</span>
          </button>
        )}

        {/* Audio FX Toggle Button */}
        <button
          onClick={handleToggleSound}
          title={soundOn ? 'Sound Effects Active (Click to mute)' : 'Sound Effects Muted (Click to enable)'}
          className={`p-2 rounded-lg border text-xs transition-colors flex items-center justify-center ${
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
          className="btn-primary text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4 active:scale-98 transition-transform"
        >
          <Plus className="w-4 h-4" />
          <span>Log Input</span>
        </button>

        {/* Live DB Indicator */}
        <div className="hidden md:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs text-slate-600">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-slate-700">Live DB Connected</span>
        </div>
      </div>
    </header>
  );
}
