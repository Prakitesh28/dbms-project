import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  Receipt, 
  CreditCard,
  Plus
} from 'lucide-react';

export default function FinancialTab({ 
  financialData, 
  onOpenRecordSale, 
  onOpenLogUsage 
}) {
  const summary = financialData?.summary || {
    total_revenue: 0,
    total_costs: 0,
    net_profit: 0,
    overall_roi: 0
  };
  const cycles = financialData?.cycles || [];

  return (
    <div className="space-y-6">
      {/* 4 Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Gross Sales Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            ₹{summary.total_revenue.toLocaleString()}
          </div>
          <span className="text-xs text-emerald-700 font-medium">From verified harvest sales</span>
        </div>

        {/* Input Expenditures */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Input Expenses</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            ₹{summary.total_costs.toLocaleString()}
          </div>
          <span className="text-xs text-amber-700 font-medium">Direct seed, fert & pest usages</span>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Net Farm Profit</span>
            <div className={`p-2 rounded-lg ${summary.net_profit >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight mb-1 ${summary.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            ₹{summary.net_profit.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 font-medium">Revenue minus direct inputs</span>
        </div>

        {/* ROI % */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Return on Investment</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
            {summary.overall_roi}%
          </div>
          <span className="text-xs text-blue-700 font-medium">Average across all seasons</span>
        </div>
      </div>

      {/* Cycle-by-Cycle Economic Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Crop Cycle Financial Ledger</h3>
            <p className="text-xs text-slate-500">Input cost, harvest revenue, and net profit calculated per cultivated cycle</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenLogUsage}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Log Cost Usage
            </button>
            <button
              onClick={onOpenRecordSale}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Sale</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                <th className="py-3 px-4">Cycle</th>
                <th className="py-3 px-4">Plot & Farm</th>
                <th className="py-3 px-4">Crop Variety</th>
                <th className="py-3 px-4">Season</th>
                <th className="py-3 px-4 text-right">Input Costs</th>
                <th className="py-3 px-4 text-right">Sales Revenue</th>
                <th className="py-3 px-4 text-right">Net Profit</th>
                <th className="py-3 px-4 text-right">ROI (%)</th>
                <th className="py-3 px-4 text-right">Profit / Acre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {cycles.map((c) => (
                <tr key={c.cycle_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">#{c.cycle_id}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 block">{c.plot_name}</span>
                    <span className="text-slate-400 text-xs font-mono">{c.plot_code} ({c.area_acres} ac)</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900">{c.crop_name}</span>
                    <span className="block text-slate-400 text-xs">{c.variety_name}</span>
                  </td>
                  <td className="py-3 px-4 font-medium">{c.season}</td>
                  <td className="py-3 px-4 text-right font-medium text-amber-700">
                    ₹{(c.input_costs || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    ₹{(c.sales_revenue || 0).toLocaleString()}
                  </td>
                  <td className={`py-3 px-4 text-right font-bold ${c.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    ₹{(c.profit || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      c.roi >= 100 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : c.roi > 0 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-slate-100 text-slate-600'
                    }`}>
                      {c.roi}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-800">
                    ₹{(c.profit_per_acre || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

