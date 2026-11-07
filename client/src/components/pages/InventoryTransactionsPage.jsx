import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Plus, 
  Search, 
  Calendar, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../../services/api';

export default function InventoryTransactionsPage({ onOpenLogUsage, onOpenNewTransaction }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [search, setSearch] = useState('');

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedType) params.type = selectedType;

      const data = await api.getTransactions(params);
      setTransactions(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [startDate, endDate, selectedType]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedType('');
    setSearch('');
  };

  const filtered = transactions.filter(t => 
    t.item_name.toLowerCase().includes(search.toLowerCase()) ||
    (t.notes && t.notes.toLowerCase().includes(search.toLowerCase())) ||
    (t.plot_code && t.plot_code.toLowerCase().includes(search.toLowerCase())) ||
    (t.crop_name && t.crop_name.toLowerCase().includes(search.toLowerCase()))
  );

  const getTypeBadge = (type) => {
    switch (type) {
      case 'purchase':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
            Purchase (+)
          </span>
        );
      case 'usage':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
            Usage (-)
          </span>
        );
      case 'wastage':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Wastage (-)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Adjustment
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Append-Only Inventory Ledger</h2>
          <p className="text-xs text-slate-500">
            Audit-grade double-entry movements. Triggers enforce zero stock underflow and automatically update SKUs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/reports/export-csv?type=transactions"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </a>
          <button
            onClick={onOpenLogUsage}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Log Field Usage</span>
          </button>
        </div>
      </div>

      {/* Date Range & Type Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ledger notes, crops, plots..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-emerald-500"
            />
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs text-slate-800 focus:outline-hidden"
            />
            <span className="text-xs font-semibold text-slate-400 uppercase">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs text-slate-800 focus:outline-hidden"
            />
          </div>

          {/* Type dropdown */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            aria-label="Filter by Transaction Type"
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="">All Movement Types</option>
            <option value="purchase">Purchase (+)</option>
            <option value="usage">Field Usage (-)</option>
            <option value="wastage">Wastage (-)</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>

        {(startDate || endDate || selectedType || search) && (
          <button
            onClick={clearFilters}
            className="text-xs text-slate-500 hover:text-rose-600 underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading audit ledger entries...</div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl m-4">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <ArrowLeftRight className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Transactions Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Adjust your date filter or log a new purchase/usage transaction.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                  <th className="py-3 px-4">Tx ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Item SKU</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Total Cost</th>
                  <th className="py-3 px-4">Allocated Cycle / Plot</th>
                  <th className="py-3 px-4">Audited Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">#{t.id}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{t.transaction_date}</td>
                    <td className="py-3 px-4">{getTypeBadge(t.transaction_type)}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{t.item_name}</span>
                      <span className="text-xs text-slate-400 font-mono">Cat: {t.item_category}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {t.quantity} <span className="font-normal text-slate-500">{t.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      ₹{t.unit_cost.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ₹{t.total_cost.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {t.crop_cycle_id ? (
                        <div>
                          <span className="font-semibold text-slate-800">
                            {t.crop_name} ({t.plot_code})
                          </span>
                          <span className="block text-xs text-slate-400">
                            Cycle #{t.crop_cycle_id} &bull; {t.cycle_season}
                          </span>
                        </div>
                      ) : t.supplier_name ? (
                        <span className="text-slate-600 font-medium">Supplier: {t.supplier_name}</span>
                      ) : (
                        <span className="text-slate-400 italic">General Farm Stock</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={t.notes}>
                      {t.notes || <span className="text-slate-300 italic">None</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

