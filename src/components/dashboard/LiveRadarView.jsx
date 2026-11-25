import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import TacticalLeafletMap from './TacticalLeafletMap';
import escudoLogo from '../../assets/escudo-vial-logo.svg';
import { 
  AlertCircle, 
  Phone, 
  MessageSquare, 
  MapPin, 
  CheckCircle, 
  Clock, 
  Navigation, 
  ExternalLink, 
  Car, 
  Trash2, 
  Send, 
  X, 
  Download, 
  ZoomIn, 
  Radio, 
  FileText, 
  Sparkles, 
  Inbox, 
  ChevronRight 
} from 'lucide-react';

export default function LiveRadarView({ 
  searchQuery = '',
  selectedEmergencyId: propSelectedId,
  onSelectEmergency: propSetSelectedId
}) {
  const { 
    emergencies, 
    updateEmergencyStatus, 
    sendEmergencyChatMessage,
    deleteEmergency,
    clearResolvedEmergencies
  } = useApp();
  
  const [radarFilter, setRadarFilter] = useState('activas'); // 'activas' | 'todas'
  const [localSelectedId, setLocalSelectedId] = useState(emergencies[0]?.id || null);
  const [rightColTab, setRightColTab] = useState('chat'); // 'chat' | 'inbox' | 'ficha'
  const [lastReadCounts, setLastReadCounts] = useState({});
  const [newNoteText, setNewNoteText] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState(null);
  const chatScrollRef = useRef(null);

  const selectedEmergencyId = propSelectedId !== undefined && propSelectedId !== null ? propSelectedId : localSelectedId;
  const setSelectedEmergencyId = propSetSelectedId || setLocalSelectedId;

  // Filtrado por buscador
  const filteredEmergencies = emergencies.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.folio.toLowerCase().includes(q) ||
      e.sku.toLowerCase().includes(q) ||
      e.cedula.toLowerCase().includes(q) ||
      e.holderName.toLowerCase().includes(q) ||
      e.phone.toLowerCase().includes(q) ||
      (e.vehicle && e.vehicle.toLowerCase().includes(q))
    );
  });

  const activeEmergencies = filteredEmergencies.filter(e => e.status !== 'resuelto');
  const resolvedEmergencies = filteredEmergencies.filter(e => e.status === 'resuelto');
  const displayedEmergencies = radarFilter === 'activas' ? activeEmergencies : filteredEmergencies;

  const selectedEmergency = emergencies.find(e => e.id === selectedEmergencyId) || displayedEmergencies[0] || emergencies[0] || null;

  // Auto-scroll en la ventana de chat táctico
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [selectedEmergency?.notes]);

  const handleSendChatMessage = (text) => {
    const textToSend = text || newNoteText;
    if (!textToSend || !textToSend.trim() || !selectedEmergency) return;
    sendEmergencyChatMessage(selectedEmergency.id, textToSend.trim(), 'central', 'Operador Alpha');
    setNewNoteText('');
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    handleSendChatMessage();
  };

  const handleDispatch = (unit) => {
    if (!selectedEmergency) return;
    updateEmergencyStatus(selectedEmergency.id, 'en_camino', unit);
  };

  const handleResolve = () => {
    if (!selectedEmergency) return;
    updateEmergencyStatus(selectedEmergency.id, 'resuelto');
  };

  const handleDelete = (id) => {
    const targetId = id || selectedEmergency?.id;
    if (!targetId) return;
    deleteEmergency(targetId);
    if (selectedEmergencyId === targetId) {
      setSelectedEmergencyId(null);
    }
  };

  // Control de alertas visuales y mensajes no leídos del conductor
  const notesCount = selectedEmergency?.notes?.length || 0;
  const lastRead = selectedEmergency ? (lastReadCounts[selectedEmergency.id] ?? notesCount) : 0;
  const hasUnread = notesCount > lastRead;
  const lastMsg = selectedEmergency?.notes?.[notesCount - 1];
  const isLastFromDriver = lastMsg && lastMsg.sender === 'usuario';
  const showGlowAlert = hasUnread && isLastFromDriver;

  // Total de conversaciones con mensajes pendientes del conductor en todo el radar
  const totalUnreadConversations = displayedEmergencies.filter(e => {
    const count = e.notes?.length || 0;
    const read = lastReadCounts[e.id] ?? count;
    const last = e.notes?.[count - 1];
    return count > read && last && last.sender === 'usuario';
  }).length;

  // Marcar como leído cuando el operador está en la pestaña de chat
  useEffect(() => {
    if (selectedEmergency && rightColTab === 'chat') {
      setLastReadCounts(prev => ({
        ...prev,
        [selectedEmergency.id]: selectedEmergency.notes?.length || 0
      }));
    }
  }, [selectedEmergency?.id, selectedEmergency?.notes?.length, rightColTab]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
      {/* Columna Izquierda: Mapa de Radar y Rutas (7 Columnas en Desktop) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs relative overflow-hidden flex flex-col">
          {/* Cabecera del Mapa */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 z-10 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              
              <h3 className="text-slate-900 font-bold text-sm tracking-tight flex items-center gap-2">
                RADAR VIAL EN TIEMPO REAL
              </h3>
            </div>

            {/* Toggle de Alertas & Botón para Limpiar Resueltos */}
            <div className="flex items-center gap-2">
              <div className="bg-slate-100 p-1 rounded-xl border border-slate-200/80 flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => setRadarFilter('activas')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    radarFilter === 'activas' 
                      ? 'bg-white text-blue-600 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Activas ({activeEmergencies.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRadarFilter('todas')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    radarFilter === 'todas' 
                      ? 'bg-white text-blue-600 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas ({emergencies.length})
                </button>
              </div>

              {resolvedEmergencies.length > 0 && (
                <button
                  type="button"
                  onClick={clearResolvedEmergencies}
                  className="bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-medium px-2.5 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                  title="Retirar del mapa todos los casos que ya fueron atendidos/resueltos"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Limpiar Resueltos ({resolvedEmergencies.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Mapa Interactivo con Calles Reales */}
          <div className="my-3 rounded-xl overflow-hidden border border-slate-200">
            <TacticalLeafletMap 
              emergencies={displayedEmergencies}
              selectedEmergency={selectedEmergency}
              onSelectEmergency={(id) => setSelectedEmergencyId(id)}
            />
          </div>

          {/* Selector Rápido de Emergencias en el Mapa */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {displayedEmergencies.length === 0 ? (
              <div className="text-xs text-slate-500 py-2 px-3 italic bg-slate-50 rounded-xl border border-slate-200">
                {radarFilter === 'activas' ? 'No hay casos activos pendientes' : 'Sin alertas registradas'}
              </div>
            ) : (
              displayedEmergencies.map((emg) => {
                const isSelected = selectedEmergency?.id === emg.id;
                return (
                  <button
                    key={emg.id}
                    onClick={() => setSelectedEmergencyId(emg.id)}
                    className={`px-3 py-2 rounded-xl text-left transition-all shrink-0 border cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-50/70 border-blue-500 text-blue-900 ring-1 ring-blue-500 shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {emg.folio}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        emg.status === 'critico' ? 'bg-rose-100 text-rose-700' : emg.status === 'en_camino' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {emg.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[140px] mt-0.5 font-medium">
                      {emg.holderName}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Columna Derecha: Tarjeta de Despacho Operativo & Chat (5 Columnas en Desktop) */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {selectedEmergency ? (
          <div className={`bg-white rounded-2xl p-5 border transition-all duration-200 shadow-xs flex flex-col gap-3.5 ${
            showGlowAlert ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200/90'
          }`}>
            {/* Header del Caso */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-slate-900">
                    {selectedEmergency.folio}
                  </span>
                  {selectedEmergency.status === 'critico' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                      ALERTA CRÍTICA
                    </span>
                  )}
                  {selectedEmergency.status === 'resuelto' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 text-slate-600">
                      CASO RESUELTO
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Reportado: {new Date(selectedEmergency.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {/* SKU Badge */}
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sticker QR</span>
                <span className="font-bold text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200">
                  {selectedEmergency.sku}
                </span>
              </div>
            </div>

            {/* Pestañas de Navegación del Panel: Chat Activo vs Bandeja vs Ficha */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setRightColTab('chat')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
                  rightColTab === 'chat'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Radio className={`w-3.5 h-3.5 ${rightColTab === 'chat' ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">CHAT ACTIVO</span>
                
                {selectedEmergency.notes?.length > 0 && (
                  <span className={`text-[9.5px] px-1.5 py-0.2 rounded ${
                    rightColTab === 'chat' ? 'bg-blue-50 text-blue-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {selectedEmergency.notes.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setRightColTab('inbox')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
                  rightColTab === 'inbox'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
                <span className="truncate">BANDEJA ({displayedEmergencies.length})</span>
                
              </button>

              <button
                type="button"
                onClick={() => setRightColTab('ficha')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  rightColTab === 'ficha'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="truncate">FICHA</span>
              </button>
            </div>

            {/* Acciones Rápidas de Contacto */}
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`tel:${selectedEmergency.phone}`}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Llamar al Usuario</span>
              </a>

              <a
                href={`https://wa.me/${selectedEmergency.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${selectedEmergency.holderName}, nos comunicamos desde la Central de Monitoreo de Escudo Vial con respecto a tu alerta ${selectedEmergency.folio}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Directo</span>
              </a>
            </div>

            {/* Botón de Acción Principal de la Torre de Control */}
            <div>
              {selectedEmergency.status === 'critico' ? (
                <button
                  type="button"
                  onClick={() => handleDispatch('Unidad de Auxilio Vial')}
                  className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-semibold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer uppercase tracking-wider"
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>ACEPTAR Y ATENDER EMERGENCIA</span>
                </button>
              ) : selectedEmergency.status === 'en_camino' ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-center justify-between text-xs text-blue-900 font-semibold">
                  <div className="flex items-center gap-2">
                    
                    <span>¡EMERGENCIA ACEPTADA Y EN ATENCIÓN!</span>
                  </div>
                  <span className="bg-blue-200/70 text-blue-800 text-[10px] px-2 py-0.5 rounded-md uppercase font-bold">
                    En Curso
                  </span>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs text-slate-700 font-semibold">
                  <span>Asistencia solventada y cerrada</span>
                  <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-md uppercase">
                    Resuelto
                  </span>
                </div>
              )}
            </div>

            {/* Contenido según pestaña activa */}
            {rightColTab === 'inbox' ? (
              /* Bandeja Multichat */
              <div className="bg-white rounded-xl p-3.5 border border-slate-200 flex flex-col gap-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      Centro de Conversaciones en Vivo
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full ">
                    {displayedEmergencies.length} {displayedEmergencies.length === 1 ? 'caso' : 'casos'}
                  </span>
                </div>

                <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                  {displayedEmergencies.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs italic">
                      No hay emergencias registradas en este momento.
                    </div>
                  ) : (
                    displayedEmergencies.map((emg) => {
                      const isSelected = selectedEmergency?.id === emg.id;
                      const emgNotes = emg.notes || [];
                      const lastMessage = emgNotes[emgNotes.length - 1];
                      const emgLastRead = lastReadCounts[emg.id] ?? emgNotes.length;
                      const hasUnreadThis = emgNotes.length > emgLastRead && lastMessage?.sender === 'usuario';

                      let previewText = "Sin mensajes aún";
                      if (lastMessage) {
                        if (lastMessage.imageUrl) previewText = "[Foto de la emergencia]";
                        else if (lastMessage.audioUrl) previewText = "[Nota de voz]";
                        else previewText = lastMessage.text || "Mensaje enviado";
                      }

                      return (
                        <div
                          key={emg.id}
                          onClick={() => {
                            setSelectedEmergencyId(emg.id);
                            setRightColTab('chat');
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative ${
                            isSelected
                              ? 'bg-blue-50/60 text-slate-900 border-blue-500 ring-1 ring-blue-500'
                              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-slate-900">
                                  {emg.holderName}
                                </span>
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                  {emg.folio}
                                </span>
                                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                  emg.status === 'critico'
                                    ? 'bg-rose-100 text-rose-700'
                                    : emg.status === 'en_camino'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {emg.status === 'critico' ? 'Crítico' : emg.status === 'en_camino' ? 'En Curso' : 'Resuelto'}
                                </span>
                              </div>

                              <div className="text-[11px] truncate mt-0.5 text-slate-500">
                                {emg.vehicle || 'Vehículo en vía'} • {emg.phone}
                              </div>

                              <div className={`text-xs mt-1.5 truncate flex items-center gap-1.5 ${
                                hasUnreadThis
                                  ? 'text-emerald-600 font-bold'
                                  : 'text-slate-400 font-normal'
                              }`}>
                                <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                                <span className="truncate">{previewText}</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end shrink-0 gap-1">
                              <span className="text-[10px] text-slate-400">
                                {lastMessage?.time || new Date(emg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>

                              {hasUnreadThis && (
                                <span className="bg-emerald-500 text-white text-[9.5px] font-bold px-1.5 py-0.2 rounded-full">
                                  NUEVO
                                </span>
                              )}

                              <div className="mt-1 flex items-center gap-0.5 text-xs text-blue-600 font-semibold hover:underline">
                                <span>Abrir</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : rightColTab === 'ficha' ? (
              /* Ficha Completa del Afectado y Vehículo */
              <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200 space-y-3 text-xs animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-semibold uppercase text-[10px]">Titular Registrado</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedEmergency.holderName}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[9.5px] block">Cédula</span>
                    <span className="font-semibold text-slate-800">{selectedEmergency.cedula}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase text-[9.5px] block">Reportante</span>
                    <span className={`font-semibold capitalize ${
                      selectedEmergency.reporterType === 'titular' ? 'text-emerald-700' : 'text-blue-700'
                    }`}>
                      {selectedEmergency.reporterType === 'titular' ? 'Titular' : 'Tercero / Testigo'}
                    </span>
                  </div>
                </div>

                <div className="border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-semibold uppercase text-[9.5px] block">Vehículo / Placa</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800 mt-0.5">
                    <Car className="w-3.5 h-3.5 text-blue-600" />
                    <span>{selectedEmergency.vehicle || 'Vehículo en vía'}</span>
                  </div>
                </div>

                <div className="border-b border-slate-200 pb-2">
                  <span className="text-slate-400 font-semibold uppercase text-[9.5px] block">Teléfono de Contacto</span>
                  <span className="font-semibold text-slate-800">{selectedEmergency.phone}</span>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[9.5px] block">Ubicación GPS</span>
                  <div className="flex items-start gap-1 text-slate-700 font-medium mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{selectedEmergency.location.address}</span>
                  </div>
                  {selectedEmergency.location.lat && selectedEmergency.location.lng && (
                    <a
                      href={`https://www.google.com/maps?q=${selectedEmergency.location.lat},${selectedEmergency.location.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold mt-1.5"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Abrir coordenadas en Google Maps</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              /* Consola de Chat Táctico Estilo Helpdesk */
              <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200/90 flex flex-col gap-2.5 shadow-xs animate-in fade-in">
                {/* Cabecera del Chat */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <div>
                      <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span>CANAL DE CHAT EN VIVO</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <span>Conectado con:</span>
                        <strong className="text-slate-800">{selectedEmergency.holderName}</strong>
                        <span>•</span>
                        <span>{selectedEmergency.vehicle || 'Vehículo'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRightColTab('inbox')}
                      className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                      title="Ver todos los chats en curso"
                    >
                      <Inbox className="w-3 h-3 text-blue-600" />
                      <span>Bandeja ({displayedEmergencies.length})</span>
                    </button>
                    <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      ONLINE
                    </span>
                  </div>
                </div>

                {/* Contenedor de Mensajes */}
                <div 
                  ref={chatScrollRef}
                  className="space-y-2.5 h-[340px] overflow-y-auto pr-1 text-xs select-text"
                >
                  {(!selectedEmergency.notes || selectedEmergency.notes.length === 0) ? (
                    <div className="text-center py-10 flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-xs">
                        <Radio className="w-5 h-5" />
                      </div>
                      <p className="text-slate-700 text-xs font-semibold">Canal de Transmisión Activo</p>
                      <p className="text-slate-400 text-[11px] max-w-xs leading-relaxed">
                        El conductor puede enviar mensajes, fotos del vehículo y notas de voz desde su teléfono móvil.
                      </p>
                    </div>
                  ) : (
                    selectedEmergency.notes.map((msg, i) => {
                      const isUser = msg.sender === 'usuario';
                      const isCentral = msg.sender === 'central';

                      if (!isUser && !isCentral) {
                        return (
                          <div key={msg.id || i} className="text-center my-1.5">
                            <span className="bg-slate-200/70 border border-slate-300 text-slate-600 text-[9.5px] px-2.5 py-0.5 rounded-full inline-block">
                              {msg.text}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={msg.id || i} 
                          className={`flex flex-col ${isCentral ? 'items-end' : 'items-start'}`}
                        >
                          <div className="text-[9.5px] text-slate-400 font-medium mb-1 px-1 flex items-center gap-1.5">
                            <span className={isCentral ? 'text-blue-600 font-semibold' : 'text-slate-600 font-semibold'}>
                              {isCentral ? 'Central (Tú)' : 'Conductor en ruta'}
                            </span>
                            <span>•</span>
                            <span>{msg.time}</span>
                          </div>
                          <div 
                            className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] text-xs shadow-xs leading-relaxed ${
                              isCentral 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none font-normal'
                            }`}
                          >
                            {msg.text && <div className="break-words">{msg.text}</div>}
                            {msg.imageUrl && (
                              <div className="mt-2 relative group cursor-pointer" onClick={() => setPreviewImageUrl(msg.imageUrl)}>
                                <img 
                                  src={msg.imageUrl} 
                                  alt="Foto enviada" 
                                  className="rounded-xl max-h-48 w-auto object-cover border border-slate-200 shadow-xs hover:brightness-105 transition-all" 
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center text-white transition-opacity">
                                  <ZoomIn className="w-5 h-5 drop-shadow text-white" />
                                </div>
                              </div>
                            )}
                            {msg.audioUrl && (
                              <div className="mt-2 pt-1 border-t border-slate-200">
                                <audio controls src={msg.audioUrl} className="h-8 max-w-[210px]" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Botones de Respuestas Rápidas */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mb-1">
                    Respuestas Rápidas:
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {[
                      'Grúa en ruta hacia tu posición (8-10 min)',
                      'Enciende intermitentes y mantén la calma',
                      'Te estamos llamando a tu número celular',
                      'Patrulla y paramédicos notificados',
                      'Envíanos una foto del daño para la aseguradora'
                    ].map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendChatMessage(chip)}
                        className="bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-700 text-[11px] px-2.5 py-1 rounded-lg whitespace-nowrap font-medium transition-all shadow-xs cursor-pointer shrink-0"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input de redacción */}
                <form onSubmit={handleAddNote} className="flex items-center gap-1.5 mt-1">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Escribir mensaje al conductor..."
                    className="flex-1 bg-white border border-slate-200 focus:border-blue-600 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-xs"
                  />
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1 font-semibold text-xs"
                    title="Enviar mensaje"
                  >
                    <span>Enviar</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* Acciones de Cierre */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              {selectedEmergency.status === 'en_camino' && (
                <button
                  type="button"
                  onClick={handleResolve}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer uppercase tracking-wider"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>FINALIZAR Y MARCAR COMO RESUELTO</span>
                </button>
              )}

              {selectedEmergency.status === 'resuelto' && (
                <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs py-2 px-3 rounded-xl flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>CASO ATENDIDO Y RESUELTO</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => updateEmergencyStatus(selectedEmergency.id, 'critico')}
                    className="text-[10px] text-emerald-700 underline font-semibold hover:text-emerald-900 cursor-pointer"
                  >
                    Reabrir
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleDelete(selectedEmergency.id)}
                className="w-full bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 font-medium text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Descartar o quitar caso del radar"
              >
                <Trash2 className="w-4 h-4" />
                <span>Descartar / Quitar Caso del Radar</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-xs text-center flex flex-col items-center justify-center h-full min-h-[380px]">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-3 shadow-sm shadow-blue-500/20 p-2">
              <img src={escudoLogo} alt="Escudo Vial" className="w-full h-full object-contain" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">
              Torre de Monitoreo Activa 24/7
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mt-1.5 leading-relaxed">
              No hay emergencias en curso en este momento. La central está en escucha activa para recibir transmisiones S.O.S reales desde cualquier sticker QR escaneado.
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs text-slate-600 flex items-center gap-2 max-w-xs">
              
              <span>Para registrar una alerta real, escanea un QR o abre la vista móvil y presiona el botón S.O.S.</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal Lightbox Visor de Fotos */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-3 -right-3 bg-white text-slate-700 hover:text-slate-900 rounded-full p-1.5 shadow-md border border-slate-200 transition-all cursor-pointer"
              title="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>

            <img 
              src={previewImageUrl} 
              alt="Foto ampliada" 
              className="max-h-[75vh] max-w-[85vw] object-contain rounded-xl"
            />

            <div className="mt-3 flex items-center gap-3">
              <a 
                href={previewImageUrl} 
                download="evidencia_emergencia.jpg"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Foto</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
