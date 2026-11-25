import React from 'react';
import { useApp } from '../context/AppContext';
import MobileApp from '../components/mobile/MobileApp';
import DashboardMain from '../components/dashboard/DashboardMain';
import AdminLogin from '../components/dashboard/AdminLogin';
import escudoLogo from '../assets/escudo-vial-logo.svg';
import { Smartphone, LayoutDashboard, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DemoSplitPage() {
  const { activeSku, isAdminAuthenticated } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Barra de cabecera del modo demo (Respond.io style) */}
      <div className="bg-white border-b border-slate-200/90 px-4 py-2.5 flex items-center justify-between text-xs text-slate-700 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center p-1 shrink-0">
            <img src={escudoLogo} alt="Escudo Vial" className="w-full h-full object-contain" />
          </div>
          <span className="font-black text-blue-600 tracking-tight text-sm">ESCUDO VIAL</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-800 font-semibold text-xs">Simulador Dual (Móvil Conductor + Torre de Control)</span>
          <span className="hidden sm:inline-flex bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full text-[10px] border border-blue-100">
            DEMO INTERACTIVA
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 font-medium transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">Abrir Móvil en pestaña</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            to="/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 font-medium transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden md:inline">Abrir Panel en pestaña</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 min-h-screen">
        {/* Lado Izquierdo: Móvil Conductor */}
        <div className="xl:col-span-4 bg-slate-100/60 border-r border-slate-200 p-4 sm:p-6 flex flex-col items-center justify-start overflow-y-auto max-h-screen">
          <div className="w-full max-w-sm mb-3 flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 text-[11px]">
              <Smartphone className="w-4 h-4 text-blue-600" />
              Vista del Conductor
            </span>
            <span className="text-[11px] bg-white text-blue-700 font-bold px-2.5 py-0.5 rounded-full border border-slate-200 shadow-2xs">
              {activeSku}
            </span>
          </div>

          <div className="w-full max-w-sm rounded-[42px] p-2.5 bg-slate-900 border-4 border-slate-300 shadow-2xl overflow-hidden ring-8 ring-slate-200/80">
            <div className="rounded-[32px] overflow-hidden relative max-h-[820px] overflow-y-auto no-scrollbar bg-slate-50">
              <MobileApp />
            </div>
          </div>
        </div>

        {/* Lado Derecho: Panel Call Center */}
        <div className="xl:col-span-8 bg-[#F8FAFC] overflow-y-auto max-h-screen">
          {isAdminAuthenticated ? <DashboardMain /> : <AdminLogin />}
        </div>
      </div>
    </div>
  );
}
