import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import escudoLogo from '../../assets/escudo-vial-logo.svg';
import { 
  Volume2, 
  VolumeX, 
  Radio, 
  Search,
  LogOut,
  KeyRound,
  Check,
  ChevronDown
} from 'lucide-react';

export default function DashboardHeader({ onSearch, activeTab, setActiveTab }) {
  const { 
    soundEnabled, 
    setSoundEnabled, 
    unreadAlert, 
    setUnreadAlert, 
    logoutAdmin,
    adminUsername,
    adminPassword,
    updateAdminCredentials
  } = useApp();

  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [editUser, setEditUser] = useState(adminUsername || 'Operador Alpha');
  const [editPass, setEditPass] = useState(adminPassword || '12345');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setEditUser(adminUsername || 'Operador Alpha');
    setEditPass(adminPassword || '12345');
  }, [adminUsername, adminPassword]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setDateStr(now.toLocaleDateString('es-VE', { weekday: 'short', day: 'numeric', month: 'short' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveCredentials = (e) => {
    e.preventDefault();
    if (editUser.trim() && editPass.trim()) {
      updateAdminCredentials(editUser.trim(), editPass.trim());
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditingCredentials(false);
      }, 1200);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'OP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 shadow-xs">
      {/* Alerta Banner Superior si hay emergencia crítica */}
      {unreadAlert && unreadAlert.status === 'critico' && (
        <div className="bg-rose-600 text-white px-4 py-2 flex items-center justify-between shadow-sm animate-beacon">
          <div className="flex items-center gap-3">
            <span className="p-1 rounded-full bg-white/20">
              <Radio className="w-4 h-4 text-white" />
            </span>
            <span className="font-bold text-sm tracking-wide">
              ¡NUEVA ALERTA S.O.S ENTRANTE!
            </span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-md font-bold">
              {unreadAlert.folio} • SKU: {unreadAlert.sku}
            </span>
            <span className="text-xs text-white/90 hidden md:inline">
              Titular: {unreadAlert.holderName} ({unreadAlert.phone})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('radar');
                setUnreadAlert(null);
              }}
              className="bg-white text-rose-700 hover:bg-rose-50 px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              Atender de Inmediato
            </button>
            <button
              onClick={() => setUnreadAlert(null)}
              className="text-white/80 hover:text-white p-1 text-sm font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Marca Limpia Escudo Vial */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-500/20 p-1 shrink-0">
            <img src={escudoLogo} alt="Escudo Vial" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">
              ESCUDO VIAL
            </h1>
            <span className="text-[11px] font-semibold text-slate-500 tracking-wide block mt-1 leading-none">
              V 2.0
            </span>
          </div>
        </div>

        {/* Buscador Global y Herramientas */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Buscador */}
          <div className="relative min-w-[220px] sm:min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar SKU, Cédula, Placa o Folio..."
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Reloj y Fecha (Sin icono a la izquierda) */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium">
            <span className="font-semibold text-slate-800">{timeStr}</span>
            <span className="text-slate-300">|</span>
            <span className="capitalize">{dateStr}</span>
          </div>

          {/* Control de Sonido de Sirena */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Silenciar alertas sonoras' : 'Activar sonido de sirena'}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              soundEnabled 
                ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' 
                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Avatar del Operador con Menú Desplegable */}
          <div className="relative pl-1">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              title="Menú del Operador"
              className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              {getInitials(adminUsername)}
            </button>

            {/* Menú Desplegable al hacer clic en el Avatar */}
            {isMenuOpen && (
              <>
                {/* Backdrop invisible para cerrar al hacer clic afuera */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsMenuOpen(false)} 
                />

                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Cabecera del Perfil */}
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                      {getInitials(adminUsername)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {adminUsername || 'Operador Alpha'}
                      </h4>
                      <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full mt-0.5">
                        En línea
                      </span>
                    </div>
                  </div>

                  {/* Sección de Configuración de Usuario y Contraseña */}
                  <div className="py-3 border-b border-slate-100">
                    {!isEditingCredentials ? (
                      <button
                        type="button"
                        onClick={() => setIsEditingCredentials(true)}
                        className="w-full text-left flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 p-2 rounded-xl transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-blue-600" />
                          <span>Configurar usuario y contraseña</span>
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    ) : (
                      <form onSubmit={handleSaveCredentials} className="flex flex-col gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                          Configuración de Acceso
                        </span>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            Nombre de usuario
                          </label>
                          <input
                            type="text"
                            required
                            value={editUser}
                            onChange={(e) => setEditUser(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                            Contraseña del sistema
                          </label>
                          <input
                            type="password"
                            required
                            value={editPass}
                            onChange={(e) => setEditPass(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-blue-600"
                          />
                        </div>

                        {saveSuccess && (
                          <div className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-1.5 flex items-center gap-1 font-semibold">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>¡Credenciales guardadas con éxito!</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditingCredentials(false)}
                            className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 font-medium text-xs px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Botón de Cerrar Sesión */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        logoutAdmin();
                      }}
                      className="w-full flex items-center gap-2 text-rose-600 hover:bg-rose-50 p-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-600" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
