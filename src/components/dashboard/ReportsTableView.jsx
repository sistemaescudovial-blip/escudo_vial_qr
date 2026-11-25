import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileText, 
  Filter, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Eye,
  FileDown,
  X
} from 'lucide-react';

export default function ReportsTableView({ searchQuery = '' }) {
  const { reports, updateReportStatus } = useApp();
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedReport, setSelectedReport] = useState(null);

  const filteredReports = reports.filter(r => {
    // Filtro por buscador
    const matchesSearch = !searchQuery || (
      r.folio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filtro por categoría
    const matchesCat = selectedCategory === 'todos' || (
      selectedCategory === 'temeraria' && r.reason.includes('temeraria')
    ) || (
      selectedCategory === 'accidente' && r.reason.includes('Accidente')
    ) || (
      selectedCategory === 'sospechoso' && r.reason.includes('sospechoso')
    );

    return matchesSearch && matchesCat;
  });

  const getReasonBadge = (reason) => {
    if (reason.includes('temeraria')) {
      return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">Conducción Temeraria</span>;
    }
    if (reason.includes('Accidente')) {
      return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">Accidente Vial</span>;
    }
    return <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">Sospechoso</span>;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'nuevo':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">Nuevo</span>;
      case 'en_investigacion':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">En Investigación</span>;
      case 'resuelto':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">Resuelto</span>;
      default:
        return <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase">Archivado</span>;
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      {/* Filtros de la Bandeja */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Filtrar:
          </span>
          {[
            { id: 'todos', label: 'Todos los Reportes' },
            { id: 'temeraria', label: 'Conducción Temeraria' },
            { id: 'accidente', label: 'Accidentes' },
            { id: 'sospechoso', label: 'Sospechosos' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedCategory(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                selectedCategory === f.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-medium self-end sm:self-auto">
          Mostrando {filteredReports.length} {filteredReports.length === 1 ? 'reporte' : 'reportes'}
        </div>
      </div>

      {/* Tabla de Reportes */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Folio / Fecha</th>
                <th className="py-3 px-4">Motivo del Incidente</th>
                <th className="py-3 px-4">Detalle Reportado</th>
                <th className="py-3 px-4">SKU / Ubicación</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredReports.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-xs">
                      {rep.folio}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(rep.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })} • {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {getReasonBadge(rep.reason)}
                  </td>

                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="text-slate-700 font-medium truncate" title={rep.details}>
                      {rep.details}
                    </p>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="text-blue-700 font-bold text-xs">
                      #{rep.sku}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[180px] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                      {rep.location?.address || 'Ubicación vía móvil'}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    {getStatusBadge(rep.status)}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedReport(rep)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer shadow-xs"
                        title="Ver detalles completos"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateReportStatus(rep.id, rep.status === 'resuelto' ? 'en_investigacion' : 'resuelto')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                          rep.status === 'resuelto'
                            ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {rep.status === 'resuelto' ? 'Reabrir' : 'Resolver'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-medium text-sm text-slate-600">No se encontraron reportes con los criterios seleccionados</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Drawer de Detalle del Reporte */}
      {selectedReport && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedReport(null);
          }}
        >
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl relative border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col gap-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-bold text-lg text-slate-900">
                  {selectedReport.folio}
                </span>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Reporte ciudadano de seguridad vial
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Motivo</span>
                <div className="mt-1">{getReasonBadge(selectedReport.reason)}</div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Descripción y Testimonio</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium leading-relaxed mt-1">
                  "{selectedReport.details}"
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Sticker QR Asociado</span>
                  <span className="font-bold text-blue-700 text-sm mt-0.5 block">#{selectedReport.sku}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Fecha y Hora</span>
                  <span className="font-medium text-slate-700 mt-0.5 block">
                    {new Date(selectedReport.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Ubicación GPS</span>
                <div className="flex items-center gap-1.5 text-slate-700 font-medium mt-1">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>{selectedReport.location?.address || 'Carretera Nacional'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  alert(`Expediente ${selectedReport.folio} exportado listo para autoridades.`);
                }}
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <FileDown className="w-4 h-4 text-slate-500" />
                <span>Exportar Caso</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  updateReportStatus(selectedReport.id, 'resuelto');
                  setSelectedReport(null);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Marcar Resuelto</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
