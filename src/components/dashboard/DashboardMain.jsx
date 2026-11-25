import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import DashboardHeader from './DashboardHeader';
import KpiCards from './KpiCards';
import LiveRadarView from './LiveRadarView';
import ReportsTableView from './ReportsTableView';
import QrManagerView from './QrManagerView';
import AnalyticsView from './AnalyticsView';
import IncomingEmergencyModal from './IncomingEmergencyModal';
import ErrorBoundary from '../common/ErrorBoundary';
import { 
  Radio, 
  FileSpreadsheet, 
  QrCode, 
  BarChart3
} from 'lucide-react';

export default function DashboardMain() {
  const { emergencies } = useApp();
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' | 'reportes' | 'qrs' | 'metricas'
  const [qrsResetKey, setQrsResetKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmergencyId, setSelectedEmergencyId] = useState(null);

  const activeEmergenciesCount = emergencies.filter(e => e.status !== 'resuelto').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col antialiased">
      {/* Ventana Flotante Modal con Sirena de Emergencia Entrante */}
      <IncomingEmergencyModal 
        onAccepted={(emgId) => {
          setSelectedEmergencyId(emgId);
          setActiveTab('radar');
        }} 
      />

      {/* Header de la Torre de Despacho */}
      <DashboardHeader 
        onSearch={setSearchQuery} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col gap-6">
        {/* Tarjetas KPI Superiores */}
        <KpiCards 
          onCardClick={(tab) => setActiveTab(tab)} 
          activeFilter={activeTab}
        />

        {/* Barra de Pestañas Principales (Estilo Respond.io SaaS) */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
          {[
            { 
              id: 'radar', 
              label: 'Emergencias', 
              icon: Radio,
              isEmergency: true,
              badgeCount: activeEmergenciesCount
            },
            { id: 'reportes', label: 'Reportes', icon: FileSpreadsheet },
            { id: 'qrs', label: 'Gestión QR', icon: QrCode },
            { id: 'metricas', label: 'Estadísticas', icon: BarChart3 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (tab.id === 'qrs') {
                    setQrsResetKey(k => k + 1);
                  }
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  tab.isEmergency
                    ? isActive
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                    : isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.isEmergency ? (isActive ? 'text-white' : 'text-rose-600') : (isActive ? 'text-white' : 'text-slate-400')}`} />
                <span>{tab.label}</span>
                {tab.badgeCount > 0 && (
                  <span className="bg-white text-rose-700 text-[10px] font-bold px-1.5 py-0.2 rounded-full shadow-xs ml-0.5">
                    {tab.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Vista Activa con ErrorBoundary */}
        <div className="flex-1">
          <ErrorBoundary key={activeTab}>
            {activeTab === 'radar' && (
              <LiveRadarView 
                searchQuery={searchQuery} 
                selectedEmergencyId={selectedEmergencyId}
                onSelectEmergency={setSelectedEmergencyId}
              />
            )}
            {activeTab === 'reportes' && <ReportsTableView searchQuery={searchQuery} />}
            {activeTab === 'qrs' && <QrManagerView key={qrsResetKey} searchQuery={searchQuery} />}
            {activeTab === 'metricas' && <AnalyticsView />}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
