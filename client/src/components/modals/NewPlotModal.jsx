import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { api } from '../../services/api';

export default function NewPlotModal({ isOpen, onClose, farmId, onSuccess }) {
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(farmId || '');
  const [plotCode, setPlotCode] = useState('');
  const [name, setName] = useState('');
  const [areaAcres, setAreaAcres] = useState('');
  const [soilType, setSoilType] = useState('Black Soil');
  const [irrigationType, setIrrigationType] = useState('Drip');
  const [status, setStatus] = useState('Active');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadFarms();
      if (farmId) setSelectedFarmId(farmId);
      setError(null);
    }
  }, [isOpen, farmId]);

  const loadFarms = async () => {
    try {
      const farmList = await api.getFarms();
      setFarms(farmList);
      if (farmList.length > 0 && !selectedFarmId) {
        setSelectedFarmId(farmList[0].id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.createPlot({
        farm_id: Number(selectedFarmId),
        plot_code: plotCode,
        name,
        area_acres: Number(areaAcres),
        soil_type: soilType,
        irrigation_type: irrigationType,
        status
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
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add New Farm Plot</h3>
              <p className="text-[11px] text-slate-500">Defines land boundary, soil properties and irrigation</p>
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
              Select Farm *
            </label>
            <select
              value={selectedFarmId}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Plot Code (Unique per Farm) *
              </label>
              <input
                type="text"
                value={plotCode}
                onChange={(e) => setPlotCode(e.target.value)}
                placeholder="e.g. P-WEST-05"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Plot Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. West Canal Terrace"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Area (Acres) *
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                value={areaAcres}
                onChange={(e) => setAreaAcres(e.target.value)}
                placeholder="10.0"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Soil Type *
              </label>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="Black Soil">Black Soil</option>
                <option value="Alluvial">Alluvial</option>
                <option value="Sandy Loam">Sandy Loam</option>
                <option value="Clay Loam">Clay Loam</option>
                <option value="Red Soil">Red Soil</option>
                <option value="Silt Loam">Silt Loam</option>
                <option value="Clay">Clay</option>
                <option value="Sandy">Sandy</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Irrigation *
              </label>
              <select
                value={irrigationType}
                onChange={(e) => setIrrigationType(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="Drip">Drip</option>
                <option value="Sprinkler">Sprinkler</option>
                <option value="Flood">Flood</option>
                <option value="Rainfed">Rainfed</option>
              </select>
            </div>
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
              {loading ? 'Creating...' : 'Register Plot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

