import React, { useState } from 'react';
import { 
  MapPin, 
  Sprout, 
  Calendar as CalendarIcon, 
  History, 
  Droplet, 
  Layers, 
  Plus, 
  ChevronRight,
  Clock,
  CheckCircle2
} from 'lucide-react';

export default function OperationsTab({ 
  operationsData, 
  onSelectPlotHistory, 
  onOpenNewCycle,
  onOpenNewPlot 
}) {
  const plots = operationsData?.plots || [];
  const events = operationsData?.calendarEvents || [];
  const [activeSubView, setActiveSubView] = useState('plots'); // 'plots' | 'schedules' | 'calendar'

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Growing':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Growing</span>;
      case 'Sown':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Sown</span>;
      case 'Planned':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Planned</span>;
      case 'Harvested':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Harvested</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-view switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubView('plots')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSubView === 'plots'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Plots Overview ({plots.length})
          </button>
          <button
            onClick={() => setActiveSubView('schedules')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSubView === 'schedules'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Crop Schedules ({events.length})
          </button>
          <button
            onClick={() => setActiveSubView('calendar')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeSubView === 'calendar'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Sowing & Harvest Calendar
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewPlot}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
          >
            + New Plot
          </button>
          <button
            onClick={onOpenNewCycle}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Crop Cycle</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Plots Grid */}
      {activeSubView === 'plots' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plots.map((plot) => (
            <div
              key={plot.id}
              className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {plot.plot_code}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">{plot.farm_name}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">{plot.name}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    plot.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {plot.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center mb-4">
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-xs font-medium text-slate-400 block">Area</span>
                    <span className="text-xs font-bold text-slate-800">{plot.area_acres} Acres</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-xs font-medium text-slate-400 block">Soil</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">{plot.soil_type}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50">
                    <span className="text-xs font-medium text-slate-400 block">Irrigation</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">{plot.irrigation_type}</span>
                  </div>
                </div>

                {/* Active cultivation state */}
                <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-100 mb-4">
                  <span className="text-xs font-medium text-slate-500 block mb-1">
                    Current Cropping Status
                  </span>
                  {plot.active_crop ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sprout className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            {plot.active_crop} - {plot.active_variety}
                          </div>
                          <div className="text-xs text-slate-500">
                            Sown: {plot.sowing_date} &bull; Expected Harvest: {plot.expected_harvest_date}
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(plot.cycle_status)}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 italic flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Plot resting / Fallow (No active cycle)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <button
                onClick={() => onSelectPlotHistory(plot.id)}
                className="w-full py-2 px-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <History className="w-3.5 h-3.5 text-emerald-600" />
                <span>View Crop-Cycle History & Rotation</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* VIEW 2: Crop Schedules Table */}
      {activeSubView === 'schedules' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Active & Historical Crop Schedules</h3>
            <span className="text-xs text-slate-500">{events.length} Total Registered Cycles</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-xs">
                  <th className="py-3 px-4">Cycle ID</th>
                  <th className="py-3 px-4">Plot</th>
                  <th className="py-3 px-4">Crop & Variety</th>
                  <th className="py-3 px-4">Season</th>
                  <th className="py-3 px-4">Sowing Date</th>
                  <th className="py-3 px-4">Expected Harvest</th>
                  <th className="py-3 px-4">Actual Harvest</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {events.map((e) => (
                  <tr key={e.cycle_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">#{e.cycle_id}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{e.plot_name} ({e.plot_code})</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">{e.crop_name}</span>
                      <span className="block text-slate-400 text-xs">{e.variety_name}</span>
                    </td>
                    <td className="py-3 px-4 font-medium">{e.season}</td>
                    <td className="py-3 px-4">{e.sowing_date}</td>
                    <td className="py-3 px-4">{e.expected_harvest_date}</td>
                    <td className="py-3 px-4">{e.actual_harvest_date || <span className="text-slate-400 italic">In progress</span>}</td>
                    <td className="py-3 px-4">{getStatusBadge(e.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Visual Calendar / Milestone Timeline */}
      {activeSubView === 'calendar' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Agricultural Chronology Timeline</h3>
              <p className="text-xs text-slate-500">Visual calendar of sowing windows and harvest readiness dates</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Sowing Event
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Harvest Target
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {events.map((e) => (
              <div 
                key={e.cycle_id}
                className="p-4 rounded-xl border border-slate-200/70 hover:border-slate-300 bg-slate-50/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl text-emerald-600 shrink-0">
                    <Sprout className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm text-slate-900">{e.crop_name} ({e.variety_name})</span>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                        {e.plot_code}
                      </span>
                      {getStatusBadge(e.status)}
                    </div>
                    <p className="text-xs text-slate-500">{e.plot_name} &bull; Season: {e.season}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900">
                    <CalendarIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-xs uppercase font-medium text-emerald-600 block">Sown</span>
                      <span className="font-semibold">{e.sowing_date}</span>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-300 hidden md:block" />

                  <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 border border-purple-100 text-purple-900">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <span className="text-xs uppercase font-medium text-purple-600 block">Harvest</span>
                      <span className="font-semibold">{e.actual_harvest_date || e.expected_harvest_date}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

