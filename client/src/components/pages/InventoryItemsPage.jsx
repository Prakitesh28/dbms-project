import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertCircle, 
  XCircle, 
  Edit2, 
  Trash2, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';

export default function InventoryItemsPage({ onOpenNewItem, farmId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const loadItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (farmId) params.farm_id = farmId;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;
      
      const data = await api.getInventoryItems(params);
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [farmId, selectedCategory, selectedStatus]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete inventory item "${name}"?`)) return;
    try {
      await api.deleteInventoryItem(id);
      loadItems();
    } catch (err) {
      alert(`Cannot delete item: ${err.message}`);
    }
  };

  const filteredItems = items.filter(item => 
    item.item_name.toLowerCase().includes(search.toLowerCase()) ||
    (item.supplier_name && item.supplier_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Agricultural Inventory SKUs</h2>
          <p className="text-xs text-slate-500">
            Real-time stock ledger, valuation, and automatic reorder alerts based on view <code className="font-mono text-slate-700">v_current_stock_levels</code>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadItems}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh Stock"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenNewItem}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Inventory Item</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items or suppliers..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:bg-white focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter by Category"
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="">All Categories</option>
            <option value="Fertiliser">Fertiliser</option>
            <option value="Seed">Seed</option>
            <option value="Pesticide">Pesticide</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter by Stock Status"
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="">All Stock Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock (&le; 10)</option>
            <option value="Out of Stock">Out of Stock (= 0)</option>
          </select>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading live stock levels...</div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl m-4">
            {error}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Inventory Items Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Add your farm seeds, fertilisers, and pesticides to start recording input usages and audit logs.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">SKU / Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Current Stock</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Asset Valuation</th>
                  <th className="py-3 px-4 text-right">Reorder Level</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredItems.map((item) => (
                  <tr key={item.item_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.item_name}
                      <span className="block text-[11px] font-normal text-slate-400 font-mono">
                        ID: #{item.item_id} &bull; Farm: {item.farm_name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.category === 'Fertiliser' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        item.category === 'Seed' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        item.category === 'Pesticide' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {item.current_stock} <span className="font-normal text-slate-500">{item.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      ₹{item.unit_cost.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ₹{item.total_valuation.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-500">
                      {item.reorder_level} {item.unit}
                    </td>
                    <td className="py-3 px-4">
                      {item.stock_status === 'Out of Stock' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3" />
                          Out of Stock
                        </span>
                      ) : item.stock_status === 'Low Stock' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <AlertCircle className="w-3 h-3" />
                          Low Stock (&le; 10)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Adequate
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {item.supplier_name ? (
                        <div>
                          <div className="font-medium text-slate-800">{item.supplier_name}</div>
                          <div className="text-[10px] text-slate-400">{item.supplier_phone}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None assigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(item.item_id, item.item_name)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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

