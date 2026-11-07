import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  FileSpreadsheet, 
  DollarSign, 
  Sprout, 
  TrendingUp, 
  Calendar,
  Download,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api';

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('cost_per_acre'); // 'cost_per_acre' | 'yield_per_acre' | 'profit_by_crop' | 'seasonal'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      let res = [];
      if (activeReport === 'cost_per_acre') {
        res = await api.getCostPerAcre();
      } else if (activeReport === 'yield_per_acre') {
        res = await api.getYieldPerAcre();
      } else if (activeReport === 'profit_by_crop') {
        res = await api.getProfitByCrop();
      } else if (activeReport === 'seasonal') {
        res = await api.getSeasonalComparisons();
      }
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeReport]);

  const getCsvUrl = () => `/api/reports/export-csv?type=${activeReport}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Analytical DBMS Reports</h2>
          <p className="text-xs text-slate-500">
            Multi-table relational queries, CTE financial aggregations, and window function projections with one-click CSV export.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadReport}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <a
            href={getCsvUrl()}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export Report (CSV)</span>
          </a>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-xl border border-slate-200/60 w-fit">
        <button
          onClick={() => setActiveReport('cost_per_acre')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeReport === 'cost_per_acre'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          1. Cost per Acre
        </button>
        <button
          onClick={() => setActiveReport('yield_per_acre')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeReport === 'yield_per_acre'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          2. Yield per Acre & Variance
        </button>
        <button
          onClick={() => setActiveReport('profit_by_crop')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeReport === 'profit_by_crop'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          3. Profit by Crop (ROI)
        </button>
        <button
          onClick={() => setActiveReport('seasonal')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeReport === 'seasonal'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          4. Seasonal Comparisons
        </button>
      </div>

      {/* Report Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Executing analytical SQL query...</div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl m-4">
            {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* 1. Cost per acre */}
            {activeReport === 'cost_per_acre' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                    <th className="py-3 px-4">Cycle</th>
                    <th className="py-3 px-4">Plot Name</th>
                    <th className="py-3 px-4">Crop Variety</th>
                    <th className="py-3 px-4">Season</th>
                    <th className="py-3 px-4 text-right">Plot Area</th>
                    <th className="py-3 px-4 text-right">Total Input Costs</th>
                    <th className="py-3 px-4 text-right">Cost Per Acre</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data.map((r) => (
                    <tr key={r.cycle_id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">#{r.cycle_id}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{r.plot_name} ({r.plot_code})</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{r.crop_name} &bull; {r.variety_name}</td>
                      <td className="py-3 px-4">{r.season}</td>
                      <td className="py-3 px-4 text-right font-medium">{r.area_acres} ac</td>
                      <td className="py-3 px-4 text-right font-medium text-amber-700">₹{r.total_input_cost.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">₹{r.input_cost_per_acre.toLocaleString()} / ac</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 2. Yield per acre */}
            {activeReport === 'yield_per_acre' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                    <th className="py-3 px-4">Cycle</th>
                    <th className="py-3 px-4">Plot</th>
                    <th className="py-3 px-4">Crop</th>
                    <th className="py-3 px-4 text-right">Area</th>
                    <th className="py-3 px-4 text-right">Estimated Yield</th>
                    <th className="py-3 px-4 text-right">Actual Harvest</th>
                    <th className="py-3 px-4 text-right">Est. Yield / Acre</th>
                    <th className="py-3 px-4 text-right">Act. Yield / Acre</th>
                    <th className="py-3 px-4 text-right">Variance (%)</th>
                    <th className="py-3 px-4">DBMS Assessment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data.map((r) => {
                    const isDeficit = r.yield_assessment.includes('CRITICAL');
                    return (
                      <tr key={r.cycle_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">#{r.cycle_id}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{r.plot_name}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{r.crop_name}</td>
                        <td className="py-3 px-4 text-right">{r.area_acres} ac</td>
                        <td className="py-3 px-4 text-right font-medium">{r.estimated_yield} {r.yield_unit}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{r.actual_yield} {r.yield_unit}</td>
                        <td className="py-3 px-4 text-right text-slate-600">{r.estimated_yield_per_acre}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{r.actual_yield_per_acre}</td>
                        <td className="py-3 px-4 text-right font-bold">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs ${
                            r.variance_pct >= 0 ? 'bg-emerald-100 text-emerald-800' :
                            isDeficit ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.variance_pct > 0 ? `+${r.variance_pct}` : r.variance_pct}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isDeficit ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            r.variance_pct >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {r.yield_assessment}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* 3. Profit by crop */}
            {activeReport === 'profit_by_crop' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                    <th className="py-3 px-4">Crop Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Cycles Sown</th>
                    <th className="py-3 px-4 text-right">Total Acres</th>
                    <th className="py-3 px-4 text-right">Total Input Costs</th>
                    <th className="py-3 px-4 text-right">Total Sales Revenue</th>
                    <th className="py-3 px-4 text-right">Net Profit</th>
                    <th className="py-3 px-4 text-right">ROI (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 text-sm">{r.crop_name}</td>
                      <td className="py-3 px-4 font-medium text-slate-600">{r.crop_category}</td>
                      <td className="py-3 px-4 text-right font-medium">{r.cycles_cultivated}</td>
                      <td className="py-3 px-4 text-right font-medium">{r.total_acres_farmed} ac</td>
                      <td className="py-3 px-4 text-right font-medium text-amber-700">₹{r.total_input_costs.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">₹{r.total_sales_revenue.toLocaleString()}</td>
                      <td className={`py-3 px-4 text-right font-bold text-sm ${r.net_profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        ₹{r.net_profit.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span className="px-2.5 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800">
                          {r.roi_percentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 4. Seasonal Comparisons */}
            {activeReport === 'seasonal' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                    <th className="py-3 px-4">Season</th>
                    <th className="py-3 px-4 text-right">Total Cycles</th>
                    <th className="py-3 px-4 text-right">Total Acres Sown</th>
                    <th className="py-3 px-4 text-right">Harvested Yield</th>
                    <th className="py-3 px-4 text-right">Seasonal Input Costs</th>
                    <th className="py-3 px-4 text-right">Seasonal Revenue</th>
                    <th className="py-3 px-4 text-right">Net Season Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {data.map((r, i) => {
                    const margin = r.total_seasonal_revenue - r.total_seasonal_input_cost;
                    return (
                      <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 text-sm">{r.season}</td>
                        <td className="py-3 px-4 text-right font-medium">{r.total_cycles}</td>
                        <td className="py-3 px-4 text-right font-medium">{r.total_acres_sown} ac</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">{r.total_harvested_yield.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-medium text-amber-700">₹{r.total_seasonal_input_cost.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">₹{r.total_seasonal_revenue.toLocaleString()}</td>
                        <td className={`py-3 px-4 text-right font-bold text-sm ${margin >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          ₹{margin.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

