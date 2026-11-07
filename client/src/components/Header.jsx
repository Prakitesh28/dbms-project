import React from 'react';
import { Search, Menu, CloudRain, Plus, Database } from 'lucide-react';

export default function Header({ 
  onOpenMobileMenu, 
  searchTerm, 
  setSearchTerm,
  weatherWarnings = [],
  onOpenWeatherModal,
  onOpenLogUsage
}) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8">
      {/* Left: Mobile hamburger & Global Search */}
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
            placeholder="Search farm records..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all"
          />
        </div>
      </div>

      {/* Right: Quick Action, Weather, System Badge */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Weather Hazards Alert Pill (clean, no annoying bounce) */}
        {weatherWarnings.length > 0 && (
          <button
            onClick={onOpenWeatherModal}
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors"
            title={`${weatherWarnings.length} upcoming weather hazards detected`}
          >
            <CloudRain className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="hidden sm:inline">Weather Alert:</span>
            <span className="font-semibold">{weatherWarnings.length}</span>
          </button>
        )}

        {/* Quick Log Input Usage Button */}
        <button
          onClick={onOpenLogUsage}
          className="btn-primary text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4"
        >
          <Plus className="w-4 h-4" />
          <span>Log Input</span>
        </button>

        {/* Clean System Status Pill instead of fake user avatar */}
        <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200 text-xs text-slate-600">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-medium text-slate-700">Live DB Connected</span>
        </div>
      </div>
    </header>
  );
}
