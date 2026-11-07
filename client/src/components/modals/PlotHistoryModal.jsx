import React, { useState, useEffect } from 'react';
import { 
  X, 
  History, 
  MapPin, 
  Sprout, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';

export default function PlotHistoryModal({ isOpen, onClose, plotId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && plotId) {
      loadHistory();
    }
  }, [isOpen, plotId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getPlotHistory(plotId);
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const plot = data?.plot || {};
  const history = data?.history || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {plot.plot_code}
                </span>
                <h3 className="text-base font-bold text-slate-900">{plot.name}</h3>
              </div>
              <p className="text-xs text-slate-500">
                {plot.farm_name} &bull; {plot.area_acres} Acres &bull; Soil: {plot.soil_type} &bull; Irrigation: {plot.irrigation_type}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading plot rotation history...</div>
          ) : error ? (
            <div className="p-4 bg-rose-50 text-rose-800 rounded-xl text-xs">{error}</div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No historical crop cycles recorded for this plot yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Chronological Crop Rotation Sequence ({history.length} Cycles)
                </h4>
                <span className="text-xs text-slate-400">DBMS Window Function (LAG) Tracking</span>
              </div>

              <div className="space-y-3">
                {history.map((cycle, idx) => {
                  const profit = cycle.total_sales_revenue - cycle.total_input_cost;
                  return (
                    <div 
                      key={cycle.cycle_id}
                      className="p-4 rounded-xl border border-slate-200/80 hover:border-slate-300 bg-slate-50/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-white border border-slate-200 text-emerald-600 shadow-2xs mt-0.5">
                          <Sprout className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-slate-900">
                              {cycle.crop_name} &bull; {cycle.variety_name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/80 text-slate-800">
                              {cycle.season}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              cycle.status === 'Harvested' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {cycle.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                            <span>Sown: <strong>{cycle.sowing_date}</strong></span>
                            <span>&bull;</span>
                            <span>Harvest: <strong>{cycle.actual_harvest_date || cycle.expected_harvest_date}</strong></span>
                          </div>
                          {cycle.notes && (
                            <p className="text-[11px] text-slate-500 italic mt-1">{cycle.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-5 text-right border-t md:border-t-0 pt-2 md:pt-0">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Harvest Yield</span>
                          <span className="text-xs font-bold text-slate-900">
                            {cycle.actual_yield > 0 ? `${cycle.actual_yield} ${cycle.standard_yield_unit}` : 'In progress'}
                          </span>
                          {cycle.actual_yield > 0 && (
                            <span className={`block text-[10px] font-semibold ${
                              cycle.variance_percentage >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {cycle.variance_percentage > 0 ? `+${cycle.variance_percentage}` : cycle.variance_percentage}%
                            </span>
                          )}
                        </div>

                        <div className="border-l border-slate-200 pl-4">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Margin</span>
                          <span className={`text-xs font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            ₹{profit.toLocaleString()}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            Rev: ₹{cycle.total_sales_revenue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
}

