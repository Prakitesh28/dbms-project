import React from 'react';
import { Search, Bell, Menu, CloudRain, Plus } from 'lucide-react';

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
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search crops, plots, inventory SKU, suppliers..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>
      </div>

      {/* Right: Quick Action, Weather, Notifications & Avatar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Log Input Usage Button */}
        <button
          onClick={onOpenLogUsage}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Input Usage</span>
        </button>

        {/* Weather Hazards Alert Pill */}
        {weatherWarnings.length > 0 && (
          <button
            onClick={onOpenWeatherModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors"
            title={`${weatherWarnings.length} upcoming weather hazards detected`}
          >
            <CloudRain className="w-4 h-4 text-amber-600 animate-bounce" />
            <span className="hidden md:inline font-semibold">Agri Hazard:</span>
            <span>{weatherWarnings.length} alert{weatherWarnings.length > 1 ? 's' : ''}</span>
          </button>
        )}

        {/* User Profile Avatar */}
        <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center ring-2 ring-emerald-500/20 shadow-2xs">
              PF
            </div>
            <span className="w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full absolute -bottom-0.5 -right-0.5" />
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-slate-800">Prof. Agronomist</div>
            <div className="text-[10px] text-slate-500">DBMS Examiner Demo</div>
          </div>
        </div>
      </div>
    </header>
  );
}

