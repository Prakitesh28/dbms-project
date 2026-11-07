import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight,
  ShoppingBag,
  Scissors
} from 'lucide-react';
import { api } from '../../services/api';
import { soundManager } from '../../utils/fun';

const CROP_EMOJIS = {
  'Wheat': '🌾',
  'Tomato': '🍅',
  'Maize': '🌽',
  'Soybean': '🌱',
  'Cotton': '☁️',
  'Chickpea': '🫘'
};

export default function CropCyclesPage({ 
  farmId, 
  onOpenNewCycle, 
  onOpenRecordHarvest, 
  onOpenRecordSale,
  onOpenLogUsage 
}) {
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const loadCycles = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (farmId) params.farm_id = farmId;
      if (selectedStatus) params.status = selectedStatus;
      const data = await api.getCropCycles(params);
      setCycles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCycles();
  }, [farmId, selectedStatus]);

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete crop cycle #${id}? Associated harvests and usage logs will be checked by DBMS foreign key constraints.`)) return;
    try {
      await api.deleteCropCycle(id);
      loadCycles();
    } catch (err) {
      alert(`Cannot delete cycle: ${err.message}`);
    }
  };

  const filtered = cycles.filter(c => 
    c.crop_name.toLowerCase().includes(search.toLowerCase()) ||
    c.variety_name.toLowerCase().includes(search.toLowerCase()) ||
    c.plot_name.toLowerCase().includes(search.toLowerCase()) ||
    c.plot_code.toLowerCase().includes(search.toLowerCase()) ||
    c.season.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Crop Cycles & Harvest Yields</h2>
          <p className="text-xs text-slate-500">
            Sowing milestones, estimated vs actual harvest yield comparison with variance percentages, and economic margins.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onOpenNewCycle}
            className="w-full sm:w-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule New Crop Cycle</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search crop, variety, season, plot..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-emerald-500"
          />
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          aria-label="Filter by Status"
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500 w-full sm:w-auto"
        >
          <option value="">All Cultivation Statuses</option>
          <option value="Planned">Planned</option>
          <option value="Sown">Sown</option>
          <option value="Growing">Growing</option>
          <option value="Harvested">Harvested</option>
          <option value="Terminated">Terminated</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading crop cycles...</div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl m-4">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Sprout className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Crop Cycles Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Schedule your first crop cycle on a farm plot to start monitoring sowing dates and expected yields.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Cards View (<640px) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {filtered.map((c) => {
                const isHarvested = c.status === 'Harvested';
                const variancePct = c.variance_percentage;
                const isDeficit = isHarvested && variancePct < -15.0;

                return (
                  <div key={c.id} className="p-4 space-y-3 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{CROP_EMOJIS[c.crop_name] || '🌱'}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900">{c.crop_name}</span>
                            <span className="font-mono text-xs text-slate-400">#{c.id}</span>
                          </div>
                          <p className="text-xs text-slate-500">{c.variety_name} &bull; {c.season}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${
                        c.status === 'Growing' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        c.status === 'Sown' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        c.status === 'Planned' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        c.status === 'Harvested' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        <span>{c.status}</span>
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-2.5 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Plot</span>
                        <span className="font-semibold text-slate-800">{c.plot_name}</span>
                        <span className="text-[10px] text-slate-400 block">{c.plot_code} &bull; {c.area_acres} ac</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Timeline</span>
                        <span className="font-semibold text-slate-800">Sown: {c.sowing_date}</span>
                        <span className="text-[10px] text-slate-400 block">Harvest: {c.actual_harvest_date || c.expected_harvest_date}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Est. Yield</span>
                        <span className="font-semibold text-slate-800">{c.estimated_yield} {c.standard_yield_unit}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Actual Harvest</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900">
                            {isHarvested ? `${c.actual_yield} ${c.standard_yield_unit}` : 'Growing'}
                          </span>
                          {isHarvested && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              variancePct >= 0 ? 'bg-emerald-100 text-emerald-800' : isDeficit ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {variancePct > 0 ? `+${variancePct}` : variancePct}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          soundManager.playPop();
                          onOpenLogUsage && onOpenLogUsage(c.id);
                        }}
                        className="px-3 py-1.5 min-h-[40px] rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                      >
                        <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Log Usage</span>
                      </button>
                      {c.status !== 'Harvested' && (
                        <button
                          onClick={() => {
                            soundManager.playPop();
                            onOpenRecordHarvest && onOpenRecordHarvest(c.id);
                          }}
                          className="px-3 py-1.5 min-h-[40px] rounded-lg bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-700 hover:bg-purple-100 flex items-center gap-1"
                        >
                          <Scissors className="w-3.5 h-3.5" />
                          <span>Harvest</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          soundManager.playPop();
                          handleDelete(c.id);
                        }}
                        className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Cycle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table (>=640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[720px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                  <th className="py-3 px-4">Cycle ID</th>
                  <th className="py-3 px-4">Plot & Farm</th>
                  <th className="py-3 px-4">Crop Cultivar</th>
                  <th className="py-3 px-4">Season</th>
                  <th className="py-3 px-4">Sowing / Harvest Date</th>
                  <th className="py-3 px-4 text-right">Estimated Yield</th>
                  <th className="py-3 px-4 text-right">Actual Harvest</th>
                  <th className="py-3 px-4 text-right">Yield Variance (%)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((c) => {
                  const isHarvested = c.status === 'Harvested';
                  const variancePct = c.variance_percentage;
                  const isDeficit = isHarvested && variancePct < -15.0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">#{c.id}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{c.plot_name}</span>
                        <span className="text-xs text-slate-400 font-mono">
                          {c.plot_code} &bull; {c.area_acres} ac &bull; {c.soil_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{CROP_EMOJIS[c.crop_name] || '🌱'}</span>
                          <div>
                            <span className="font-bold text-slate-900">{c.crop_name}</span>
                            <span className="block text-xs text-slate-500">{c.variety_name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{c.season}</td>
                      <td className="py-3 px-4">
                        <div>Sown: <span className="font-semibold text-slate-800">{c.sowing_date}</span></div>
                        <div className="text-slate-400 text-xs">
                          Target: {c.actual_harvest_date || c.expected_harvest_date}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700">
                        {c.estimated_yield} {c.standard_yield_unit}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {isHarvested ? (
                          `${c.actual_yield} ${c.standard_yield_unit}`
                        ) : (
                          <span className="text-slate-400 italic">Growing</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isHarvested ? (
                          <div className="inline-flex items-center gap-1 font-bold">
                            {variancePct >= 0 ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                +{variancePct}%
                              </span>
                            ) : isDeficit ? (
                              <span className="px-2.5 py-0.5 rounded-full text-xs bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1" title="Fell >15% below estimate!">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                {variancePct}%
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                <TrendingDown className="w-3 h-3" />
                                {variancePct}%
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">&mdash;</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          c.status === 'Growing' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          c.status === 'Sown' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          c.status === 'Planned' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          c.status === 'Harvested' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          <span>{c.status === 'Growing' ? '🌿' : c.status === 'Harvested' ? '🌾' : c.status === 'Sown' ? '🌱' : '📅'}</span>
                          <span>{c.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Log usage against this cycle */}
                          <button
                            onClick={() => {
                              soundManager.playPop();
                              onOpenLogUsage && onOpenLogUsage(c.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Log Input Usage for this cycle"
                          >
                            <Sprout className="w-4 h-4" />
                          </button>

                          {/* Record Harvest */}
                          {c.status !== 'Harvested' && (
                            <button
                              onClick={() => {
                                soundManager.playPop();
                                onOpenRecordHarvest && onOpenRecordHarvest(c.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                              title="Record Harvest Quantities"
                            >
                              <Scissors className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              soundManager.playPop();
                              handleDelete(c.id);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Cycle"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
        )}
      </div>
    </div>
  );
}

