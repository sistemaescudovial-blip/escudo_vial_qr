import React from 'react';
import { useApp } from '../../context/AppContext';
import { TrendingUp, CheckCircle2 } from 'lucide-react';

export default function KpiCards({ onCardClick, activeFilter }) {
  const { emergencies, qrList, reports } = useApp();

  const activeEmergencies = emergencies.filter(e => e.status !== 'resuelto');
  const activeQrsCount = qrList.filter(q => q.status === 'active').length;
  const totalReportsCount = reports.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Tarjeta 1: Emergencias Activas */}
      <div 
        onClick={() => onCardClick('radar')}
        className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs group ${
          activeEmergencies.length > 0 
            ? 'border-rose-300 bg-rose-50/30 ring-2 ring-rose-200' 
            : activeFilter === 'radar'
              ? 'border-blue-500 ring-2 ring-blue-100'
              : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Emergencias S.O.S
          </span>
        </div>

        <div className="flex items-baseline gap-2 mt-2">
          <span className={`text-2xl font-bold tracking-tight ${activeEmergencies.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {activeEmergencies.length}
          </span>
          {activeEmergencies.length > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-100/70 border border-rose-200 px-2 py-0.5 rounded-full">
              {activeEmergencies.length} en curso
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
              En escucha 24/7
            </span>
          )}
        </div>

        <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between font-medium">
          <span>{activeEmergencies.length > 0 ? 'Despacho y auxilio prioritario' : 'Sin emergencias pendientes'}</span>
          <span className="text-[11px] text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">Ver Radar &rarr;</span>
        </p>
      </div>

      {/* Tarjeta 2: QRs Protegidos */}
      <div 
        onClick={() => onCardClick('qrs')}
        className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs group ${
          activeFilter === 'qrs' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            QRs Protegidos 24/7
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            {activeQrsCount}
          </span>
          <span className="text-xs font-medium text-slate-400">
            / {qrList.length} en sistema
          </span>
        </div>
        <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {Math.round((activeQrsCount / (qrList.length || 1)) * 100)}% vinculados
        </p>
      </div>

      {/* Tarjeta 3: Reportes de Tránsito */}
      <div 
        onClick={() => onCardClick('reportes')}
        className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-xs group ${
          activeFilter === 'reportes' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Reportes Viales
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            {totalReportsCount}
          </span>
          <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            Ciudadanos
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 font-medium">
          Imprudencias, choques y alertas en vía
        </p>
      </div>

      {/* Tarjeta 4: Tiempo Promedio de Respuesta */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tiempo de Respuesta
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            2.4 min
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> Óptimo
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 font-medium">
          Triage telefónico y enlace con patrullas
        </p>
      </div>
    </div>
  );
}
