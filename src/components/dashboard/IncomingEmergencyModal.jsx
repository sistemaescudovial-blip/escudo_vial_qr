import React, { useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  AlertTriangle, 
  Phone, 
  MessageSquare, 
  MapPin, 
  Car, 
  User, 
  CheckCircle, 
  Volume2, 
  VolumeX, 
  ExternalLink,
  X
} from 'lucide-react';

export default function IncomingEmergencyModal({ onAccepted }) {
  const { 
    unreadAlert, 
    setUnreadAlert, 
    soundEnabled, 
    setSoundEnabled, 
    updateEmergencyStatus 
  } = useApp();

  const audioCtxRef = useRef(null);
  const intervalRef = useRef(null);

  // Reproducir sirena repetitiva de emergencia mientras el modal esté abierto
  useEffect(() => {
    if (!unreadAlert || unreadAlert.status !== 'critico' || !soundEnabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const playSirenTone = () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
          audioCtxRef.current = new AudioContextClass();
        }

        const ctx = audioCtxRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume();
        }

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.35);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.7);

        gain.gain.setValueAtTime(0.22, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.75);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.75);
      } catch (err) {
        console.warn('Alarma sonora en espera de interacción:', err);
      }
    };

    playSirenTone();
    intervalRef.current = setInterval(playSirenTone, 1200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [unreadAlert, soundEnabled]);

  if (!unreadAlert || unreadAlert.status !== 'critico') {
    return null;
  }

  const handleAcceptAndDispatch = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    updateEmergencyStatus(unreadAlert.id, 'en_camino', 'Unidad de Auxilio Vial');
    setUnreadAlert(null);
    if (onAccepted) onAccepted(unreadAlert.id);
  };

  const handleDismiss = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setUnreadAlert(null);
  };

  const mapsUrl = unreadAlert.location?.lat && unreadAlert.location?.lng
    ? `https://www.google.com/maps?q=${unreadAlert.location.lat},${unreadAlert.location.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(unreadAlert.location?.address || 'Caracas, Venezuela')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Ventana Flotante Modal */}
      <div className="bg-white rounded-3xl w-full max-w-xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        
        {/* Cabecera de Alarma con Sirena Visual */}
        <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white"></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-300 animate-bounce" />
                <h2 className="text-sm font-bold tracking-wide uppercase">
                  ¡NUEVA ALERTA S.O.S ENTRANTE!
                </h2>
              </div>
              <p className="text-[11px] text-white/90 font-medium">
                Atención inmediata requerida en Torre de Control 24/7
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Control Rápido de Sirena Sonora */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Silenciar sirena' : 'Activar sonido'}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                soundEnabled 
                  ? 'bg-white/20 text-white border-white/40 hover:bg-white/30' 
                  : 'bg-black/30 text-white/60 border-white/20 hover:bg-black/40'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Cerrar / Minimizar */}
            <button
              type="button"
              onClick={handleDismiss}
              title="Minimizar ventana al banner superior"
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal con Detalles de la Emergencia */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto max-h-[75vh]">
          
          {/* Identificadores: Folio, SKU y Hora */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200/90">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Código Folio</span>
              <span className="font-bold text-lg text-rose-600">
                {unreadAlert.folio}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sticker QR</span>
              <span className="font-semibold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                {unreadAlert.sku}
              </span>
            </div>
          </div>

          {/* Ficha del Titular y Reportante */}
          <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500 font-semibold uppercase text-[10px] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> Titular Registrado
              </span>
              <span className="font-bold text-slate-900 text-sm">{unreadAlert.holderName}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 border-b border-slate-200/80 pb-2">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[9.5px] block">Cédula</span>
                <span className="font-semibold text-slate-800 text-xs">{unreadAlert.cedula}</span>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[9.5px] block">Reportado Por</span>
                <span className={`font-bold text-xs capitalize ${
                  unreadAlert.reporterType === 'titular' ? 'text-emerald-700' : 'text-blue-700'
                }`}>
                  {unreadAlert.reporterType === 'titular' ? 'Titular' : 'Tercero / Testigo'}
                </span>
              </div>
            </div>

            <div className="border-b border-slate-200/80 pb-2">
              <span className="text-slate-400 font-semibold uppercase text-[9.5px] block">Vehículo / Placa</span>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-xs mt-0.5">
                <Car className="w-4 h-4 text-blue-600" />
                <span>{unreadAlert.vehicle || 'Vehículo en vía'}</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-semibold uppercase text-[9.5px] block">Ubicación GPS Detectada</span>
              <div className="flex items-start gap-1.5 text-slate-800 font-medium text-xs mt-1">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{unreadAlert.location?.address || 'Ubicación reportada'}</span>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Abrir coordenadas en Google Maps</span>
                </a>
              </div>
            </div>
          </div>

          {/* Acciones de Contacto Rápido */}
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={`tel:${unreadAlert.phone}`}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <Phone className="w-4 h-4 text-slate-500" />
              <span>Llamar al Teléfono</span>
            </a>

            <a
              href={`https://wa.me/${unreadAlert.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${unreadAlert.holderName}, nos comunicamos desde la Central de Monitoreo de Escudo Vial 24/7 con respecto a tu alerta de emergencia ${unreadAlert.folio}.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Directo</span>
            </a>
          </div>

          {/* BOTÓN PRINCIPAL: ACEPTAR Y ATENDER EMERGENCIA */}
          <button
            type="button"
            onClick={handleAcceptAndDispatch}
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-sm shadow-blue-500/25 cursor-pointer uppercase tracking-wider"
          >
            <CheckCircle className="w-5 h-5 text-white" />
            <span>ACEPTAR Y ATENDER EMERGENCIA</span>
          </button>

          {/* Botón Secundario: Ver en el Radar */}
          <button
            type="button"
            onClick={handleDismiss}
            className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 py-1.5 cursor-pointer transition-colors"
          >
            Ver en el Mapa Táctico sin cerrar caso
          </button>
        </div>
      </div>
    </div>
  );
}
