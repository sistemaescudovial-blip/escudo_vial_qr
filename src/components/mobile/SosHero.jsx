import React from 'react';
import { useApp } from '../../context/AppContext';

export default function SosHero({ onOpenSosModal, activeIncident: propActiveIncident }) {
  const { emergencies, activeSku } = useApp();
  
  // Detectar incidente activo por prop o por lista de emergencias
  const activeIncident = propActiveIncident || (emergencies || []).find(e => 
    e?.sku && activeSku && e.sku.toUpperCase() === activeSku.replace(/[#-]/g, '').toUpperCase() && e.status !== 'resuelto'
  );

  const isEnCamino = activeIncident?.status === 'en_camino';
  const isActive = Boolean(activeIncident && !isEnCamino);

  const handlePanicClick = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200, 100, 400]);
      } catch {
        // Ignorar si el navegador bloquea la vibración
      }
    }
    // Si ya hay alerta activa (Azul Eléctrico o Verde), abre directamente el seguimiento o chat
    if (activeIncident) {
      onOpenSosModal(isEnCamino ? 'auxilio' : 'chat');
    } else {
      // Si está en reposo (Rojo), abre el prompt de titular o tercero
      onOpenSosModal('prompt');
    }
  };

  // Configuración dinámica según el estado del auxilio
  let config = {
    gradient: 'radial-gradient(circle at 45% 25%, rgb(255, 82, 82) 0%, rgb(239, 68, 68) 42%, rgb(220, 38, 38) 78%, rgb(185, 28, 28) 100%)',
    shadowColor: '#881337',
    glowColor: 'rgba(220, 38, 38, 0.45)',
    radarColor1: 'bg-rose-500/20',
    radarColor2: 'bg-rose-500/15',
    radarColor3: 'bg-rose-600/10',
    coronaStroke: '#EF4444',
    icon: 'e911_emergency',
    title: 'S.O.S',
    subtitle: 'BOTÓN DE PÁNICO',
    heading: 'EN CASO DE UNA EMERGENCIA',
    headingClass: 'text-slate-900',
    description: 'Presione el botón de pánico para enlace satelital con la central',
  };

  if (isEnCamino) {
    config = {
      gradient: 'radial-gradient(circle at 45% 25%, rgb(52, 211, 153) 0%, rgb(16, 185, 129) 42%, rgb(5, 150, 105) 78%, rgb(4, 120, 87) 100%)',
      shadowColor: '#064e3b',
      glowColor: 'rgba(5, 150, 105, 0.45)',
      radarColor1: 'bg-emerald-500/25',
      radarColor2: 'bg-emerald-500/15',
      radarColor3: 'bg-emerald-600/10',
      coronaStroke: '#10B981',
      icon: 'airport_shuttle',
      title: 'EN CAMINO',
      subtitle: 'UNIDAD DESPACHADA',
      heading: '¡UNIDAD DE AUXILIO EN TRAYECTO!',
      headingClass: 'text-emerald-700',
      description: `Despachado: ${activeIncident.dispatchedUnit || 'Ambulancia / Asistencia'}. Permanece en tu ubicación segura.`,
    };
  } else if (isActive) {
    config = {
      gradient: 'radial-gradient(circle at 45% 25%, rgb(96, 165, 250) 0%, rgb(37, 99, 235) 42%, rgb(29, 78, 216) 78%, rgb(30, 58, 138) 100%)',
      shadowColor: '#172554',
      glowColor: 'rgba(37, 99, 235, 0.55)',
      radarColor1: 'bg-blue-500/25',
      radarColor2: 'bg-blue-500/15',
      radarColor3: 'bg-blue-600/10',
      coronaStroke: '#2563EB',
      icon: 'sensors',
      title: 'S.O.S ACTIVO',
      subtitle: 'TRANSMITIENDO EN VIVO',
      heading: 'ALERTA EN PROCESO DE ATENCIÓN',
      headingClass: 'text-blue-600 font-extrabold',
      description: `Folio ${activeIncident.folio || 'S.O.S'}: Torre de control coordinando respuesta inmediata en tus coordenadas.`,
    };
  }

  return (
    <section className="flex flex-col items-center justify-center py-2 relative">
      <div className="relative flex items-center justify-center w-64 h-64">
        {/* Ondas de Radar Concéntricas Dinámicas */}
        <div className={`absolute inset-0 rounded-full ${config.radarColor1} radar-wave-1 pointer-events-none`} />
        <div className={`absolute -inset-3 rounded-full ${config.radarColor2} radar-wave-2 pointer-events-none`} />
        <div className={`absolute -inset-6 rounded-full ${config.radarColor3} radar-wave-3 pointer-events-none`} />

        {/* Carcasa Exterior 3D con Bisel Profundo */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-b from-slate-100 to-slate-200/90 border-2 border-slate-300 flex items-center justify-center shadow-inner">
          {/* Corona de radar giratoria */}
          <svg className="absolute inset-0 w-full h-full animate-[spin_24s_linear_infinite]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" fill="none" r="46" stroke="rgba(203, 213, 225, 0.6)" strokeDasharray="3 5" strokeWidth="1.2" />
            <circle cx="50" cy="50" fill="none" opacity="0.7" r="41" stroke={config.coronaStroke} strokeDasharray="8 12" strokeWidth="1.2" />
          </svg>

          {/* Disco Central S.O.S Interactivo con Hundimiento 3D Físico */}
          <button
            type="button"
            id="sosPanicBtn"
            onClick={handlePanicClick}
            className="relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center text-center focus:outline-none cursor-pointer group transition-all duration-100 ease-out select-none"
            style={{
              background: config.gradient,
              boxShadow: `0 12px 0 ${config.shadowColor}, 0 16px 22px ${config.glowColor}, inset 0 2px 4px rgba(255, 255, 255, 0.6)`,
              transform: 'translateY(0)',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translateY(10px)';
              e.currentTarget.style.boxShadow = `0 2px 0 ${config.shadowColor}, 0 4px 8px ${config.glowColor}, inset 0 8px 16px rgba(0, 0, 0, 0.5)`;
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 12px 0 ${config.shadowColor}, 0 16px 22px ${config.glowColor}, inset 0 2px 4px rgba(255, 255, 255, 0.6)`;
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.transform = 'translateY(10px)';
              e.currentTarget.style.boxShadow = `0 2px 0 ${config.shadowColor}, 0 4px 8px ${config.glowColor}, inset 0 8px 16px rgba(0, 0, 0, 0.5)`;
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = `0 12px 0 ${config.shadowColor}, 0 16px 22px ${config.glowColor}, inset 0 2px 4px rgba(255, 255, 255, 0.6)`;
            }}
          >
            {/* Brillo superior especular de cristal 3D */}
            <div className="absolute top-1.5 inset-x-8 h-14 rounded-t-full bg-gradient-to-b from-white/45 to-transparent pointer-events-none" />

            {/* Ícono y Emblema de Emergencia */}
            <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-black/15 shadow-inner mb-1 text-white group-hover:scale-105 transition-transform ${isActive ? 'animate-pulse' : ''}`}>
              <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                {config.icon}
              </span>
            </div>

            {/* Tipografía Principal */}
            <span className="text-white font-extrabold text-[32px] tracking-tight leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
              {config.title}
            </span>
            <span className="text-white/95 text-[10px] font-bold tracking-widest uppercase mt-1">
              {config.subtitle}
            </span>
          </button>
        </div>
      </div>

      <h2 className={`${config.headingClass} font-bold text-[14px] tracking-wider uppercase mt-4 mb-0.5 text-center transition-colors`}>
        {config.heading}
      </h2>
      <p className="text-slate-500 text-[12px] font-medium tracking-wide mt-1 text-center max-w-xs px-2 transition-colors">
        {config.description}
      </p>
    </section>
  );
}
