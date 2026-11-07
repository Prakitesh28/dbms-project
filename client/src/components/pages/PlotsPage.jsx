import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Plus, 
  History, 
  Trash2, 
  Droplet, 
  Layers, 
  Sprout, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../../services/api';

export default function PlotsPage({ farmId, onOpenNewPlot, onSelectPlotHistory }) {
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPlots = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPlots(farmId);
      setPlots(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlots();
  }, [farmId]);

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Delete plot "${code}"? Note: DBMS foreign keys will reject if active crop cycles exist.`)) return;
    try {
      await api.deletePlot(id);
      loadPlots();
    } catch (err) {
      alert(`Cannot delete plot: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Farm Plots Management</h2>
          <p className="text-xs text-slate-500">
            Acreage, soil classification, irrigation infrastructure, and multi-year rotation history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadPlots}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh Plots"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenNewPlot}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Farm Plot</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading plots...</div>
      ) : error ? (
        <div className="p-6 text-center text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl">
          {error}
        </div>
      ) : plots.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">No Farm Plots Configured</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            Create your first plot specifying land area, soil composition and irrigation network.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plots.map((plot) => (
            <div
              key={plot.id}
              className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {plot.plot_code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{plot.name}</h3>
                    <span className="text-xs text-slate-400">{plot.farm_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      plot.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {plot.status}
                    </span>
                    <button
                      onClick={() => handleDelete(plot.id, plot.plot_code)}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded"
                      title="Delete Plot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center mb-4">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-xs font-medium text-slate-400 block">Area</span>
                    <span className="text-xs font-bold text-slate-800">{plot.area_acres} Acres</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-xs font-medium text-slate-400 block">Soil</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">{plot.soil_type}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-xs font-medium text-slate-400 block">Water</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">{plot.irrigation_type}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-100 mb-4">
                  <span className="text-xs font-medium text-slate-500 block mb-1">
                    Current Rotation Status
                  </span>
                  {plot.current_crop_name ? (
                    <div className="flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {plot.current_crop_name} ({plot.current_variety_name})
                        </div>
                        <div className="text-xs text-slate-500">
                          Status: <span className="font-semibold text-emerald-700">{plot.current_cycle_status}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">No active crop currently sown</div>
                  )}
                </div>
              </div>

              <button
                onClick={() => onSelectPlotHistory(plot.id)}
                className="w-full py-2 px-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <History className="w-3.5 h-3.5 text-emerald-600" />
                <span>View Crop-Cycle History & Rotation</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

