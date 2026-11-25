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
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
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
          className="mt-3 w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer uppercase tracking-wider"
        >
          <span className="material-symbols-outlined text-[16px]">info</span>
          <span>Ver Beneficios</span>
        </button>
      </article>

      {/* Tarjeta 2: QR & Vehículo Vinculado */}
      {isQrActive && currentQr?.holder ? (
        <article className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/90 relative overflow-hidden transition-all hover:border-slate-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600 text-[18px]">
                verified
              </span>
              <span className="text-[13px] font-bold text-slate-900">
                Sticker {activeSku} Activo
              </span>
            </div>
            <span className="bg-emerald-50 text-emerald-700 font-semibold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-200">
              Protegido 24/7
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Vehículo / Placa</span>
              <span className="font-bold text-slate-800 text-[12px] block truncate mt-0.5">
                {currentQr.holder.vehicle}
              </span>
              <span className="font-bold text-blue-600 text-[11px]">
                {currentQr.holder.plate}
              </span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-semibold text-slate-400 uppercase block">Titular / Sangre</span>
              <span className="font-semibold text-slate-800 text-[12px] block truncate mt-0.5">
                {currentQr.holder.name}
              </span>
              <span className="font-bold text-rose-600 text-[11px]">
                Tipo: {currentQr.holder.bloodType || 'O+'}
              </span>
            </div>
          </div>

          {/* Contacto de Emergencia con Botón de Llamada Rápida */}
          {currentQr.holder.emergencyContactPhone && (
            <div className="mt-2.5 flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700 truncate pr-2">
                <span className="material-symbols-outlined text-slate-400 text-[16px] shrink-0">contact_phone</span>
                <span className="text-[11px] truncate font-medium">
                  {currentQr.holder.emergencyContactName || 'Familiar de Contacto'}
                </span>
              </div>
              <a
                href={`tel:${currentQr.holder.emergencyContactPhone}`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] px-3 py-1 rounded-lg uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-xs"
              >
                <span className="material-symbols-outlined text-[13px]">call</span>
                <span>Llamar</span>
              </a>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenQrModal}
            className="mt-3 w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2 rounded-xl uppercase tracking-wider transition-all cursor-pointer text-center shadow-xs"
          >
            Ver Ficha Completa
          </button>
        </article>
      ) : (
        /* Si está sin activar: Botón Activar QR */
        <button
          type="button"
          id="openActivarQrBtn"
          onClick={onOpenQrModal}
          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm py-3.5 px-5 rounded-xl flex items-center justify-between shadow-xs transition-all cursor-pointer group"
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
