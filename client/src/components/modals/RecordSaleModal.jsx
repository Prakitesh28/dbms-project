import React, { useState, useEffect } from 'react';
import { X, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';

export default function RecordSaleModal({ isOpen, onClose, initialHarvestId, onSuccess }) {
  const [harvests, setHarvests] = useState([]);
  const [selectedHarvestId, setSelectedHarvestId] = useState(initialHarvestId || '');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [buyerName, setBuyerName] = useState('');
  const [quantitySold, setQuantitySold] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Paid');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadHarvests();
      if (initialHarvestId) setSelectedHarvestId(initialHarvestId);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialHarvestId]);

  const loadHarvests = async () => {
    try {
      const data = await api.getHarvests();
      setHarvests(data);
      if (data.length > 0 && !selectedHarvestId) {
        setSelectedHarvestId(data[0].id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const selectedHarvest = harvests.find(h => h.id === Number(selectedHarvestId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await api.createSale({
        harvest_id: Number(selectedHarvestId),
        sale_date: saleDate,
        buyer_name: buyerName,
        quantity_sold: Number(quantitySold),
        unit_price: Number(unitPrice),
        payment_status: paymentStatus,
        notes: notes || null
      });

      setSuccessMsg('Produce sale recorded successfully!');
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
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Record Produce Sale</h3>
              <p className="text-[11px] text-slate-500">Tied directly to verified harvest batch (quota protected)</p>
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
              <strong>DBMS Integrity Error:</strong> {error}
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
              Select Harvest Batch *
            </label>
            <select
              value={selectedHarvestId}
              onChange={(e) => setSelectedHarvestId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
            >
              {harvests.map((h) => (
                <option key={h.id} value={h.id}>
                  Batch #{h.id} &bull; {h.crop_name} ({h.variety_name}) - {h.harvest_date} [{h.quality_grade}] - Available: {h.remaining_qty} {h.unit}
                </option>
              ))}
            </select>
            {selectedHarvest && (
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Harvested: {selectedHarvest.quantity_harvested} {selectedHarvest.unit}</span>
                <span>Unsold Remaining: <strong>{selectedHarvest.remaining_qty} {selectedHarvest.unit}</strong></span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Buyer / Merchant Name *
            </label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="e.g. Maharashtra Agro Processing Ltd / APMC Buyer"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Quantity Sold ({selectedHarvest?.unit || 'units'}) *
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                value={quantitySold}
                onChange={(e) => setQuantitySold(e.target.value)}
                placeholder="e.g. 50"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Unit Sale Price (₹) *
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="e.g. 4800"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {quantitySold && unitPrice && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center justify-between">
              <span>Total Contract Amount:</span>
              <span className="text-sm">₹{(Number(quantitySold) * Number(unitPrice)).toLocaleString()}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Sale Date *
              </label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Partial">Partial</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Invoice / Settlement Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. APMC auction lot 42 settlement"
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
              {loading ? 'Recording...' : 'Save Sale Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

