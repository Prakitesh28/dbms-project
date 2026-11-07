import React from 'react';
import { 
  X, 
  CloudSun, 
  CloudRain, 
  Sun, 
  CloudLightning, 
  Wind, 
  Droplets, 
  Thermometer, 
  AlertTriangle, 
  CheckCircle2 
} from 'lucide-react';

export default function WeatherModal({ isOpen, onClose, weatherData }) {
  if (!isOpen) return null;

  const farm = weatherData?.farm || {};
  const forecast = weatherData?.forecast || [];
  const warnings = weatherData?.warnings || [];

  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'Sun': return <Sun className="w-6 h-6 text-amber-500" />;
      case 'CloudSun': return <CloudSun className="w-6 h-6 text-amber-500" />;
      case 'CloudRain': return <CloudRain className="w-6 h-6 text-blue-500" />;
      case 'CloudLightning': return <CloudLightning className="w-6 h-6 text-purple-500" />;
      default: return <CloudSun className="w-6 h-6 text-slate-500" />;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Open-Meteo 7-Day Agricultural Forecast</h2>
              <p className="text-xs text-slate-500">
                Live micro-climate analysis for {farm.name || 'Selected Farm'} ({farm.location || 'Farm Region'}) &bull; Lat: {farm.latitude}, Lon: {farm.longitude}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Hazards & Alerts Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Agronomic Risk Warnings (Sowing & Harvest Synchronization)
            </h3>

            {warnings.length === 0 ? (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>No extreme weather hazards detected near upcoming sowing or harvest dates for this farm. Field operations can proceed as scheduled.</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {warnings.map((w, i) => (
                  <div 
                    key={i} 
                    className={`p-4 rounded-xl border flex items-start gap-3.5 text-xs ${
                      w.severity === 'critical' 
                        ? 'bg-rose-50/80 border-rose-200 text-rose-900' 
                        : 'bg-amber-50/80 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-white shadow-2xs shrink-0 mt-0.5">
                      {w.type.includes('RAIN') ? (
                        <CloudRain className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Thermometer className="w-5 h-5 text-rose-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm tracking-tight">{w.title}</span>
                        <span className="px-2 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider bg-white/80 border">
                          Target: {w.milestone} Window
                        </span>
                      </div>
                      <p className="leading-relaxed opacity-95">{w.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7-Day Forecast Grid */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              7-Day Daily Forecast Overview
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
              {forecast.map((day, idx) => (
                <div 
                  key={idx}
                  className={`p-3.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                    idx === 0 
                      ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/20' 
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <span className="text-[11px] font-bold text-slate-700">
                    {idx === 0 ? 'Today' : formatDate(day.date)}
                  </span>
                  
                  <div className="my-2 p-2 rounded-full bg-white shadow-2xs">
                    {renderIcon(day.icon)}
                  </div>
                  
                  <span className="text-[11px] font-semibold text-slate-800 line-clamp-1 mb-1">
                    {day.label}
                  </span>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <span>{Math.round(day.temp_max)}°</span>
                    <span className="text-slate-400 font-normal">/ {Math.round(day.temp_min)}°</span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 w-full flex flex-col gap-1 text-[10px] text-slate-500">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-blue-600">
                        <Droplets className="w-3 h-3" />
                        {day.precipitation_mm}mm
                      </span>
                      <span className="flex items-center gap-0.5 text-slate-500">
                        <Wind className="w-3 h-3" />
                        {Math.round(day.windspeed_kmh)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DBMS Integration Note */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500">
            <strong>DBMS Agronomic Correlation:</strong> Open-Meteo external REST coordinates are resolved directly against the relational <code className="text-slate-800 font-mono">farms</code> geolocation schema, joining active <code className="text-slate-800 font-mono">crop_cycles</code> with temporal range indexing to safeguard harvest quality and sowing emergence.
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 min-h-[44px] bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Close Forecast
          </button>
        </div>
      </div>
    </div>
  );
}

