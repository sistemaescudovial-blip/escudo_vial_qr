import React from 'react';

export default function BottomNav({ 
  onOpenAfiliacionModal, 
  onOpenSosModal, 
  onOpenSofiaModal 
}) {
  return (
    <nav className="fixed bottom-3 inset-x-3 z-40 max-w-md mx-auto pointer-events-none pb-safe">
      <div className="pointer-events-auto bg-white/95 backdrop-blur-xl rounded-full shadow-lg shadow-slate-200/60 border border-slate-200/90 px-4 py-2 flex items-center justify-around">
        {/* Tab 1: Afiliación */}
        <button
          type="button"
          onClick={onOpenAfiliacionModal}
          className="flex flex-col items-center justify-center gap-1 min-w-[76px] py-1 text-slate-500 hover:text-blue-600 active:scale-95 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100">
            <span className="material-symbols-outlined text-[20px]">card_membership</span>
          </div>
          <span className="text-[11px] font-semibold tracking-tight">Afiliación</span>
        </button>

        {/* Tab 2: S.O.S Central Flotante - Llamada directa */}
        <a
          href="tel:02129010911"
          className="flex flex-col items-center justify-center gap-1 min-w-[76px] -mt-7 active:scale-95 transition-all cursor-pointer group"
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-md shadow-rose-500/30 border-4 border-white group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-[26px]" style={{ fontVariationSettings: '"FILL" 1' }}>
              call
            </span>
          </div>
          <span className="text-[11px] font-bold tracking-tight text-rose-600 mt-0.5">
            S.O.S
          </span>
        </a>

        {/* Tab 3: Sofía IA - WhatsApp directo */}
        <a
          href="https://wa.me/584220420773"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-1 min-w-[76px] py-1 text-slate-500 hover:text-emerald-600 active:scale-95 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.45 1.03 2.62.13.17 1.78 2.71 4.3 3.8.6.26 1.07.41 1.43.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.17-.47-.3z" />
            </svg>
          </div>
          <span className="text-[11px] font-semibold tracking-tight">Sofía IA</span>
        </a>
      </div>
    </nav>
  );
}
