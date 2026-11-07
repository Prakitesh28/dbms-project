import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Command, 
  ArrowRight, 
  Sparkles, 
  Database, 
  ShieldAlert, 
  Code2, 
  Sprout, 
  DollarSign, 
  Package, 
  CloudRain, 
  Plus, 
  FileText, 
  CheckCircle2,
  X
} from 'lucide-react';
import { soundManager } from '../utils/fun';

export default function CommandPalette({ 
  isOpen, 
  onClose, 
  onNavigate, 
  onAction 
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const commands = [
    // Navigation items
    { id: 'nav-dash', category: 'Navigation', title: 'Farm Dashboard Overview', icon: Sparkles, action: () => onNavigate('dashboard') },
    { id: 'nav-ops', category: 'Navigation', title: 'Operations & Sowing Schedules', icon: Sprout, action: () => onNavigate('operations') },
    { id: 'nav-fin', category: 'Navigation', title: 'Financial & ROI Analytics', icon: DollarSign, action: () => onNavigate('accounting') },
    { id: 'nav-items', category: 'Navigation', title: 'Inventory Items & Stock Levels', icon: Package, action: () => onNavigate('inventory-items') },
    { id: 'nav-tx', category: 'Navigation', title: 'Inventory Transactions Ledger', icon: FileText, action: () => onNavigate('inventory-transactions') },
    { id: 'nav-plots', category: 'Navigation', title: 'Farm Plots & Soil Types', icon: Sprout, action: () => onNavigate('plots') },
    { id: 'nav-cycles', category: 'Navigation', title: 'Crop Cycles & Yield Variance', icon: Sprout, action: () => onNavigate('crop-cycles') },
    { id: 'nav-reports', category: 'Navigation', title: 'Analytical Reports & CSV Export', icon: FileText, action: () => onNavigate('reports') },
    
    // DBMS Lab Navigation
    { id: 'nav-lab-er', category: 'DBMS Lab', title: 'DBMS Lab: Interactive ER Diagram', icon: Database, action: () => onNavigate('dbms-lab', 'er') },
    { id: 'nav-lab-norm', category: 'DBMS Lab', title: 'DBMS Lab: Normalisation Walkthrough', icon: Database, action: () => onNavigate('dbms-lab', 'norm') },
    { id: 'nav-lab-trig', category: 'DBMS Lab', title: 'DBMS Lab: Triggers Live Sandbox', icon: ShieldAlert, action: () => onNavigate('dbms-lab', 'triggers') },
    { id: 'nav-lab-sql', category: 'DBMS Lab', title: 'DBMS Lab: SQL Playground & Queries', icon: Code2, action: () => onNavigate('dbms-lab', 'playground') },
    { id: 'nav-lab-quiz', category: 'DBMS Lab', title: 'DBMS Lab: 15-Question Viva Quiz', icon: CheckCircle2, action: () => onNavigate('dbms-lab', 'quiz') },

    // Quick Actions
    { id: 'act-log-input', category: 'Quick Action', title: 'Log Input Usage (Fertiliser/Seed)', icon: Plus, action: () => onAction('log-usage') },
    { id: 'act-new-cycle', category: 'Quick Action', title: 'Schedule New Crop Cycle', icon: Plus, action: () => onAction('new-cycle') },
    { id: 'act-new-plot', category: 'Quick Action', title: 'Add New Farm Plot', icon: Plus, action: () => onAction('new-plot') },
    { id: 'act-new-item', category: 'Quick Action', title: 'Register New Inventory Item', icon: Plus, action: () => onAction('new-item') },
    { id: 'act-weather', category: 'Quick Action', title: 'Check Open-Meteo 7-Day Weather', icon: CloudRain, action: () => onAction('weather') }
  ];

  const filtered = commands.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
      soundManager.playPop();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
      soundManager.playPop();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        soundManager.playSuccess();
        filtered[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-3 sm:pt-20 px-3 sm:px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-3 sm:py-3.5 border-b border-slate-100 bg-slate-50/60 shrink-0">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands or jump to page..."
            className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-200/70 border border-slate-300 rounded text-slate-500">
            ESC
          </kbd>
          <button 
            onClick={onClose}
            className="sm:hidden text-slate-400 hover:text-slate-600 p-1.5 rounded-lg active:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-100/60 max-h-[60vh] sm:max-h-80">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching commands or pages found.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundManager.playSuccess();
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-all ${
                    isSelected 
                      ? 'bg-emerald-50/90 text-emerald-950 font-semibold shadow-2xs' 
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs truncate">{item.title}</div>
                      <div className="text-[10px] text-slate-400 font-normal uppercase tracking-wider">{item.category}</div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-1 text-emerald-700 text-[11px] font-medium shrink-0">
                      <span>Jump</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>Navigation: <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 text-[10px] font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 text-[10px] font-mono">↓</kbd></span>
            <span>Select: <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 text-[10px] font-mono">↵</kbd></span>
          </div>
          <span className="font-medium text-emerald-700 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            Quick Command
          </span>
        </div>
      </div>
    </div>
  );
}

