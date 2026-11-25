import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import escudoLogo from '../../assets/escudo-vial-logo.svg';
import { Lock, KeyRound, AlertCircle, ArrowRight } from 'lucide-react';

export default function AdminLogin() {
  const { loginAdmin } = useApp();
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (loginAdmin(password)) {
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Patrón de puntos sutil de fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 relative z-10">
        {/* Logo Institucional */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3.5 p-2">
            <img src={escudoLogo} alt="Escudo Vial" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            CENTRAL DE CONTROL & DESPACHO
          </h2>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-600 bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider mt-2">
            
            Escudo Vial • Acceso 24/7
          </span>
          <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
            Ingreso exclusivo para operadores de monitoreo vial, radiopatrullas y triage de ambulancias.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Contraseña incorrecta. Verifica e intenta nuevamente.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              <span>Contraseña de Operador</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu clave de acceso..."
                className="w-full bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-xs py-3.5 rounded-xl uppercase tracking-wider shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
          >
            <span>INGRESAR A LA TORRE DE DESPACHO</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
