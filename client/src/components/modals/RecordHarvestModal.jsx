import React, { useState, useEffect } from 'react';
import { X, Scissors, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

export default function RecordHarvestModal({ isOpen, onClose, initialCycleId, onSuccess }) {
  const [cycles, setCycles] = useState([]);
  const [selectedCycleId, setSelectedCycleId] = useState(initialCycleId || '');
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [qualityGrade, setQualityGrade] = useState('Grade A');
  const [storageLocation, setStorageLocation] = useState('Warehouse Bay 1');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadCycles();
      if (initialCycleId) setSelectedCycleId(initialCycleId);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialCycleId]);

  const loadCycles = async () => {
    try {
      const data = await api.getCropCycles();
      setCycles(data);
      if (data.length > 0 && !selectedCycleId) {
        setSelectedCycleId(data[0].id);
        setUnit(data[0].standard_yield_unit || 'kg');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const selectedCycle = cycles.find(c => c.id === Number(selectedCycleId));

  const handleCycleChange = (id) => {
    setSelectedCycleId(id);
    const c = cycles.find(item => item.id === Number(id));
    if (c) {
      setUnit(c.standard_yield_unit || 'kg');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.createHarvest({
        crop_cycle_id: Number(selectedCycleId),
        harvest_date: harvestDate,
        quantity_harvested: Number(quantity),
        unit,
        quality_grade: qualityGrade,
        storage_location: storageLocation,
        notes: notes || null
      });

      setSuccessMsg('Harvest recorded! Database trigger updated crop cycle actual yield.');
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1000);
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
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Record Crop Harvest</h3>
              <p className="text-[11px] text-slate-500">Auto-rolls up to crop_cycles.actual_yield via DBMS trigger</p>
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
              <strong>Error:</strong> {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Select Crop Cycle *
            </label>
            <select
              value={selectedCycleId}
              onChange={(e) => handleCycleChange(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
            >
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  Cycle #{c.id} &bull; {c.crop_name} ({c.variety_name}) on {c.plot_name} [{c.season}]
                </option>
              ))}
            </select>
            {selectedCycle && (
              <div className="mt-1 text-[11px] text-slate-500">
                Estimated Yield Target: <strong>{selectedCycle.estimated_yield} {selectedCycle.standard_yield_unit}</strong>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Harvest Date *
              </label>
              <input
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Quantity Harvested *
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 150.0"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                />
                <span className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-600 font-semibold self-center">
                  {unit}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Produce Quality Grade
              </label>
              <select
                value={qualityGrade}
                onChange={(e) => setQualityGrade(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="Grade A">Grade A (Premium / Export)</option>
                <option value="Grade B">Grade B (Standard Market)</option>
                <option value="Grade C">Grade C (Processing / Feed)</option>
                <option value="Reject">Reject</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Storage Location
              </label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="Warehouse Bay 1"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Field Notes & Moisture %
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Clean harvested seed, 10.5% moisture content"
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
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Save Harvest Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

