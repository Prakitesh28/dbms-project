import React from 'react';
import { 
  Package, 
  DollarSign, 
  AlertCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  ArrowUpRight,
  Plus,
  ArrowRight
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';

const CATEGORY_COLORS = {
  Fertiliser: '#10b981', // Emerald
  Seed: '#3b82f6',       // Blue
  Pesticide: '#f59e0b',  // Amber
  Other: '#8b5cf6'       // Purple
};

export default function InventoryTab({ 
  stats, 
  chartsData, 
  onNavigateToItems, 
  onNavigateToTransactions,
  onOpenLogUsage,
  onOpenNewItem
}) {
  const categoryData = chartsData?.category_distribution || [];
  const monthlyTrends = chartsData?.monthly_trends || [];

  return (
    <div className="space-y-6">
      {/* 6 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Total Items */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Total Items</span>
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            {stats?.total_items?.value ?? 0}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {stats?.total_items?.status_caption || 'Registered stock SKUs'}
          </div>
        </div>

        {/* 2. Total Value */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Total Value</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            ₹{(stats?.total_value?.value ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {stats?.total_value?.status_caption || 'Live asset valuation'}
          </div>
        </div>

        {/* 3. Low Stock */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Low Stock</span>
            <div className={`p-2 rounded-lg ${stats?.low_stock?.value > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight mb-1 ${stats?.low_stock?.value > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {stats?.low_stock?.value ?? 0}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {stats?.low_stock?.status_caption || 'At or below threshold'}
          </div>
        </div>

        {/* 4. Out of Stock */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Out of Stock</span>
            <div className={`p-2 rounded-lg ${stats?.out_of_stock?.value > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight mb-1 ${stats?.out_of_stock?.value > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {stats?.out_of_stock?.value ?? 0}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {stats?.out_of_stock?.status_caption || 'Zero units available'}
          </div>
        </div>

        {/* 5. Recent Activity (7d) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Recent Activity</span>
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            {stats?.recent_activity?.value ?? 0}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {stats?.recent_activity?.status_caption || 'Last 7 days movements'}
          </div>
        </div>

        {/* 6. Monthly Activity */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500">Monthly Activity</span>
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            {stats?.monthly_activity?.value ?? 0}
          </div>
          <div className="text-xs text-slate-500 truncate">
            {stats?.monthly_activity?.status_caption || 'Current month ledger entries'}
          </div>
        </div>
      </div>

      {/* Two Analytical Recharts Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Chart: Stock Levels by Category */}
        <div className="lg:col-span-5 bg-white rounded-xl p-6 border border-slate-200/80 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Stock Levels by Category</h3>
              <p className="text-xs text-slate-500">Asset distribution across agricultural input types</p>
            </div>
            <button
              onClick={onNavigateToItems}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="total_valuation"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={CATEGORY_COLORS[entry.category] || '#64748b'} 
                    />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(val, name, item) => [
                    `₹${val.toLocaleString()} (${item.payload.total_units} units)`,
                    name
                  ]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Category Summary Legend */}
          <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-slate-100">
            {categoryData.map((c) => (
              <div key={c.category} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/70 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: CATEGORY_COLORS[c.category] || '#64748b' }}
                  />
                  <span className="text-xs font-medium text-slate-700">{c.category}</span>
                </div>
                <span className="text-xs font-bold text-slate-900">₹{(c.total_valuation || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Line & Composed Chart: 12-Month Trends */}
        <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-slate-200/80 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">12-Month Inventory Value & Movements</h3>
              <p className="text-xs text-slate-500">Expenditure value (left axis) vs Transaction frequency (right axis)</p>
            </div>
            <button
              onClick={onNavigateToTransactions}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
            >
              <span>Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrends} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="left" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fontSize: 11, fill: '#94a3b8' }} 
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <RechartsTooltip 
                  formatter={(val, name) => [
                    name === 'Tx Count' ? val : `₹${val.toLocaleString()}`,
                    name
                  ]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} 
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="purchases" 
                  name="Purchases (₹)" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  barSize={18}
                />
                <Bar 
                  yAxisId="left" 
                  dataKey="usages" 
                  name="Field Usages (₹)" 
                  fill="#f59e0b" 
                  radius={[4, 4, 0, 0]} 
                  barSize={18}
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="transaction_count" 
                  name="Tx Count" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 1 }} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-emerald-950">Agri Input Transactions & Stock Control</h4>
          <p className="text-xs text-emerald-800">
            Log fertilizer, seed or pesticide application directly against active crop cycles. Database triggers automatically enforce stock constraints.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenNewItem}
            className="px-3.5 py-1.5 bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors"
          >
            + New Stock SKU
          </button>
          <button
            onClick={onOpenLogUsage}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Field Usage</span>
          </button>
        </div>
      </div>
    </div>
  );
}

