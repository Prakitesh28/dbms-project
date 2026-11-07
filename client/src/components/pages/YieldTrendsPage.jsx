import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Sprout, 
  CheckCircle2, 
  Calendar,
  Filter,
  RefreshCw,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend 
} from 'recharts';
import { api } from '../../services/api';

const CROP_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function YieldTrendsPage() {
  const [trendData, setTrendData] = useState(null);
  const [selectedCropId, setSelectedCropId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTrends = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (selectedCropId) params.crop_id = selectedCropId;
      const data = await api.getYieldTrends(params);
      setTrendData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrends();
  }, [selectedCropId]);

  const flagged = trendData?.flaggedCycles || [];
  const chartData = trendData?.chartData || [];
  const crops = trendData?.crops || [];
  const cycles = trendData?.cycles || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Multi-Season Yield Trends & Deficit Alerts</h2>
          <p className="text-xs text-slate-500">
            Tracking actual harvested productivity across agrarian seasons and flagging underperforming cycles (&gt; 15% deficit).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedCropId}
            onChange={(e) => setSelectedCropId(e.target.value)}
            aria-label="Filter by Crop"
            className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500 shadow-2xs"
          >
            <option value="">All Crop Varieties</option>
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={loadTrends}
            className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh Trends"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Deficit Alert Banner if any flagged cycles */}
      {flagged.length > 0 && (
        <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 animate-bounce" />
            <h3 className="text-sm font-bold">
              {flagged.length} Crop Cycle{flagged.length > 1 ? 's' : ''} Flagged for Critical Yield Deficit (&gt; 15% Below Agronomic Estimate)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {flagged.map((f) => (
              <div 
                key={f.cycle_id}
                className="p-3.5 bg-white rounded-lg border border-rose-200 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900 text-xs">
                      #{f.cycle_id} &bull; {f.crop_name} ({f.variety_name})
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                      {f.variance_percentage}% Deficit
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mb-2">
                    Plot: <span className="font-semibold text-slate-800">{f.plot_name}</span> ({f.plot_code}) &bull; Season: {f.season}
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-700 py-1 border-t border-slate-100">
                    <div>Estimated: <span className="font-bold">{f.estimated_yield} {f.standard_yield_unit}</span></div>
                    <div>Harvested: <span className="font-bold text-rose-700">{f.actual_yield} {f.standard_yield_unit}</span></div>
                    <div>Loss: <span className="font-bold text-rose-700">{f.variance_units}</span></div>
                  </div>
                </div>
                {f.notes && (
                  <div className="mt-2 text-[11px] text-rose-700 bg-rose-50/70 p-2 rounded border border-rose-100 italic">
                    <strong>Incident Log:</strong> {f.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Season Yield Chart Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-2xs flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Actual Harvest Yield Across Agrarian Seasons</h3>
            <p className="text-xs text-slate-500">Historical productivity grouped by seasonal crop cycle</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5" />
            <span>Yields measured in harvest units</span>
          </div>
        </div>

        <div className="h-80 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Loading multi-season series...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="season" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <RechartsTooltip 
                  formatter={(val, name) => [`${val.toLocaleString()} units`, name]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {crops.map((crop, idx) => (
                  <Bar
                    key={crop.id}
                    dataKey={`${crop.name}_actual`}
                    name={`${crop.name} Harvested`}
                    fill={CROP_COLORS[idx % CROP_COLORS.length]}
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Historical Cycles Variance Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Historical Cycles Yield Variance Ledger</h3>
          <span className="text-xs text-slate-500">{cycles.length} Total Harvested Cycles</span>
        </div>
        {/* Mobile Stacked Cards (<640px) */}
        <div className="sm:hidden divide-y divide-slate-100">
          {cycles.map((c) => (
            <div key={c.cycle_id} className={`p-4 space-y-2.5 ${c.is_deficit_flagged ? 'bg-rose-50/40' : 'bg-white'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-900">{c.crop_name}</span>
                    <span className="font-mono text-xs text-slate-400">#{c.cycle_id}</span>
                  </div>
                  <p className="text-xs text-slate-500">{c.variety_name} &bull; {c.season}</p>
                </div>
                <div>
                  {c.is_deficit_flagged ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      {c.variance_percentage}%
                    </span>
                  ) : (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      c.variance_percentage >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.variance_percentage > 0 ? `+${c.variance_percentage}` : c.variance_percentage}%
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-2.5 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Plot</span>
                  <span className="font-semibold text-slate-800">{c.plot_name}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">{c.plot_code}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Yield Per Acre</span>
                  <span className="font-semibold text-slate-800">{c.actual_per_acre} / ac</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Estimated</span>
                  <span className="font-semibold text-slate-800">{c.estimated_yield} {c.standard_yield_unit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Harvested</span>
                  <span className="font-bold text-slate-900">{c.actual_yield} {c.standard_yield_unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table (>=640px) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[720px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                <th className="py-3 px-4">Cycle</th>
                <th className="py-3 px-4">Plot</th>
                <th className="py-3 px-4">Crop Cultivar</th>
                <th className="py-3 px-4">Season</th>
                <th className="py-3 px-4 text-right">Estimated</th>
                <th className="py-3 px-4 text-right">Harvested</th>
                <th className="py-3 px-4 text-right">Per Acre (Act.)</th>
                <th className="py-3 px-4 text-right">Variance (%)</th>
                <th className="py-3 px-4">Deficit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {cycles.map((c) => (
                <tr key={c.cycle_id} className={`hover:bg-slate-50/70 transition-colors ${c.is_deficit_flagged ? 'bg-rose-50/30' : ''}`}>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">#{c.cycle_id}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{c.plot_name} ({c.plot_code})</td>
                  <td className="py-3 px-4 font-bold text-slate-800">{c.crop_name} &bull; {c.variety_name}</td>
                  <td className="py-3 px-4">{c.season}</td>
                  <td className="py-3 px-4 text-right">{c.estimated_yield} {c.standard_yield_unit}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">{c.actual_yield} {c.standard_yield_unit}</td>
                  <td className="py-3 px-4 text-right font-medium text-slate-600">{c.actual_per_acre} / ac</td>
                  <td className="py-3 px-4 text-right font-bold">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs ${
                      c.variance_percentage >= 0 ? 'bg-emerald-100 text-emerald-800' :
                      c.is_deficit_flagged ? 'bg-rose-100 text-rose-800 font-bold' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {c.variance_percentage > 0 ? `+${c.variance_percentage}` : c.variance_percentage}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {c.is_deficit_flagged ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Deficit (&gt;15%)
                      </span>
                    ) : c.variance_percentage >= 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Target Met
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        Minor Deficit
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

