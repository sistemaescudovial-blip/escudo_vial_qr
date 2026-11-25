import React from 'react';

export default function SosHero({ onOpenSosModal }) {
  const handlePanicClick = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200, 100, 400]);
      } catch {
        // Ignorar si el navegador bloquea la vibración
      }
    }
    onOpenSosModal();
  };

  return (
    <section className="flex flex-col items-center justify-center py-2 relative">
      <div className="relative flex items-center justify-center w-64 h-64">
        {/* Ondas de Radar Concéntricas */}
        <div className="absolute inset-0 rounded-full bg-rose-500/20 radar-wave-1 pointer-events-none" />
        <div className="absolute -inset-3 rounded-full bg-rose-500/15 radar-wave-2 pointer-events-none" />
        <div className="absolute -inset-6 rounded-full bg-rose-600/10 radar-wave-3 pointer-events-none" />

        {/* Anillo Exterior */}
        <div className="absolute inset-2 rounded-full bg-white/80 backdrop-blur-sm border-2 border-slate-200/90 flex items-center justify-center shadow-lg shadow-rose-500/15">
          {/* Corona de radar giratoria */}
          <svg className="absolute inset-0 w-full h-full animate-[spin_24s_linear_infinite]" viewBox="0 0 100 100">
            <circle cx="50" cy="50" fill="none" r="46" stroke="rgba(203, 213, 225, 0.6)" strokeDasharray="3 5" strokeWidth="1.2" />
            <circle cx="50" cy="50" fill="none" opacity="0.6" r="41" stroke="#3B82F6" strokeDasharray="8 12" strokeWidth="1" />
          </svg>

          {/* Disco Central S.O.S Interactivo */}
          <button
            type="button"
            id="sosPanicBtn"
            onClick={handlePanicClick}
            className="relative z-10 w-48 h-48 rounded-full flex flex-col items-center justify-center text-center transition-all duration-150 active:scale-95 active:brightness-110 focus:outline-none cursor-pointer group shadow-sos-3d"
            style={{
              background: 'radial-gradient(circle at 45% 25%, rgb(255, 82, 82) 0%, rgb(239, 68, 68) 42%, rgb(220, 38, 38) 78%, rgb(185, 28, 28) 100%)',
            }}
          >
            {/* Brillo superior especular */}
            <div className="absolute top-1.5 inset-x-8 h-14 rounded-t-full bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />

            {/* Ícono y Emblema de Emergencia */}
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-black/15 shadow-inner mb-1 text-white group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[30px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                e911_emergency
              </span>
            </div>

            {/* Tipografía Principal SOS */}
            <span className="text-white font-extrabold text-[36px] tracking-tight leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
              S.O.S
            </span>
            <span className="text-white/95 text-[11px] font-bold tracking-widest uppercase mt-1">
              BOTÓN DE PÁNICO
            </span>
          </button>
        </div>
      </div>

      <h2 className="text-slate-900 font-bold text-[14px] tracking-wider uppercase mt-3 mb-0.5 text-center">
        EN CASO DE UNA EMERGENCIA
      </h2>
      <p className="text-slate-500 text-[12px] font-medium tracking-wide mt-1 text-center">
        Presione el botón de pánico para enlace satelital con la central
      </p>
    </section>
  );
}
