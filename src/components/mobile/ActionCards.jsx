import React from 'react';
import { useApp } from '../../context/AppContext';

export default function ActionCards({ 
  onOpenTelemedicinaModal, 
  onOpenQrModal
}) {
  const { currentQr, activeSku } = useApp();
  const isQrActive = currentQr?.status === 'active';

  return (
    <section className="flex flex-col space-y-3 pt-1">
      {/* Tarjeta 1: Central Médica 24/7 */}
      <article className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/90 relative overflow-hidden transition-all hover:border-slate-300">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#16A085]/10 text-[#16A085] flex items-center justify-center shrink-0 border border-[#16A085]/20 shadow-2xs">
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: '"FILL" 1' }}>
              medical_services
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-slate-900 font-bold text-[15px] leading-tight">
                Atención Médica
              </h4>
              <span className="bg-slate-100 text-slate-600 border border-slate-200 font-semibold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                Próximamente
              </span>
            </div>
            <p className="text-slate-500 text-[12px] mt-1 leading-snug font-normal">
              Orientación médica telefónica inmediata y triage de ambulancias.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenTelemedicinaModal}
          className="mt-3 w-full bg-[#16A085] hover:bg-[#138d75] active:scale-[0.99] text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-[#16A085]/25 cursor-pointer uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-[16px]">info</span>
          <span>Ver Beneficios</span>
        </button>
      </article>

      {/* Si está sin activar: Botón Activar QR */}
      {!isQrActive && (
        <button
          type="button"
          id="openActivarQrBtn"
          onClick={onOpenQrModal}
          className="w-full bg-[#4B2C84] hover:bg-[#3d236b] active:scale-[0.99] text-white font-semibold text-sm py-3.5 px-5 rounded-xl flex items-center justify-between shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="leading-tight tracking-wide font-bold">ACTIVAR QR</span>
              <span className="text-[11px] text-white/90 font-medium">Vincular vehículo a cobertura 24/7</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-white/20 px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-wider uppercase">
            <span>Comenzar</span>
            <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">
              arrow_forward
            </span>
          </div>
        </button>
      )}
    </section>
  );
}
