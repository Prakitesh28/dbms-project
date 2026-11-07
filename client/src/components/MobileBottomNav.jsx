import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Sprout, 
  Package, 
  Database, 
  Plus, 
  DollarSign, 
  X,
  Calendar,
  Layers
} from 'lucide-react';
import { soundManager } from '../utils/fun';

export default function MobileBottomNav({ 
  currentSection, 
  onNavigate, 
  onAction 
}) {
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'crop-cycles', label: 'Cycles', icon: Sprout },
    { id: 'quick', label: 'Quick', icon: Plus, isAction: true },
    { id: 'inventory-items', label: 'Inventory', icon: Package },
    { id: 'dbms-lab', label: 'DBMS Lab', icon: Database, hasBadge: true }
  ];

  const handleQuickItem = (actionType) => {
    soundManager.playPop();
    setQuickMenuOpen(false);
    if (onAction) onAction(actionType);
  };

  return (
    <>
      {/* Backdrop for Quick Action Popover */}
      {quickMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs z-40 lg:hidden animate-in fade-in duration-150"
          onClick={() => setQuickMenuOpen(false)}
        />
      )}

      {/* Quick Actions Popover Menu */}
      {quickMenuOpen && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 animate-in slide-in-from-bottom-5 duration-200 lg:hidden">
          <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Quick Actions</span>
            <button 
              onClick={() => setQuickMenuOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <button
              onClick={() => handleQuickItem('log-usage')}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 text-xs font-semibold text-left transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Sprout className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold">Log Input Usage</span>
                <span className="text-[10px] text-slate-400 font-normal">Apply seed/fertiliser to cycle</span>
              </div>
            </button>

            <button
              onClick={() => handleQuickItem('new-item')}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 text-xs font-semibold text-left transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold">New Stock SKU</span>
                <span className="text-[10px] text-slate-400 font-normal">Add farm inventory item</span>
              </div>
            </button>

            <button
              onClick={() => handleQuickItem('record-sale')}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 text-xs font-semibold text-left transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold">Record Harvest Sale</span>
                <span className="text-[10px] text-slate-400 font-normal">Log commodity market revenue</span>
              </div>
            </button>

            <button
              onClick={() => handleQuickItem('new-cycle')}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 text-xs font-semibold text-left transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-xs font-bold">Schedule Crop Cycle</span>
                <span className="text-[10px] text-slate-400 font-normal">Plant new crop on plot</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Nav Bar */}
      <nav 
        aria-label="Mobile Navigation Bar"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1 flex items-center justify-around pb-safe min-h-[58px]"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id || 
            (item.id === 'dashboard' && (currentSection === 'operations' || currentSection === 'accounting')) ||
            (item.id === 'inventory-items' && currentSection === 'inventory-transactions');

          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={() => {
                  soundManager.playPop();
                  setQuickMenuOpen(prev => !prev);
                }}
                className="flex flex-col items-center justify-center -mt-5 group focus:outline-hidden min-w-[56px]"
                aria-label="Quick Actions & Shortcuts"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all border-2 border-white ${
                  quickMenuOpen 
                    ? 'bg-slate-900 text-white shadow-slate-900/30 rotate-45' 
                    : 'bg-emerald-600 text-white shadow-emerald-600/30'
                }`}>
                  <Plus className="w-6 h-6 transition-transform duration-200" />
                </div>
                <span className="text-[10px] font-semibold text-emerald-800 mt-0.5">Quick</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => {
                soundManager.playPop();
                setQuickMenuOpen(false);
                onNavigate(item.id);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative min-w-[48px] min-h-[48px] ${
                isActive 
                  ? 'text-emerald-700 font-bold bg-emerald-50/80' 
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px] scale-105' : 'stroke-[1.8px]'} transition-transform`} />
                {item.hasBadge && (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
