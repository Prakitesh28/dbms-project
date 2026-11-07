import React, { useState, useEffect } from 'react';
import { X, Sprout, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

export default function LogUsageModal({ isOpen, onClose, initialCycleId, onSuccess }) {
  const [items, setItems] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedCycleId, setSelectedCycleId] = useState(initialCycleId || '');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadFormData();
      if (initialCycleId) setSelectedCycleId(initialCycleId);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialCycleId]);

  const loadFormData = async () => {
    try {
      const [itemList, cycleList] = await Promise.all([
        api.getInventoryItems(),
        api.getCropCycles({ status: '' }) // fetch active cycles
      ]);
      setItems(itemList);
      setCycles(cycleList);
      if (itemList.length > 0 && !selectedItemId) {
        setSelectedItemId(itemList[0].item_id);
      }
    } catch (err) {
      setError('Failed to load inventory items or crop cycles: ' + err.message);
    }
  };

  const selectedItem = items.find(i => i.item_id === Number(selectedItemId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      await api.createTransaction({
        inventory_item_id: Number(selectedItemId),
        crop_cycle_id: selectedCycleId ? Number(selectedCycleId) : null,
        transaction_type: 'usage',
        quantity: Number(quantity),
        unit_cost: selectedItem ? selectedItem.unit_cost : 0,
        transaction_date: date,
        notes: notes || `Field input application on ${selectedItem?.item_name || 'crop'}`
      });

      setSuccessMsg('Usage recorded successfully! Database trigger updated current stock.');
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
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Log Input Usage against Crop Cycle</h3>
              <p className="text-[11px] text-slate-500">Atomic inventory deduction with underflow check</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>DBMS Constraint Error:</strong>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Select Inventory Item */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Select Inventory Item SKU *
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
            >
              {items.map((i) => (
                <option key={i.item_id} value={i.item_id}>
                  {i.item_name} ({i.category}) — Available: {i.current_stock} {i.unit} (₹{i.unit_cost}/{i.unit})
                </option>
              ))}
            </select>
            {selectedItem && (
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Current Available Stock: <strong>{selectedItem.current_stock} {selectedItem.unit}</strong></span>
                <span>Unit Cost: ₹{selectedItem.unit_cost}</span>
              </div>
            )}
          </div>

          {/* Select Crop Cycle */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Allocate to Crop Cycle (Optional)
            </label>
            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
            >
              <option value="">General Farm Usage (No specific cycle)</option>
              {cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  Cycle #{c.id} &bull; {c.crop_name} ({c.variety_name}) on {c.plot_name} [{c.season}]
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Quantity Used ({selectedItem?.unit || 'units'}) *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 5.0"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Application Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Field Application Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., First basal fertilizer dressing / pest protection spray"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          {/* Action buttons */}
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
              {loading ? 'Recording...' : 'Commit Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

