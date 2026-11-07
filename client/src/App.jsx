import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import WeatherModal from './components/WeatherModal';
import CommandPalette from './components/CommandPalette';
import FarmAmbientBanner from './components/FarmAmbientBanner';
import AchievementToast from './components/AchievementToast';
import MobileBottomNav from './components/MobileBottomNav';

// Tabs for Main Dashboard
import InventoryTab from './components/tabs/InventoryTab';
import OperationsTab from './components/tabs/OperationsTab';
import FinancialTab from './components/tabs/FinancialTab';

// Dedicated Sub-Pages
import InventoryItemsPage from './components/pages/InventoryItemsPage';
import InventoryTransactionsPage from './components/pages/InventoryTransactionsPage';
import CropCyclesPage from './components/pages/CropCyclesPage';
import PlotsPage from './components/pages/PlotsPage';
import ReportsPage from './components/pages/ReportsPage';
import YieldTrendsPage from './components/pages/YieldTrendsPage';
import DbmsLabPage from './components/pages/DbmsLabPage';

// Modals
import LogUsageModal from './components/modals/LogUsageModal';
import RecordHarvestModal from './components/modals/RecordHarvestModal';
import RecordSaleModal from './components/modals/RecordSaleModal';
import PlotHistoryModal from './components/modals/PlotHistoryModal';
import NewItemModal from './components/modals/NewItemModal';
import NewCropCycleModal from './components/modals/NewCropCycleModal';
import NewPlotModal from './components/modals/NewPlotModal';

import { api } from './services/api';
import { soundManager, triggerConfetti, achievementsManager } from './utils/fun';

export default function App() {
  // Navigation & View state
  const [currentSection, setCurrentSection] = useState('dashboard'); // 'dashboard' | 'operations' | 'plots' | 'crop-cycles' | 'accounting' | 'inventory-items' | 'inventory-transactions' | 'reports' | 'yield-trends'
  const [activeDashboardTab, setActiveDashboardTab] = useState('inventory'); // 'financial' | 'operations' | 'inventory'
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Farms state
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(1); // default to farm 1

  // Dashboard Aggregated Data
  const [stats, setStats] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [operationsData, setOperationsData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);

  // Modals state
  const [weatherModalOpen, setWeatherModalOpen] = useState(false);
  const [logUsageModalOpen, setLogUsageModalOpen] = useState(false);
  const [activeUsageCycleId, setActiveUsageCycleId] = useState(null);
  
  const [recordHarvestModalOpen, setRecordHarvestModalOpen] = useState(false);
  const [activeHarvestCycleId, setActiveHarvestCycleId] = useState(null);

  const [recordSaleModalOpen, setRecordSaleModalOpen] = useState(false);
  const [activeSaleHarvestId, setActiveSaleHarvestId] = useState(null);

  const [plotHistoryModalOpen, setPlotHistoryModalOpen] = useState(false);
  const [activeHistoryPlotId, setActiveHistoryPlotId] = useState(null);

  const [newItemModalOpen, setNewItemModalOpen] = useState(false);
  const [newCropCycleModalOpen, setNewCropCycleModalOpen] = useState(false);
  const [newPlotModalOpen, setNewPlotModalOpen] = useState(false);

  // Command Palette & Fun Features State
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initial Data Load
  useEffect(() => {
    loadFarms();
  }, []);

  useEffect(() => {
    loadDashboardData();
    loadWeather();
  }, [selectedFarmId]);

  const loadFarms = async () => {
    try {
      const data = await api.getFarms();
      setFarms(data);
      if (data.length > 0 && !selectedFarmId) {
        setSelectedFarmId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load farms:', err);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [statsRes, chartsRes, finRes, opsRes] = await Promise.all([
        api.getDashboardStats(selectedFarmId),
        api.getInventoryCharts(),
        api.getFinancials(selectedFarmId),
        api.getOperations(selectedFarmId)
      ]);
      setStats(statsRes);
      setChartsData(chartsRes);
      setFinancialData(finRes);
      setOperationsData(opsRes);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    }
  };

  const loadWeather = async () => {
    try {
      const wData = await api.getWeather(selectedFarmId);
      setWeatherData(wData);
    } catch (err) {
      console.error('Weather load error:', err);
    }
  };

  const handleOpenPlotHistory = (plotId) => {
    setActiveHistoryPlotId(plotId);
    setPlotHistoryModalOpen(true);
  };

  const handleOpenLogUsageForCycle = (cycleId) => {
    setActiveUsageCycleId(cycleId);
    setLogUsageModalOpen(true);
  };

  const handleOpenRecordHarvestForCycle = (cycleId) => {
    setActiveHarvestCycleId(cycleId);
    setRecordHarvestModalOpen(true);
  };

  const handleOpenRecordSaleForHarvest = (harvestId) => {
    setActiveSaleHarvestId(harvestId);
    setRecordSaleModalOpen(true);
  };

  const handleRefreshAll = () => {
    loadDashboardData();
    loadWeather();
    soundManager.playSuccess();
    triggerConfetti({ count: 50 });
    achievementsManager.unlock('green_thumb');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 w-full overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        setCurrentSection={(s) => {
          setCurrentSection(s);
          if (s === 'operations') {
            setActiveDashboardTab('operations');
          } else if (s === 'accounting') {
            setActiveDashboardTab('financial');
          }
        }}
        farms={farms}
        selectedFarmId={selectedFarmId}
        setSelectedFarmId={setSelectedFarmId}
        weatherAlertCount={weatherData?.warnings?.length || 0}
        onOpenWeatherModal={() => setWeatherModalOpen(true)}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0 w-full overflow-x-hidden">
        {/* Top Header Bar */}
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          weatherWarnings={weatherData?.warnings || []}
          onOpenWeatherModal={() => setWeatherModalOpen(true)}
          onOpenLogUsage={() => {
            setActiveUsageCycleId(null);
            setLogUsageModalOpen(true);
          }}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto space-y-5 sm:space-y-6">
          {/* Farm Ambient Greeting & Trivia Mascot */}
          <FarmAmbientBanner
            farmName={farms.find(f => f.id === selectedFarmId)?.name || 'FarmLedger Demo Farm'}
            onNavigateToLab={(subTab) => {
              setCurrentSection('dbms-lab');
            }}
            onOpenWeather={() => setWeatherModalOpen(true)}
          />

          {/* Main Dashboard View (with 3 Tabs: Financial, Operations, Inventory) */}
          {(currentSection === 'dashboard' || currentSection === 'accounting' || currentSection === 'operations') && (
            <div className="space-y-6">
              {/* Dashboard Title & Subtitle */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-slate-200">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Farm Dashboard</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Comprehensive overview of your farm operations and finances
                  </p>
                </div>

                {/* The 3 Tabs (Segmented control style on mobile) */}
                <div className="w-full sm:w-auto flex items-center justify-between p-1 bg-slate-200/70 rounded-xl border border-slate-200">
                  <button
                    onClick={() => {
                      soundManager.playPop();
                      setActiveDashboardTab('financial');
                    }}
                    className={`flex-1 sm:flex-none px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all text-center ${
                      activeDashboardTab === 'financial'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Financial
                  </button>
                  <button
                    onClick={() => {
                      soundManager.playPop();
                      setActiveDashboardTab('operations');
                    }}
                    className={`flex-1 sm:flex-none px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all text-center ${
                      activeDashboardTab === 'operations'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Operations
                  </button>
                  <button
                    onClick={() => {
                      soundManager.playPop();
                      setActiveDashboardTab('inventory');
                    }}
                    className={`flex-1 sm:flex-none px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all text-center ${
                      activeDashboardTab === 'inventory'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Inventory
                  </button>
                </div>
              </div>

              {/* Tab 1: Financial */}
              {activeDashboardTab === 'financial' && (
                <FinancialTab
                  financialData={financialData}
                  onOpenRecordSale={() => {
                    setActiveSaleHarvestId(null);
                    setRecordSaleModalOpen(true);
                  }}
                  onOpenLogUsage={() => {
                    setActiveUsageCycleId(null);
                    setLogUsageModalOpen(true);
                  }}
                />
              )}

              {/* Tab 2: Operations */}
              {activeDashboardTab === 'operations' && (
                <OperationsTab
                  operationsData={operationsData}
                  onSelectPlotHistory={handleOpenPlotHistory}
                  onOpenNewCycle={() => setNewCropCycleModalOpen(true)}
                  onOpenNewPlot={() => setNewPlotModalOpen(true)}
                />
              )}

              {/* Tab 3: Inventory */}
              {activeDashboardTab === 'inventory' && (
                <InventoryTab
                  stats={stats}
                  chartsData={chartsData}
                  onNavigateToItems={() => setCurrentSection('inventory-items')}
                  onNavigateToTransactions={() => setCurrentSection('inventory-transactions')}
                  onOpenLogUsage={() => {
                    setActiveUsageCycleId(null);
                    setLogUsageModalOpen(true);
                  }}
                  onOpenNewItem={() => setNewItemModalOpen(true)}
                />
              )}
            </div>
          )}

          {/* Sub-Page: Inventory Items */}
          {currentSection === 'inventory-items' && (
            <InventoryItemsPage
              farmId={selectedFarmId}
              onOpenNewItem={() => setNewItemModalOpen(true)}
            />
          )}

          {/* Sub-Page: Inventory Transactions Ledger */}
          {currentSection === 'inventory-transactions' && (
            <InventoryTransactionsPage
              onOpenLogUsage={() => {
                setActiveUsageCycleId(null);
                setLogUsageModalOpen(true);
              }}
              onOpenNewTransaction={() => {
                setActiveUsageCycleId(null);
                setLogUsageModalOpen(true);
              }}
            />
          )}

          {/* Sub-Page: Farm Plots */}
          {currentSection === 'plots' && (
            <PlotsPage
              farmId={selectedFarmId}
              onOpenNewPlot={() => setNewPlotModalOpen(true)}
              onSelectPlotHistory={handleOpenPlotHistory}
            />
          )}

          {/* Sub-Page: Crop Cycles & Yields */}
          {currentSection === 'crop-cycles' && (
            <CropCyclesPage
              farmId={selectedFarmId}
              onOpenNewCycle={() => setNewCropCycleModalOpen(true)}
              onOpenRecordHarvest={handleOpenRecordHarvestForCycle}
              onOpenRecordSale={handleOpenRecordSaleForHarvest}
              onOpenLogUsage={handleOpenLogUsageForCycle}
            />
          )}

          {/* Sub-Page: Analytical Reports */}
          {currentSection === 'reports' && <ReportsPage />}

          {/* Sub-Page: Yield Trends Dashboard */}
          {currentSection === 'yield-trends' && <YieldTrendsPage />}

          {/* Sub-Page: DBMS Laboratory */}
          {currentSection === 'dbms-lab' && <DbmsLabPage />}
        </main>
      </div>

      {/* Global Modals */}
      <WeatherModal
        isOpen={weatherModalOpen}
        onClose={() => setWeatherModalOpen(false)}
        weatherData={weatherData}
      />

      <LogUsageModal
        isOpen={logUsageModalOpen}
        onClose={() => setLogUsageModalOpen(false)}
        initialCycleId={activeUsageCycleId}
        onSuccess={handleRefreshAll}
      />

      <RecordHarvestModal
        isOpen={recordHarvestModalOpen}
        onClose={() => setRecordHarvestModalOpen(false)}
        initialCycleId={activeHarvestCycleId}
        onSuccess={handleRefreshAll}
      />

      <RecordSaleModal
        isOpen={recordSaleModalOpen}
        onClose={() => setRecordSaleModalOpen(false)}
        initialHarvestId={activeSaleHarvestId}
        onSuccess={handleRefreshAll}
      />

      <PlotHistoryModal
        isOpen={plotHistoryModalOpen}
        onClose={() => setPlotHistoryModalOpen(false)}
        plotId={activeHistoryPlotId}
      />

      <NewItemModal
        isOpen={newItemModalOpen}
        onClose={() => setNewItemModalOpen(false)}
        farmId={selectedFarmId}
        onSuccess={handleRefreshAll}
      />

      <NewCropCycleModal
        isOpen={newCropCycleModalOpen}
        onClose={() => setNewCropCycleModalOpen(false)}
        farmId={selectedFarmId}
        onSuccess={handleRefreshAll}
      />

      <NewPlotModal
        isOpen={newPlotModalOpen}
        onClose={() => setNewPlotModalOpen(false)}
        farmId={selectedFarmId}
        onSuccess={handleRefreshAll}
      />

      {/* Fun & Interactive Global Utilities */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(section, subTab) => {
          setCurrentSection(section);
          if (section === 'operations') setActiveDashboardTab('operations');
          if (section === 'accounting') setActiveDashboardTab('financial');
          if (section === 'dashboard') setActiveDashboardTab('inventory');
        }}
        onAction={(action) => {
          if (action === 'log-usage') {
            setActiveUsageCycleId(null);
            setLogUsageModalOpen(true);
          } else if (action === 'new-cycle') {
            setNewCropCycleModalOpen(true);
          } else if (action === 'new-plot') {
            setNewPlotModalOpen(true);
          } else if (action === 'new-item') {
            setNewItemModalOpen(true);
          } else if (action === 'weather') {
            setWeatherModalOpen(true);
          }
        }}
      />

      <AchievementToast />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        currentSection={currentSection}
        onNavigate={(sec) => {
          setCurrentSection(sec);
          if (sec === 'operations') setActiveDashboardTab('operations');
          if (sec === 'dashboard') setActiveDashboardTab('inventory');
        }}
        onAction={(action) => {
          if (action === 'log-usage') {
            setActiveUsageCycleId(null);
            setLogUsageModalOpen(true);
          } else if (action === 'new-item') {
            setNewItemModalOpen(true);
          } else if (action === 'record-sale') {
            setActiveSaleHarvestId(null);
            setRecordSaleModalOpen(true);
          } else if (action === 'new-cycle') {
            setNewCropCycleModalOpen(true);
          }
        }}
      />
    </div>
  );
}
