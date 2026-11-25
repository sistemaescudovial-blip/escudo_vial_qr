import React, { useState } from 'react';
import escudoLogo from '../../assets/escudo-vial-logo.svg';

export default function MobileHeader({ onOpenReportModal }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-40 backdrop-blur-md pt-safe border-b border-slate-200/90 shadow-2xs bg-white/95">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo & Marca Institucional */}
        <div className="flex items-center gap-2.5">
          <div 
            className="w-10 h-10 rounded-xl overflow-hidden p-1 shadow-xs flex items-center justify-center shrink-0 bg-blue-600"
          >
            <img src={escudoLogo} alt="Escudo Vial" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-slate-900 font-bold text-[14px] tracking-tight leading-tight">
              ESCUDO VIAL
            </span>
            <span className="text-slate-500 text-[10.5px] font-medium tracking-wider uppercase">
              Seguridad 24/7
            </span>
          </div>
        </div>

        {/* Botón de Menú Desplegable */}
        <div className="relative">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label="Menú de opciones"
            className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-all cursor-pointer border border-slate-200 shadow-2xs"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>

          {/* Menú Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 transition-all animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 mb-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Menú</span>
                <button
                  type="button"
                  aria-label="Cerrar menú"
                  className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              <a
                href="#ayuda"
                onClick={(e) => { e.preventDefault(); setMenuOpen(false); alert('Central de Soporte Escudo Vial disponible 24/7 al 01-8000-911-000'); }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors text-[13px] font-medium group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[16px]">help</span>
                </div>
                <span>Ayuda</span>
              </a>

              <a
                href="#faq"
                onClick={(e) => { e.preventDefault(); setMenuOpen(false); alert('Preguntas frecuentes: El sticker QR es resistente a la intemperie y vincula tu póliza 24/7.'); }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors text-[13px] font-medium group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[16px]">quiz</span>
                </div>
                <span>Preguntas frecuentes</span>
              </a>

              <a
                href="#terminos"
                onClick={(e) => { e.preventDefault(); setMenuOpen(false); alert('Términos y condiciones: Servicio de auxilio vial sujeto a cobertura geográfica.'); }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition-colors text-[13px] font-medium group"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[16px]">description</span>
                </div>
                <span>Términos y condiciones</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
