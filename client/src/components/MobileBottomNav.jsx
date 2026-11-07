import React from 'react';
import { 
  LayoutDashboard, 
  Sprout, 
  Package, 
  Database, 
  Plus, 
  Command 
} from 'lucide-react';
import { soundManager } from '../utils/fun';

export default function MobileBottomNav({ 
  currentSection, 
  onNavigate, 
  onOpenQuickAction 
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'crop-cycles', label: 'Cycles', icon: Sprout },
    { id: 'quick', label: 'Actions', icon: Plus, isAction: true },
    { id: 'inventory-items', label: 'Inventory', icon: Package },
    { id: 'dbms-lab', label: 'DBMS Lab', icon: Database, hasBadge: true }
  ];

  return (
    <nav 
      aria-label="Mobile Navigation Bar"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1 flex items-center justify-around pb-safe"
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
                onOpenQuickAction();
              }}
              className="flex flex-col items-center justify-center -mt-5 group focus:outline-hidden"
              aria-label="Quick Actions & Commands"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-90 transition-transform border-2 border-white">
                <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
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
              onNavigate(item.id);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
              isActive 
                ? 'text-emerald-700 font-bold' 
                : 'text-slate-400 hover:text-slate-600 font-medium'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px] scale-110' : 'stroke-[1.8px]'} transition-transform`} />
              {item.hasBadge && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </div>
            <span className="text-[10px] tracking-tight mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
