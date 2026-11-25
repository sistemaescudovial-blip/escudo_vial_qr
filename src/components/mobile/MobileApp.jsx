import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import MobileHeader from './MobileHeader';
import SosHero from './SosHero';
import ActionCards from './ActionCards';
import BottomNav from './BottomNav';
import { Truck, Radio, ChevronRight } from 'lucide-react';

import ModalActivarQr from './ModalActivarQr';
import ModalReportar from './ModalReportar';
import ModalSos from './ModalSos';
import ModalTelemedicina from './ModalTelemedicina';
import ModalSofia from './ModalSofia';
import ModalAfiliacion from './ModalAfiliacion';

export default function MobileApp({ showSimulatorBar = false }) {
  const { sku: routeSku } = useParams();
  const { activeSku, setActiveSku, qrList, currentQr: contextQr, emergencies } = useApp();

  // Estados de modales
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isTelemedicinaModalOpen, setIsTelemedicinaModalOpen] = useState(false);
  const [isSofiaModalOpen, setIsSofiaModalOpen] = useState(false);
  const [isAfiliacionModalOpen, setIsAfiliacionModalOpen] = useState(false);

  // SKU prioritario: Si viene por URL /v/:sku o del contexto
  const effectiveSku = (routeSku || activeSku || 'EV8842VE').replace(/[#-]/g, '').toUpperCase();
  const matchedQr = qrList.find(q => q.sku.toUpperCase() === effectiveSku);
  const currentQr = matchedQr || (contextQr?.sku?.toUpperCase() === effectiveSku ? contextQr : {
    sku: effectiveSku,
    status: 'inactive',
    holder: null,
    scansCount: 0
  });

  const isQrActive = currentQr?.status === 'active';
  const cleanSku = effectiveSku;

  // Detectar incidente activo en curso para este sticker
  const activeIncident = (emergencies || []).find(e => 
    e.sku?.toUpperCase() === effectiveSku.toUpperCase() && e.status !== 'resuelto'
  );

  return (
    <div className="w-full min-h-[100dvh] bg-[#F8FAFC] text-slate-800 font-sans flex flex-col relative antialiased selection:bg-blue-600 selection:text-white">
      {/* Barra de simulación solo si se solicita explícitamente en modo demo */}
      {showSimulatorBar && (
        <div className="w-full bg-white border-b border-slate-200 px-3 py-1 flex items-center justify-between text-xs text-slate-700 z-50">
          <span className="text-[11px] text-blue-600 font-semibold truncate">QR: {cleanSku}</span>
          <select 
            value={activeSku}
            onChange={(e) => setActiveSku(e.target.value)}
            className="bg-slate-50 text-slate-800 text-[11px] rounded-lg px-2 py-0.5 border border-slate-200"
          >
            {qrList.map(q => {
              const itemCleanSku = q.sku.replace(/[#-]/g, '').toUpperCase();
              return (
                <option key={q.sku} value={q.sku}>
                  {itemCleanSku} ({q.status === 'active' ? 'Activo' : 'Sin activar'})
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Header Institucional Fijo Superior */}
      <MobileHeader onOpenReportModal={() => {
        if (!isQrActive) {
          setIsQrModalOpen(true);
        } else {
          setIsReportModalOpen(true);
        }
      }} />

      {/* Contenedor Principal de la App */}
      <main className="flex-1 flex flex-col relative w-full pt-16 pb-36">
        <div className="flex flex-col w-full px-4 space-y-4 max-w-md mx-auto relative">
          
          {/* ESTADO 1: STICKER NUEVO / SIN VINCULAR */}
          {!isQrActive ? (
            <div className="flex flex-col items-center text-center mt-3 animate-in fade-in zoom-in-95 duration-200">
              {/* Ícono de Escaneo / Activación */}
              <div className="relative flex items-center justify-center w-24 h-24 my-3">
                <div className="w-20 h-20 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs border border-blue-100">
                  <span className="material-symbols-outlined text-[42px]">
                    qr_code_scanner
                  </span>
                </div>
              </div>

              {/* Badge del SKU */}
              <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-xs font-semibold tracking-wider my-1.5">
                
                <span>STICKER DISPONIBLE: {cleanSku}</span>
              </div>

              <h2 className="text-slate-900 font-bold text-xl tracking-tight leading-tight mt-1">
                ¡Bienvenido a Escudo Vial!
              </h2>
              <p className="text-slate-500 text-xs font-medium leading-relaxed max-w-xs mt-2">
                Has escaneado un sticker oficial. Para habilitar tu <strong>botón de auxilio S.O.S satelital</strong> y cobertura 24/7, registra tu vehículo a continuación:
              </p>

              {/* Botón Principal de Vinculación */}
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="mt-5 w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider shadow-sm shadow-blue-500/20 transition-all cursor-pointer group"
              >
                <span className="material-symbols-outlined text-[20px]">
                  verified_user
                </span>
                <span>VINCULAR Y ACTIVAR AHORA</span>
              </button>

              {/* Sección de Servicios Bloqueados */}
              <div className="w-full mt-5 bg-white rounded-2xl p-4 border border-slate-200/90 text-left shadow-xs">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
                  SERVICIOS PENDIENTES POR ACTIVAR
                </span>

                <div className="space-y-2 text-xs">
                  <div 
                    onClick={() => setIsQrModalOpen(true)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">lock</span>
                      <span className="font-medium text-slate-700">Botón de Pánico S.O.S Satelital</span>
                    </div>
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">Bloqueado</span>
                  </div>

                  <div 
                    onClick={() => setIsQrModalOpen(true)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">lock</span>
                      <span className="font-medium text-slate-700">Triage de Ambulancia y Grúa 24/7</span>
                    </div>
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">Bloqueado</span>
                  </div>

                  <div 
                    onClick={() => setIsQrModalOpen(true)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-[18px]">lock</span>
                      <span className="font-medium text-slate-700">Contacto Familiar y Ficha Médica</span>
                    </div>
                    <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">Bloqueado</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ESTADO 2: STICKER ACTIVO / PROTEGIDO */
            <>
              {/* Badge superior compacto de sticker protegido */}
              <div className="flex items-center justify-between bg-white px-4 py-2 rounded-full border border-slate-200/90 text-xs text-slate-800 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-slate-800">Escudo Vial 24/7</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-600 font-semibold text-[11px]">Protegido</span>
                </div>
                <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-2.5 py-0.5 rounded-full shrink-0 ml-2 border border-slate-200">
                  {cleanSku}
                </span>
              </div>

              {/* Banner de Auxilio Activo en Tiempo Real */}
              {activeIncident && (
                <div 
                  onClick={() => setIsSosModalOpen(true)}
                  className="w-full bg-white border border-rose-200 p-3.5 rounded-2xl shadow-xs flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] group animate-in fade-in relative"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                      activeIncident.status === 'en_camino' 
                        ? 'bg-blue-600' 
                        : 'bg-rose-600'
                    }`}>
                      {activeIncident.status === 'en_camino' ? (
                        <Truck className="w-5 h-5" />
                      ) : (
                        <Radio className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
                      )}
                    </div>
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-[13px] tracking-tight">
                          {activeIncident.status === 'en_camino' ? '¡Unidad en Camino!' : 'Alerta S.O.S Activa'}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md whitespace-nowrap border border-slate-200">
                          {activeIncident.folio}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 font-medium truncate max-w-[180px] sm:max-w-xs">
                        {activeIncident.status === 'en_camino' 
                          ? `Despachado: ${activeIncident.dispatchedUnit || 'Unidad de Auxilio'}` 
                          : 'Torre 24/7 coordinando asistencia'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs shrink-0 ml-2">
                    <span>Ver</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}

              {/* Botón de Pánico Central S.O.S */}
              <SosHero onOpenSosModal={() => setIsSosModalOpen(true)} />

              {/* Tarjetas de Asistencia y QR */}
              <ActionCards 
                onOpenTelemedicinaModal={() => setIsTelemedicinaModalOpen(true)}
                onOpenQrModal={() => setIsQrModalOpen(true)}
                onOpenReportModal={() => setIsReportModalOpen(true)}
              />
            </>
          )}
        </div>
      </main>

      {/* Barra Inferior de Navegación Flotante */}
      {isQrActive && (
        <BottomNav 
          onOpenAfiliacionModal={() => setIsAfiliacionModalOpen(true)}
          onOpenSosModal={() => setIsSosModalOpen(true)}
          onOpenSofiaModal={() => setIsSofiaModalOpen(true)}
        />
      )}

      {/* Modales Interactivos */}
      <ModalActivarQr 
        isOpen={isQrModalOpen} 
        onClose={() => setIsQrModalOpen(false)} 
        targetSku={cleanSku}
      />

      <ModalReportar 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
      />

      <ModalSos 
        isOpen={isSosModalOpen} 
        onClose={() => setIsSosModalOpen(false)} 
      />

      <ModalTelemedicina 
        isOpen={isTelemedicinaModalOpen} 
        onClose={() => setIsTelemedicinaModalOpen(false)} 
      />

      <ModalSofia 
        isOpen={isSofiaModalOpen} 
        onClose={() => setIsSofiaModalOpen(false)} 
      />

      <ModalAfiliacion 
        isOpen={isAfiliacionModalOpen} 
        onClose={() => setIsAfiliacionModalOpen(false)} 
      />
    </div>
  );
}
