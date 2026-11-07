import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  DollarSign, 
  Boxes, 
  Package, 
  ArrowLeftRight, 
  Sprout, 
  MapPin, 
  BarChart3, 
  TrendingUp, 
  ChevronDown, 
  ChevronRight,
  Database,
  CloudSun
} from 'lucide-react';
import { soundManager } from '../utils/fun';

export default function Sidebar({ 
  currentSection, 
  setCurrentSection, 
  farms, 
  selectedFarmId, 
  setSelectedFarmId,
  weatherAlertCount = 0,
  onOpenWeatherModal,
  mobileOpen,
  setMobileOpen
}) {
  const [inventorySubmenuOpen, setInventorySubmenuOpen] = useState(true);

  const selectedFarm = farms.find(f => f.id === Number(selectedFarmId)) || farms[0];

  const handleNav = (section) => {
    soundManager.playPop();
    setCurrentSection(section);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand / Logo */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs">
              <Sprout className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <span className="font-semibold text-slate-900 tracking-tight text-lg">FarmLedger</span>
              <span className="text-xs block text-emerald-600 font-medium">Agricultural DBMS</span>
            </div>
          </div>
        </div>

        {/* Farm Switcher */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5 px-1">
            Current Farm
          </label>
          <div className="relative">
            <select
              value={selectedFarmId || ''}
              onChange={(e) => setSelectedFarmId(e.target.value ? Number(e.target.value) : '')}
              aria-label="Select Farm"
              className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 pr-8 shadow-2xs hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">All Farms (Consolidated)</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
          </div>
          {selectedFarm && selectedFarmId && (
            <div className="flex items-center gap-1.5 mt-2 px-1 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{selectedFarm.location} ({selectedFarm.total_area_acres} acres)</span>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Main Dashboard */}
          <button
            onClick={() => handleNav('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentSection === 'dashboard'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Dashboard</span>
          </button>

          {/* Tasks & Operations */}
          <button
            onClick={() => handleNav('operations')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentSection === 'operations'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-4 h-4 shrink-0" />
            <span>Tasks & Schedules</span>
          </button>

          {/* Plots Management */}
          <button
            onClick={() => handleNav('plots')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentSection === 'plots'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4 shrink-0" />
            <span>Farm Plots</span>
          </button>

          {/* Crop Cycles & Schedules */}
          <button
            onClick={() => handleNav('crop-cycles')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentSection === 'crop-cycles'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sprout className="w-4 h-4 shrink-0" />
            <span>Crop Cycles</span>
          </button>

          {/* Accounting & Financial */}
          <button
            onClick={() => handleNav('accounting')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentSection === 'accounting'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span>Accounting</span>
          </button>

          {/* Inventory Section with Nested Sub-Pages */}
          <div>
            <button
              onClick={() => setInventorySubmenuOpen(!inventorySubmenuOpen)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentSection.startsWith('inventory')
                  ? 'text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Boxes className="w-4 h-4 shrink-0" />
                <span>Inventory</span>
              </div>
              {inventorySubmenuOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {inventorySubmenuOpen && (
              <div className="mt-1 ml-6 pl-2 border-l border-slate-200 space-y-1">
                <button
                  onClick={() => handleNav('inventory-items')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    currentSection === 'inventory-items'
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 shrink-0" />
                  <span>Inventory Items</span>
                </button>
                <button
                  onClick={() => handleNav('inventory-transactions')}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    currentSection === 'inventory-transactions'
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
                  <span>Transactions Ledger</span>
                </button>
              </div>
            )}
          </div>

          <div className="pt-3 pb-1">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3">
              Analytics & Reports
            </span>
          </div>

          {/* Analytical Reports */}
          <button
            onClick={() => handleNav('reports')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentSection === 'reports'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Analytical Reports</span>
          </button>

          {/* Yield Trends Dashboard */}
          <button
            onClick={() => handleNav('yield-trends')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentSection === 'yield-trends'
                ? 'bg-emerald-50 text-emerald-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Yield Trends & Deficits</span>
          </button>

          {/* DBMS Lab Section */}
          <button
            onClick={() => handleNav('dbms-lab')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentSection === 'dbms-lab'
                ? 'bg-emerald-600 text-white font-semibold shadow-2xs'
                : 'text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Database className={`w-4 h-4 shrink-0 ${currentSection === 'dbms-lab' ? 'text-white' : 'text-emerald-600'}`} />
              <span>DBMS Lab</span>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
              currentSection === 'dbms-lab' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'
            }`}>
              Viva
            </span>
          </button>
        </nav>

        {/* Weather Forecast & System Integrity Status in Footer */}
        <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/70">
          <button
            onClick={onOpenWeatherModal}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs hover:border-emerald-300 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <CloudSun className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-800">Open-Meteo Weather</div>
                <div className="text-xs text-slate-500">7-Day Agri Forecast</div>
              </div>
            </div>
            {weatherAlertCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700">
                {weatherAlertCount} {weatherAlertCount > 1 ? 'Alerts' : 'Alert'}
              </span>
            )}
          </button>

          <div className="px-2 py-1 flex items-center gap-1.5 text-xs text-slate-500">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>SQLite &bull; Triggers Enforced</span>
          </div>
        </div>
      </aside>
    </>
  );
}

