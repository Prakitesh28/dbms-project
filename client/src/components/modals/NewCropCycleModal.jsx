import React, { useState, useEffect } from 'react';
import { X, Sprout } from 'lucide-react';
import { api } from '../../services/api';

export default function NewCropCycleModal({ isOpen, onClose, farmId, onSuccess }) {
  const [plots, setPlots] = useState([]);
  const [varieties, setVarieties] = useState([]);
  const [selectedPlotId, setSelectedPlotId] = useState('');
  const [selectedVarietyId, setSelectedVarietyId] = useState('');
  const [season, setSeason] = useState('Kharif 2026');
  const [sowingDate, setSowingDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedHarvestDate, setExpectedHarvestDate] = useState('');
  const [estimatedYield, setEstimatedYield] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadDependencies();
      setError(null);
    }
  }, [isOpen, farmId]);

  const loadDependencies = async () => {
    try {
      const [plotList, varietyList] = await Promise.all([
        api.getPlots(farmId),
        api.getVarieties()
      ]);
      setPlots(plotList);
      setVarieties(varietyList);
      if (plotList.length > 0 && !selectedPlotId) setSelectedPlotId(plotList[0].id);
      if (varietyList.length > 0 && !selectedVarietyId) setSelectedVarietyId(varietyList[0].id);
    } catch (err) {
      setError(err.message);
    }
  };

  // Auto-compute harvest date & estimated yield when variety or plot changes
  useEffect(() => {
    const v = varieties.find(item => item.id === Number(selectedVarietyId));
    const p = plots.find(item => item.id === Number(selectedPlotId));
    
    if (v && sowingDate) {
      const sow = new Date(sowingDate);
      sow.setDate(sow.getDate() + (v.days_to_maturity || 100));
      setExpectedHarvestDate(sow.toISOString().split('T')[0]);

      if (p && v.expected_yield_per_acre) {
        setEstimatedYield((p.area_acres * v.expected_yield_per_acre).toFixed(2));
      }
    }
  }, [selectedVarietyId, selectedPlotId, sowingDate, varieties, plots]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.createCropCycle({
        plot_id: Number(selectedPlotId),
        crop_variety_id: Number(selectedVarietyId),
        season,
        sowing_date: sowingDate,
        expected_harvest_date: expectedHarvestDate,
        estimated_yield: Number(estimatedYield),
        status: 'Planned',
        notes: notes || null
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Schedule New Crop Cycle</h3>
              <p className="text-[11px] text-slate-500">Links land plot to crop variety with yield estimates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Select Farm Plot *
            </label>
            <select
              value={selectedPlotId}
              onChange={(e) => setSelectedPlotId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
            >
              {plots.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.plot_code}) &bull; {p.area_acres} Acres &bull; {p.soil_type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Select Crop Cultivar / Variety *
            </label>
            <select
              value={selectedVarietyId}
              onChange={(e) => setSelectedVarietyId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
            >
              {varieties.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.crop_name}: {v.name} &bull; {v.days_to_maturity} days maturity &bull; Optimal: {v.optimal_season}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Agrarian Season *
              </label>
              <input
                type="text"
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                placeholder="e.g. Kharif 2026 / Summer 2026"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Estimated Total Yield *
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                value={estimatedYield}
                onChange={(e) => setEstimatedYield(e.target.value)}
                placeholder="Auto-calculated from variety"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Planned Sowing Date *
              </label>
              <input
                type="date"
                value={sowingDate}
                onChange={(e) => setSowingDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Expected Harvest Date *
              </label>
              <input
                type="date"
                value={expectedHarvestDate}
                onChange={(e) => setExpectedHarvestDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Agronomic Plan Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sowing scheduled following first monsoon showers"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : 'Save Crop Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

