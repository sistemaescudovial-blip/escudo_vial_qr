import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import QrStandaloneExporterView from './QrStandaloneExporterView';
import { 
  renderOfficialStickerToCanvas,
  exportBatchOfficialByFormat,
  DEFAULT_CANVAS_CONFIG,
  OFFICIAL_TEMPLATE_ASPECT,
  calculateCanvasRollLayout,
  exportCanvasRollPdf,
  exportCanvasRollSvg
} from '../../utils/officialStickerGenerator';
import { 
  QrCode, 
  Layers, 
  Download, 
  Printer, 
  FileText, 
  Smartphone, 
  Filter, 
  Plus, 
  Car, 
  CheckCircle2, 
  Wifi,
  ExternalLink,
  Copy,
  Check,
  Search,
  Tag,
  Eye,
  User,
  Phone,
  ShieldCheck,
  HeartPulse,
  Info,
  Calendar,
  RotateCcw,
  Trash2,
  Edit3,
  Archive,
  Scissors,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function QrManagerView({ searchQuery = '' }) {
  const { 
    qrList, 
    createBatchQrs, 
    generateNewQr, 
    setActiveSku, 
    resetQr, 
    deleteQr, 
    updateQrHolder,
    markQrsAsPrinted,
    markQrsAsPending,
    toggleQrPrinted
  } = useApp();

  const [showStandaloneExporter, setShowStandaloneExporter] = useState(false);
  const [showEmissionMenu, setShowEmissionMenu] = useState(false);
  const [selectedSku, setSelectedSku] = useState(qrList[0]?.sku || 'EV8842VE');
  const [filterType, setFilterType] = useState('todos');
  const [printStatusFilter, setPrintStatusFilter] = useState('todos'); // 'todos' | 'pendientes' | 'impresos'
  const [batchFilter, setBatchFilter] = useState('todos');
  const [printOnlyPendingInBatch, setPrintOnlyPendingInBatch] = useState(false);
  const [selectedSizeCm, setSelectedSizeCm] = useState(8); // 5, 8, 12 cm
  const [isExporting, setIsExporting] = useState(false);
  const [copiedSku, setCopiedSku] = useState(null);
  const [selectedHolderModal, setSelectedHolderModal] = useState(null);
  const [editingQrModal, setEditingQrModal] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    cedula: '',
    phone: '',
    vehicle: '',
    plate: '',
    bloodType: 'O+',
    emergencyContactName: '',
    emergencyContactPhone: '',
    insurancePolicy: ''
  });

  // Modales
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showCanvasRollPanel, setShowCanvasRollPanel] = useState(false);
  const [batchExportFormat, setBatchExportFormat] = useState('jpg'); // 'jpg' | 'svg' | 'pdf' | 'png'
  const [batchDeliveryMode, setBatchDeliveryMode] = useState('zip'); // 'zip' | 'individual'
  const [canvasConfig, setCanvasConfig] = useState({ ...DEFAULT_CANVAS_CONFIG, targetRows: 3 });

  // Configuración de Impresión / Salida a Imprenta
  const [printConfig, setPrintConfig] = useState({
    cutExternal: true,     // Trazo fucsia perimetral exterior (#F0047F)
    cutInternal: true,     // Trazos fucsia interiores de troquel (#F0047F)
    showBatchCode: true,   // Mostrar número de lote en lateral
    batchCodeText: 'L1C',  // Texto personalizado del lote
    includeQr: true,       // Mostrar los 2 QR y su SKU alfanumérico
    templateWidthMm: 45,   // Ancho de plantilla en mm
    templateHeightMm: 130  // Alto de plantilla en mm
  });
  const [templateUnit, setTemplateUnit] = useState('mm'); // 'mm' | 'cm'
  const [templateWidthInput, setTemplateWidthInput] = useState('45');
  const [templateHeightInput, setTemplateHeightInput] = useState('130');
  const [printExportCount, setPrintExportCount] = useState(1);

  const formatTemplateMeasure = (mm, targetUnit) => {
    const val = targetUnit === 'cm' ? mm / 10 : mm;
    return String(Math.round(val * 100) / 100);
  };

  const handleTemplateUnitChange = (nextUnit) => {
    if (nextUnit === templateUnit) return;
    setTemplateUnit(nextUnit);
    setTemplateWidthInput(formatTemplateMeasure(printConfig.templateWidthMm, nextUnit));
    setTemplateHeightInput(formatTemplateMeasure(printConfig.templateHeightMm, nextUnit));
  };

  const handleTemplateWidthChange = (rawVal) => {
    setTemplateWidthInput(rawVal);
    const parsed = parseFloat(rawVal);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const rawMm = templateUnit === 'cm' ? parsed * 10 : parsed;
    const widthMm = Math.round(Math.max(15, Math.min(300, rawMm)) * 10) / 10;
    const heightMm = Math.round((widthMm / OFFICIAL_TEMPLATE_ASPECT) * 10) / 10;
    setPrintConfig(prev => ({ ...prev, templateWidthMm: widthMm, templateHeightMm: heightMm }));
    setTemplateHeightInput(formatTemplateMeasure(heightMm, templateUnit));
  };

  const handleTemplateHeightChange = (rawVal) => {
    setTemplateHeightInput(rawVal);
    const parsed = parseFloat(rawVal);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    const rawMm = templateUnit === 'cm' ? parsed * 10 : parsed;
    const heightMm = Math.round(Math.max(40, Math.min(900, rawMm)) * 10) / 10;
    const widthMm = Math.round((heightMm * OFFICIAL_TEMPLATE_ASPECT) * 10) / 10;
    setPrintConfig(prev => ({ ...prev, templateWidthMm: widthMm, templateHeightMm: heightMm }));
    setTemplateWidthInput(formatTemplateMeasure(widthMm, templateUnit));
  };

  const handleResetTemplateSize = () => {
    setPrintConfig(prev => ({ ...prev, templateWidthMm: 45, templateHeightMm: 130 }));
    setTemplateWidthInput(formatTemplateMeasure(45, templateUnit));
    setTemplateHeightInput(formatTemplateMeasure(130, templateUnit));
  };

  const rawPreviewW = printConfig.templateWidthMm * 2.9;
  const rawPreviewH = printConfig.templateHeightMm * 2.9;
  const previewFitScale = Math.min(1, 210 / rawPreviewW, 410 / rawPreviewH);
  const previewCanvasCssW = Math.round(rawPreviewW * previewFitScale);
  const previewCanvasCssH = Math.round(rawPreviewH * previewFitScale);

  // QRs Llenos vs Vacíos
  const activeQrs = qrList.filter(q => q.status === 'active');
  const inactiveQrs = qrList.filter(q => q.status !== 'active');

  // Datos para emisión de QRs (Creación en base de datos)
  const [batchCount, setBatchCount] = useState(1);
  const [batchPrefix, setBatchPrefix] = useState('EV');
  const [batchCategory, setBatchCategory] = useState('Auto');
  const [batchDescription, setBatchDescription] = useState('');

  // Datos para emisión individual
  const [singleSkuInput, setSingleSkuInput] = useState('');
  const [singleCategory, setSingleCategory] = useState('Auto');

  const canvasRef = useRef(null);
  const currentQr = qrList.find(q => q.sku.toUpperCase() === selectedSku.toUpperCase()) || qrList[0] || null;

  // Determinar la URL base dinámica y oficial (siempre el dominio activo)
  const getBaseUrl = () => {
    return window.location.origin;
  };

  const previewStickerSku = currentQr?.sku || 'EV3362VE';
  const targetQrUrl = `${getBaseUrl()}/v/${previewStickerSku}`;

  // Dibujar el sticker oficial en el canvas cada vez que cambie el SKU o la configuración de impresión
  useEffect(() => {
    if (!showPrintModal || !canvasRef.current) return;
    let isCancelled = false;
    async function renderCanvas() {
      try {
        await renderOfficialStickerToCanvas(previewStickerSku, targetQrUrl, canvasRef.current, {
          ...printConfig,
          previewDpi: 240
        });
      } catch (err) {
        if (!isCancelled) {
          console.error("Error al renderizar canvas QR:", err);
        }
      }
    }
    renderCanvas();
    return () => { isCancelled = true; };
  }, [previewStickerSku, targetQrUrl, printConfig, showPrintModal]);

  const pendingPrintCount = qrList.filter(q => !q.isPrinted).length;
  const printedCount = qrList.filter(q => q.isPrinted).length;

  const batchOptions = Object.values(
    qrList.reduce((acc, q) => {
      if (!q.batchId && !q.batchDescription) return acc;
      const key = q.batchId || `DESC:${q.batchDescription}`;
      if (!acc[key]) {
        acc[key] = {
          id: key,
          batchId: q.batchId || key,
          description: q.batchDescription || '',
          createdAt: q.createdAt || null,
          total: 0,
          active: 0
        };
      }
      acc[key].total += 1;
      if (q.status === 'active') acc[key].active += 1;
      return acc;
    }, {})
  );

  const selectedBatchMeta = batchFilter !== 'todos'
    ? batchOptions.find(b => b.id === batchFilter) || null
    : null;

  const filteredQrs = qrList.filter(q => {
    const qBatchKey = q.batchId || (q.batchDescription ? `DESC:${q.batchDescription}` : '');
    const matchesSearch = !searchQuery || (
      q.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.batchDescription && q.batchDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.batchId && q.batchId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.holder?.name && q.holder.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.holder?.cedula && q.holder.cedula.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.holder?.vehicle && q.holder.vehicle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (q.holder?.plate && q.holder.plate.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    const matchesFilter = filterType === 'todos' || q.status === filterType;
    const matchesPrint = printStatusFilter === 'todos'
      ? true
      : printStatusFilter === 'pendientes'
        ? !q.isPrinted
        : Boolean(q.isPrinted);
    const matchesBatch = batchFilter === 'todos' || qBatchKey === batchFilter;

    return matchesSearch && matchesFilter && matchesPrint && matchesBatch;
  });

  const handleCopyLink = (sku) => {
    const url = `${getBaseUrl()}/v/${sku}`;
    navigator.clipboard.writeText(url);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 2000);
  };

  const handleOpenEditModal = (qr) => {
    if (!qr) return;
    setEditingQrModal(qr);
    setEditFormData({
      name: qr.holder?.name || '',
      cedula: qr.holder?.cedula || '',
      phone: qr.holder?.phone || '',
      vehicle: qr.holder?.vehicle || '',
      plate: qr.holder?.plate || '',
      bloodType: qr.holder?.bloodType || 'O+',
      emergencyContactName: qr.holder?.emergencyContactName || '',
      emergencyContactPhone: qr.holder?.emergencyContactPhone || '',
      insurancePolicy: qr.holder?.insurancePolicy || `Póliza Escudo Vial 24/7 #${qr.sku}`
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingQrModal) return;
    setIsSavingEdit(true);
    try {
      await updateQrHolder(editingQrModal.sku, editFormData);
      if (selectedHolderModal?.sku === editingQrModal.sku) {
        setSelectedHolderModal(prev => ({
          ...prev,
          holder: { ...prev.holder, ...editFormData }
        }));
      }
      setEditingQrModal(null);
    } catch (err) {
      alert("Error al actualizar la ficha del vehículo: " + err.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const resolveExportPool = (customCount = null) => {
    if (printConfig.includeQr === false) {
      const count = Math.max(1, Number(customCount) || 1);
      return Array.from({ length: count }, (_, idx) => ({ sku: `PLANTILLA_${idx + 1}` }));
    }
    const pool = printOnlyPendingInBatch ? filteredQrs.filter(q => !q.isPrinted) : filteredQrs;
    const countToUse = customCount ? Math.min(Number(customCount), pool.length) : pool.length;
    return pool.slice(0, countToUse);
  };

  const handleExportBatchByFormat = async (customCount = null) => {
    const listToExport = resolveExportPool(customCount);
    if (listToExport.length === 0) {
      alert("No hay stickers para exportar con los filtros seleccionados.");
      return;
    }
    setIsExporting(true);
    try {
      await exportBatchOfficialByFormat(listToExport, getBaseUrl, printConfig, batchExportFormat, batchDeliveryMode);
      if (printConfig.includeQr !== false) {
        markQrsAsPrinted(listToExport.map(q => q.sku));
      }
    } catch (e) {
      alert("Error al exportar lote: " + e.message);
    }
    setIsExporting(false);
  };

  const handleExportCanvasPdf = async () => {
    setIsExporting(true);
    try {
      const pool = printConfig.includeQr === false
        ? resolveExportPool(calculateCanvasRollLayout(canvasConfig, printConfig).totalStickers)
        : (printOnlyPendingInBatch ? filteredQrs.filter(q => !q.isPrinted) : filteredQrs);
      await exportCanvasRollPdf(pool, getBaseUrl, canvasConfig, printConfig);

      const layout = calculateCanvasRollLayout(canvasConfig, printConfig);
      if (printConfig.includeQr !== false) {
        const usedSkus = pool.slice(0, layout.totalStickers).map(q => q.sku);
        if (usedSkus.length > 0) {
          markQrsAsPrinted(usedSkus);
        }
      }
    } catch (err) {
      alert("Error al exportar Lienzo PDF CMYK: " + err.message);
    }
    setIsExporting(false);
  };

  const handleExportCanvasSvg = async () => {
    setIsExporting(true);
    try {
      const pool = printConfig.includeQr === false
        ? resolveExportPool(calculateCanvasRollLayout(canvasConfig, printConfig).totalStickers)
        : (printOnlyPendingInBatch ? filteredQrs.filter(q => !q.isPrinted) : filteredQrs);
      exportCanvasRollSvg(pool, getBaseUrl, canvasConfig, printConfig);

      const layout = calculateCanvasRollLayout(canvasConfig, printConfig);
      if (printConfig.includeQr !== false) {
        const usedSkus = pool.slice(0, layout.totalStickers).map(q => q.sku);
        if (usedSkus.length > 0) {
          markQrsAsPrinted(usedSkus);
        }
      }
    } catch (err) {
      alert("Error al exportar Lienzo SVG CMYK: " + err.message);
    }
    setIsExporting(false);
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    setShowBatchModal(false);
    const count = Math.max(1, Math.min(1000, parseInt(batchCount, 10) || 1));
    setBatchCount(count);
    const prefix = batchPrefix.trim().toUpperCase() || 'EV2026';
    const created = await createBatchQrs(count, prefix, batchCategory, batchDescription);
    setBatchDescription('');
    setBatchFilter('todos');
    if (created && created.length > 0) {
      setSelectedSku(created[0].sku);
    }
  };

  const handleCreateSingle = async (e) => {
    e.preventDefault();
    const skuToUse = singleSkuInput.trim() ? singleSkuInput.trim().toUpperCase() : null;
    setShowSingleModal(false);
    setSingleSkuInput('');
    const created = await generateNewQr(skuToUse, singleCategory);
    if (created) {
      setSelectedSku(created.sku);
    }
  };

  const handleResetQr = (e, qr) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `¿Deseas desvincular y limpiar la información del sticker QR ${qr.sku}?\n\n` +
      `Los datos del vehículo y del titular (${qr.holder?.name || 'Usuario'}) serán eliminados. ` +
      `El sticker volverá a estar "En Stock (Sin Llenar)" disponible para un nuevo usuario.`
    );
    if (confirmed) {
      resetQr(qr.sku);
    }
  };

  const handleDeleteQr = (e, qr) => {
    e.stopPropagation();
    const confirmed = window.confirm(
      `¿Estás SEGURO de que deseas eliminar permanentemente el sticker QR ${qr.sku}?\n\n` +
      `Esta acción borrará el sticker del catálogo y de la base de datos Supabase.`
    );
    if (confirmed) {
      deleteQr(qr.sku);
    }
  };

  if (showStandaloneExporter) {
    return (
      <QrStandaloneExporterView
        searchQuery={searchQuery}
        onBack={() => setShowStandaloneExporter(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5 mt-4">
      {/* Barra de Acciones Principales y Creación de QR */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
          CENTRO DE GESTIÓN Y CATÁLOGO DE QR
        </h2>

        {/* Dos Botones Principales: Emisión QR (Desplegable) y Configurar e Imprimir */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Botón Desplegable: Emisión QR */}
          <div className="relative flex-1 md:flex-none">
            <button
              type="button"
              onClick={() => setShowEmissionMenu(prev => !prev)}
              aria-expanded={showEmissionMenu}
              className="w-full md:w-auto bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-blue-300 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-blue-600" />
              <span>Emisión QR</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${showEmissionMenu ? 'rotate-180' : ''}`} />
            </button>

            {showEmissionMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowEmissionMenu(false)} 
                />
                <div className="absolute right-0 md:left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmissionMenu(false);
                      setShowSingleModal(true);
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>Emitir QR Individual</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowEmissionMenu(false);
                      setShowBatchModal(true);
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Emitir QR Lotes</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowEmissionMenu(false);
                      setShowStandaloneExporter(true);
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Exportar QR Solos</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Botón Único Directo: Imprimir */}
          <button
            type="button"
            onClick={() => {
              setShowEmissionMenu(false);
              setPrintExportCount(Math.min(15, Math.max(1, printOnlyPendingInBatch ? pendingPrintCount : filteredQrs.length || 1)));
              setShowPrintModal(true);
            }}
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
            title="Configurar plantilla e imprimir"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* Catálogo General de Códigos QR (Ancho Completo) */}
      <div className="flex flex-col gap-4">
        {/* 4 Tarjetas KPI de Resumen de Inventario (Sin iconos en esquina superior derecha) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: QRs Llenos / Entregados */}
          <div 
            onClick={() => setFilterType('active')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              filterType === 'active' 
                ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-500/20' 
                : 'bg-white border-slate-200/90 hover:border-emerald-300'
            }`}
          >
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
              QRs Llenos / Entregados
            </span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
              {activeQrs.length}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Conductor y vehículo registrado 24/7
            </p>
          </div>

          {/* Card 2: QRs en Stock / Por Llenar */}
          <div 
            onClick={() => setFilterType('inactive')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              filterType === 'inactive' 
                ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20' 
                : 'bg-white border-slate-200/90 hover:border-amber-300'
            }`}
          >
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">
              Generados en Stock
            </span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
              {inactiveQrs.length}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Sin llenar, listos para entregar
            </p>
          </div>

          {/* Card 3: Total Códigos */}
          <div 
            onClick={() => {
              setFilterType('todos');
              setPrintStatusFilter('todos');
            }}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              filterType === 'todos' && printStatusFilter === 'todos'
                ? 'bg-blue-50/60 border-blue-500 ring-2 ring-blue-500/20' 
                : 'bg-white border-slate-200/90 hover:border-blue-300'
            }`}
          >
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider block">
              Total en Inventario
            </span>
            <div className="text-2xl font-bold text-slate-900 tracking-tight mt-2">
              {qrList.length}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {qrList.length > 0 ? `${Math.round((activeQrs.length / qrList.length) * 100)}% de stickers vinculados` : 'Sin stickers registrados'}
            </p>
          </div>

          {/* Card 4: Pendientes de Imprenta */}
          <div 
            onClick={() => setPrintStatusFilter(prev => prev === 'pendientes' ? 'todos' : 'pendientes')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
              printStatusFilter === 'pendientes'
                ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-500/20'
                : 'bg-white border-slate-200/90 hover:border-slate-300'
            }`}
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Pendientes de Imprenta
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">
                {pendingPrintCount}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                {printedCount} impresos
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Cola de impresión para plotter
            </p>
          </div>
        </div>

          {/* Barra de Filtros y Pestañas Destacadas */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col gap-3">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setFilterType('active')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                    filterType === 'active'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  
                  <span>QRs Entregados / Llenos</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    filterType === 'active' ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {activeQrs.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterType('inactive')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                    filterType === 'inactive'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Generados en Stock (Sin Llenar)</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    filterType === 'inactive' ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {inactiveQrs.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterType('todos')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                    filterType === 'todos'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>Ver Todos</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    filterType === 'todos' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {qrList.length}
                  </span>
                </button>
              </div>

              <div className="text-xs text-slate-500 font-semibold shrink-0">
                Mostrando {filteredQrs.length} de {qrList.length} stickers
              </div>
            </div>

            {/* Sub-barra: Filtro de Imprenta (Solución 1: Pendientes vs Ya Impresos) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
                  <Printer className="w-3 h-3 text-blue-600" />
                  Imprenta:
                </span>
                <button
                  type="button"
                  onClick={() => setPrintStatusFilter('todos')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    printStatusFilter === 'todos'
                      ? 'bg-white text-blue-950 font-black shadow-xs border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({qrList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPrintStatusFilter('pendientes')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    printStatusFilter === 'pendientes'
                      ? 'bg-amber-500 text-white font-black shadow-xs'
                      : 'text-amber-800 hover:bg-amber-100/60'
                  }`}
                >
                  <span>Pendientes</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    printStatusFilter === 'pendientes' ? 'bg-black/20 text-white' : 'bg-amber-200/80 text-amber-900'
                  }`}>
                    {pendingPrintCount}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintStatusFilter('impresos')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    printStatusFilter === 'impresos'
                      ? 'bg-emerald-600 text-white font-black shadow-xs'
                      : 'text-emerald-800 hover:bg-emerald-100/60'
                  }`}
                >
                  <span>Ya Impresos</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    printStatusFilter === 'impresos' ? 'bg-black/20 text-white' : 'bg-emerald-200/80 text-emerald-900'
                  }`}>
                    {printedCount}
                  </span>
                </button>
              </div>

              {/* Acciones Rápidas de Imprenta y Filtro por Lote */}
              <div className="flex items-center gap-2 flex-wrap">
                {batchOptions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <select
                      value={batchFilter}
                      onChange={(e) => setBatchFilter(e.target.value)}
                      className="text-[11px] font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-blue-600 max-w-[260px]"
                      title="Filtrar por lote generado para seguimiento"
                    >
                      <option value="todos">Todos los lotes ({batchOptions.length})</option>
                      {batchOptions.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.description
                            ? `${b.description.slice(0, 32)}${b.description.length > 32 ? '...' : ''} (${b.total})`
                            : `${b.batchId} (${b.total})`}
                        </option>
                      ))}
                    </select>
                    {selectedBatchMeta && (
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg">
                        {selectedBatchMeta.active} de {selectedBatchMeta.total} activados
                      </span>
                    )}
                  </div>
                )}
                {pendingPrintCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const pendingSkus = qrList.filter(q => !q.isPrinted).map(q => q.sku);
                      markQrsAsPrinted(pendingSkus);
                    }}
                    className="text-[11px] font-bold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-2.5 py-1 rounded-lg transition-all cursor-pointer border border-slate-200"
                    title="Marcar todos los stickers pendientes como ya impresos"
                  >
                    Marcar todos como Impresos
                  </button>
                )}
                {printedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const printedSkus = qrList.filter(q => q.isPrinted).map(q => q.sku);
                      markQrsAsPending(printedSkus);
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 px-2.5 py-1 rounded-lg transition-all cursor-pointer border border-slate-200"
                    title="Restablecer todos a pendientes de imprenta"
                  >
                    Resetear a Pendientes
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabla / Directorio General de QRs Adaptativa */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                  <tr className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Código SKU</th>
                    {filterType === 'active' ? (
                      <>
                        <th className="py-3 px-4">Conductor Titular</th>
                        <th className="py-3 px-4">Vehículo & Placa</th>
                        <th className="py-3 px-4">Contacto de Auxilio</th>
                        <th className="py-3 px-4">Estado</th>
                      </>
                    ) : filterType === 'inactive' ? (
                      <>
                        <th className="py-3 px-4">Enlace de Activación</th>
                        <th className="py-3 px-4">Tipo de Troquel</th>
                        <th className="py-3 px-4">Estado en Stock</th>
                        <th className="py-3 px-4">Fecha Creación</th>
                      </>
                    ) : (
                      <>
                        <th className="py-3 px-4">Enlace de Destino</th>
                        <th className="py-3 px-4">Vehículo / Titular</th>
                        <th className="py-3 px-4">Escaneos</th>
                        <th className="py-3 px-4">Estado</th>
                      </>
                    )}
                    <th className="py-3 px-3 text-center">Imprenta</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredQrs.map((qr) => {
                    const isSelected = selectedSku.toUpperCase() === qr.sku.toUpperCase();
                    const isActive = qr.status === 'active';
                    const linkUrl = `${getBaseUrl()}/v/${qr.sku}`;

                    return (
                      <tr 
                        key={qr.sku}
                        onClick={() => setSelectedSku(qr.sku)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        {/* Columna SKU */}
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 text-sm">
                            {qr.sku}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.2 rounded inline-block">
                              {qr.category || 'Auto'}
                            </span>
                            {qr.batchId && (
                              <span className="text-[9.5px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded inline-block">
                                {qr.batchId}
                              </span>
                            )}
                          </div>
                          {qr.batchDescription && (
                            <p
                              className="text-[11px] font-medium text-slate-500 mt-1 max-w-[220px] truncate"
                              title={qr.batchDescription}
                            >
                              {qr.batchDescription}
                            </p>
                          )}
                        </td>

                        {/* VISTA 1: QRs Entregados / Llenos */}
                        {filterType === 'active' ? (
                          <>
                            {/* Titular */}
                            <td className="py-3.5 px-4">
                              <div className="font-extrabold text-slate-900 text-[13px] flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-blue-600" />
                                <span>{qr.holder?.name || 'Usuario Escudo Vial'}</span>
                              </div>
                              <span className="text-[11px] text-slate-500 ">
                                Cédula: {qr.holder?.cedula || 'V-00.000.000'}
                              </span>
                            </td>

                            {/* Vehículo y Placa */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-800 flex items-center gap-1">
                                <Car className="w-3.5 h-3.5 text-blue-600" />
                                <span>{qr.holder?.vehicle?.replace(/\s*\([^)]*\)\s*$/, '') || 'Vehículo registrado'}</span>
                              </div>
                              <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px] border border-blue-100 mt-0.5 inline-block">
                                {qr.holder?.plate || 'S/P'}
                              </span>
                            </td>

                            {/* Contacto de Auxilio */}
                            <td className="py-3.5 px-4">
                              <div className="text-slate-800 font-semibold">
                                {qr.holder?.emergencyContactName || 'Familiar Registrado'}
                              </div>
                              {qr.holder?.emergencyContactPhone && (
                                <a
                                  href={`tel:${qr.holder.emergencyContactPhone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-0.5"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{qr.holder.emergencyContactPhone}</span>
                                </a>
                              )}
                            </td>

                            {/* Estado Activo */}
                            <td className="py-3.5 px-4">
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                                
                                Protegido 24/7
                              </span>
                            </td>
                          </>
                        ) : filterType === 'inactive' ? (
                          <>
                            {/* Enlace Destino de Activación */}
                            <td className="py-3.5 px-4 max-w-[220px]">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-blue-600 font-bold truncate block">
                                  /v/{qr.sku}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyLink(qr.sku);
                                  }}
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                                  title="Copiar URL de activación"
                                >
                                  {copiedSku === qr.sku ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <span className="text-[10px] text-slate-400 block truncate">
                                Dirige a pantalla de registro para nuevo cliente
                              </span>
                            </td>

                            {/* Tipo de Troquel */}
                            <td className="py-3.5 px-4">
                              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-xs">
                                Troquel {qr.category || 'Auto'}
                              </span>
                            </td>

                            {/* Estado en Stock */}
                            <td className="py-3.5 px-4">
                              <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                                <Tag className="w-3 h-3 text-amber-600" />
                                En Stock (Disponible)
                              </span>
                            </td>

                            {/* Fecha de Creación */}
                            <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                              {qr.createdAt ? new Date(qr.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' }) : 'Hoy'}
                            </td>
                          </>
                        ) : (
                          <>
                            {/* Vista Todos: Enlace de Destino */}
                            <td className="py-3.5 px-4 max-w-[200px]">
                              <div className="flex items-center gap-1.5">
                                <span 
                                  className="text-[11px] text-slate-600 truncate block hover:text-blue-600"
                                  title={linkUrl}
                                >
                                  /v/{qr.sku}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyLink(qr.sku);
                                  }}
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                                  title="Copiar URL completa"
                                >
                                  {copiedSku === qr.sku ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              <span className="text-[10px] text-slate-400 truncate block">
                                {linkUrl}
                              </span>
                            </td>

                            {/* Vehículo / Titular */}
                            <td className="py-3.5 px-4">
                              {isActive && qr.holder ? (
                                <div>
                                  <div className="flex items-center gap-1 font-extrabold text-slate-900">
                                    <Car className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{qr.holder.vehicle?.replace(/\s*\([^)]*\)\s*$/, '')} ({qr.holder.plate || 'S/P'})</span>
                                  </div>
                                  <span className="text-[11px] text-slate-500 font-medium">
                                    {qr.holder.name} • {qr.holder.phone}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic flex items-center gap-1">
                                  <Tag className="w-3 h-3 text-amber-500" />
                                  En stock (Sin llenar)
                                </span>
                              )}
                            </td>

                            {/* Escaneos */}
                            <td className="py-3.5 px-4">
                              <span className="text-slate-700 font-bold bg-slate-100 px-2 py-0.5 rounded">
                                {qr.scansCount || 0}
                              </span>
                            </td>

                            {/* Estado */}
                            <td className="py-3.5 px-4">
                              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                isActive 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {isActive ? 'Lleno 24/7' : 'En Stock'}
                              </span>
                            </td>
                          </>
                        )}

                        {/* Columna Estado de Imprenta */}
                        <td className="py-3.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          {qr.isPrinted ? (
                            <button
                              type="button"
                              onClick={() => toggleQrPrinted(qr.sku)}
                              title={`Impreso ${qr.printedAt ? new Date(qr.printedAt).toLocaleDateString() : ''}. Haz clic para cambiar a pendiente.`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition-all cursor-pointer shadow-2xs"
                            >
                              <span>Impreso</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleQrPrinted(qr.sku)}
                              title="Pendiente de enviar a imprenta. Haz clic para marcar como ya impreso."
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-all cursor-pointer shadow-2xs"
                            >
                              <span>Pendiente</span>
                            </button>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isActive && qr.holder && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedHolderModal(qr);
                                  }}
                                  className="p-1.5 rounded-lg bg-blue-50 hover:bg-teal-100 text-blue-600 transition-colors cursor-pointer"
                                  title="Ver Ficha Completa del Conductor"
                                >
                                  <User className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditModal(qr);
                                  }}
                                  className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                                  title="Editar datos del titular y vehículo"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSku(qr.sku);
                                setPrintExportCount(1);
                                setShowPrintModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors cursor-pointer"
                              title="Configurar, previsualizar e imprimir sticker"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <a
                              href={linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              title="Abrir destino en nueva pestaña"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>

                            {/* Botón Limpiar / Desvincular Datos (si está lleno) */}
                            {isActive && (
                              <button
                                type="button"
                                onClick={(e) => handleResetQr(e, qr)}
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition-colors cursor-pointer"
                                title="Limpiar datos y devolver a Stock disponible"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}

                            {/* Botón Eliminar QR */}
                            <button
                              type="button"
                              onClick={(e) => handleDeleteQr(e, qr)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                              title="Eliminar QR permanentemente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Estado Vacío */}
                  {filteredQrs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        {filterType === 'active' ? (
                          <div className="max-w-md mx-auto">
                            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                            <p className="font-extrabold text-sm text-slate-700">No hay QRs llenados por conductores todavía</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              Los stickers generados que aún no tienen datos aparecen en la pestaña <strong>"Generados en Stock (Sin Llenar)"</strong>. Tan pronto un usuario escanee su sticker y registre su vehículo, aparecerá inmediatamente aquí.
                            </p>
                          </div>
                        ) : filterType === 'inactive' ? (
                          <div className="max-w-md mx-auto">
                            <Tag className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                            <p className="font-extrabold text-sm text-slate-700">No hay stickers en stock disponibles</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              Todos los stickers generados ya fueron entregados, o aún no has creado un lote para imprenta.
                            </p>
                            <div className="flex items-center justify-center gap-2 mt-4">
                              <button
                                type="button"
                                onClick={() => setShowBatchModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                              >
                                + Generar Lote Masivo
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowSingleModal(true)}
                                className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                              >
                                + Generar Individual
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="max-w-md mx-auto">
                            <QrCode className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                            <p className="font-extrabold text-sm text-slate-700">No hay stickers QR disponibles</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              Actualmente no hay stickers en el catálogo. Genera tu primer lote o un QR individual para comenzar.
                            </p>
                            <div className="flex items-center justify-center gap-2 mt-4">
                              <button
                                type="button"
                                onClick={() => setShowBatchModal(true)}
                                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                              >
                                + Generar Lote Masivo
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowSingleModal(true)}
                                className="bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                              >
                                + Generar Individual
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* MODAL 1: Crear QR Individual */}
      {showSingleModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSingleModal(false);
          }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative border border-blue-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-teal-600" />
                  Crear Código QR Individual
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Genera un único sticker con un SKU personalizado o automático.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSingleModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSingle} className="flex flex-col gap-3.5 mt-4 text-xs">
              <div className="flex flex-col gap-1 text-left">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 uppercase tracking-wider">
                    Código SKU (Identificador Único)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(1000 + Math.random() * 9000);
                      setSingleSkuInput(`EV${rand}VE`);
                    }}
                    className="text-[10px] text-blue-600 hover:underline font-bold"
                  >
                    Autogenerar
                  </button>
                </div>
                <input
                  type="text"
                  value={singleSkuInput}
                  onChange={(e) => setSingleSkuInput(e.target.value)}
                  placeholder="Ej. EV8990VE (o dejar vacío para autogenerar)"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 uppercase font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="font-bold text-slate-700 uppercase tracking-wider">
                  Tipo de Vehículo Destino
                </label>
                <select
                  value={singleCategory}
                  onChange={(e) => setSingleCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                >
                  <option value="Auto">Automóvil / Sedán / SUV</option>
                  <option value="Moto">Motocicleta / Casco</option>
                  <option value="Camión">Carga Pesada / Autobús</option>
                </select>
              </div>

              {/* Vista previa de enlace que tendrá */}
              <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100 text-blue-900 text-xs">
                <span className="font-bold block text-[10px] uppercase text-blue-600">Enlace que codificará el sticker:</span>
                <code className="text-[11px] break-all mt-0.5 block">
                  {getBaseUrl()}/v/{singleSkuInput.trim().toUpperCase() || 'EVXXXXVE'}
                </code>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Crear QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Crear Lote Masivo */}
      {showBatchModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBatchModal(false);
          }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative border border-blue-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                Generar Lote Masivo de QRs
              </h3>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="flex flex-col gap-3.5 mt-4 text-xs">
              <div className="flex flex-col gap-1.5 text-left">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Cantidad de Stickers a Generar</span>
                  <span className="text-blue-700 font-bold text-xs">
                    {Number(batchCount) || 1} {Number(batchCount) === 1 ? 'sticker' : 'stickers'}
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  value={batchCount}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setBatchCount(raw === '' ? '' : Math.max(1, Math.min(1000, parseInt(raw, 10) || 1)));
                  }}
                  onBlur={() => setBatchCount((prev) => Math.max(1, Math.min(1000, parseInt(prev, 10) || 1)))}
                  placeholder="Ingresa la cantidad (1 - 1000)"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all w-full"
                />
                <span className="text-[10px] text-slate-400">
                  Ingresa manualmente la cantidad exacta para la imprenta (máximo 1000 por lote).
                </span>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Formato de Código SKU
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={batchPrefix}
                    onChange={(e) => setBatchPrefix(e.target.value)}
                    placeholder="EV"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 uppercase font-bold text-slate-900 focus:outline-none focus:border-blue-600 w-24 text-center"
                  />
                  <div className="flex-1 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-[11px] text-blue-900 font-bold truncate">
                    Vista previa: {batchPrefix === 'EV' ? 'EV####VE (ej. EV3362VE)' : `${batchPrefix}0001`}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">
                  Formato oficial estándar: <code>EV</code> + 4 dígitos + <code>VE</code> (ej. <code>EV3362VE</code>).
                </span>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Categoría de Vehículo
                </label>
                <select
                  value={batchCategory}
                  onChange={(e) => setBatchCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-600"
                >
                  <option value="Auto">Automóvil / SUV / Camioneta</option>
                  <option value="Moto">Motocicleta / Casco</option>
                  <option value="Camión">Carga Pesada / Autobús</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Descripción del Lote
                </label>
                <textarea
                  rows="2"
                  maxLength={180}
                  value={batchDescription}
                  onChange={(e) => setBatchDescription(e.target.value)}
                  placeholder="Ej. Entrega para concesionario Norte, flota de motos o reposición mensual..."
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:outline-none focus:border-blue-600 focus:bg-white transition-all resize-none"
                />
                <span className="text-[10px] text-slate-400">
                  Permite identificar el motivo de creación y hacer seguimiento en el catálogo.
                </span>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
                >
                  Crear e Incorporar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL UNIFICADO: Imprimir (Configuración de Plantilla + Vista Previa + Exportación) */}
      {showPrintModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPrintModal(false);
          }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-5xl shadow-2xl relative border border-slate-200/90 animate-in zoom-in-95 duration-200 flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
            {/* Header Modal limpio sin icono ni subtítulo */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <h3 className="font-bold text-base text-slate-900">
                Imprimir
              </h3>
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* COLUMNA IZQUIERDA: Vista Previa en Vivo sin bordes blancos laterales */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between gap-2 pb-3">
                    <span className="text-[11px] font-bold uppercase text-blue-600 tracking-wider">
                      Vista Previa en Vivo
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10.5px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                        {formatTemplateMeasure(printConfig.templateWidthMm, templateUnit)} × {formatTemplateMeasure(printConfig.templateHeightMm, templateUnit)} {templateUnit}
                      </span>
                      <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${
                        printConfig.includeQr
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {printConfig.includeQr ? 'Con QR' : 'Sin QR'}
                      </span>
                    </div>
                  </div>

                  {/* Contenedor limpio de vista previa proporcional al tamaño configurado */}
                  <div className="w-full bg-slate-100/90 rounded-2xl border border-slate-200/90 p-4 flex items-center justify-center min-h-[430px]">
                    <canvas
                      ref={canvasRef}
                      style={{
                        width: `${previewCanvasCssW}px`,
                        height: `${previewCanvasCssH}px`,
                      }}
                      className="block shadow-md transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA: Configuraciones de la Plantilla + Exportación */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                {/* SECCIÓN 1: CONFIGURACIÓN DE PLANTILLA EN VIVO */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                      Configuración de la Plantilla
                    </span>
                    <span className="text-[10px] bg-pink-50 text-[#EC008C] px-2 py-0.5 rounded font-bold border border-pink-200">
                      CutContour · CMYK (0,100,0,0)
                    </span>
                  </div>

                  {/* Opción Con QR / Sin QR */}
                  <div className="bg-white p-1.5 rounded-xl border border-slate-200/80">
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setPrintConfig(prev => ({ ...prev, includeQr: true }))}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          printConfig.includeQr
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Con QR y Código
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrintConfig(prev => ({ ...prev, includeQr: false }))}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          !printConfig.includeQr
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Sin QR (Solo Plantilla)
                      </button>
                    </div>
                  </div>

                  {/* Tamaño Configurable de la Plantilla (Proporción 45:130) */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-xs">
                        Tamaño de la Plantilla
                      </span>
                      <button
                        type="button"
                        onClick={handleResetTemplateSize}
                        className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        Restablecer (45 × 130 mm)
                      </button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 focus-within:border-blue-600 focus-within:bg-white rounded-xl px-2.5 py-1.5 transition-all">
                        <span className="text-[11px] font-semibold text-slate-500">Ancho</span>
                        <input
                          type="number"
                          step="any"
                          min={templateUnit === 'cm' ? 1.5 : 15}
                          max={templateUnit === 'cm' ? 30 : 300}
                          value={templateWidthInput}
                          onChange={(e) => handleTemplateWidthChange(e.target.value)}
                          onBlur={() => setTemplateWidthInput(formatTemplateMeasure(printConfig.templateWidthMm, templateUnit))}
                          className="w-16 text-xs font-bold text-slate-900 bg-transparent outline-none text-center"
                        />
                        <span className="text-[11px] font-semibold text-slate-400">{templateUnit}</span>
                      </div>

                      <span className="text-xs font-bold text-slate-400">×</span>

                      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 focus-within:border-blue-600 focus-within:bg-white rounded-xl px-2.5 py-1.5 transition-all">
                        <span className="text-[11px] font-semibold text-slate-500">Alto</span>
                        <input
                          type="number"
                          step="any"
                          min={templateUnit === 'cm' ? 4 : 40}
                          max={templateUnit === 'cm' ? 90 : 900}
                          value={templateHeightInput}
                          onChange={(e) => handleTemplateHeightChange(e.target.value)}
                          onBlur={() => setTemplateHeightInput(formatTemplateMeasure(printConfig.templateHeightMm, templateUnit))}
                          className="w-16 text-xs font-bold text-slate-900 bg-transparent outline-none text-center"
                        />
                        <span className="text-[11px] font-semibold text-slate-400">{templateUnit}</span>
                      </div>

                      <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleTemplateUnitChange('mm')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            templateUnit === 'mm' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          mm
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTemplateUnitChange('cm')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            templateUnit === 'cm' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          cm
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Vectores de Corte Externo e Interno lado a lado en 1 fila */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/80">
                      <span className="font-bold text-slate-900 text-xs">
                        Vector de Corte Externo
                      </span>
                      <button
                        type="button"
                        onClick={() => setPrintConfig(prev => ({ ...prev, cutExternal: !prev.cutExternal }))}
                        className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ml-2 ${
                          printConfig.cutExternal ? 'bg-[#EC008C]' : 'bg-slate-300'
                        }`}
                      >
                        <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                          printConfig.cutExternal ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/80">
                      <span className="font-bold text-slate-900 text-xs">
                        Vector de Corte Interno
                      </span>
                      <button
                        type="button"
                        onClick={() => setPrintConfig(prev => ({ ...prev, cutInternal: !prev.cutInternal }))}
                        className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ml-2 ${
                          printConfig.cutInternal ? 'bg-[#EC008C]' : 'bg-slate-300'
                        }`}
                      >
                        <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                          printConfig.cutInternal ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Número de Lote Lateral + Texto del Lote en una sola fila */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center justify-between gap-3 shrink-0">
                      <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-blue-600" />
                        Incluir Número de Lote Lateral
                      </span>
                      <button
                        type="button"
                        onClick={() => setPrintConfig(prev => ({ ...prev, showBatchCode: !prev.showBatchCode }))}
                        className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                          printConfig.showBatchCode ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      >
                        <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                          printConfig.showBatchCode ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    <div className={`flex items-center gap-2 flex-1 min-w-[160px] transition-opacity ${
                      printConfig.showBatchCode ? 'opacity-100' : 'opacity-45'
                    }`}>
                      <label className="font-bold text-slate-600 uppercase tracking-wider text-[10.5px] shrink-0">
                        Texto:
                      </label>
                      <input
                        type="text"
                        maxLength={15}
                        disabled={!printConfig.showBatchCode}
                        value={printConfig.batchCodeText}
                        onChange={(e) => setPrintConfig(prev => ({ ...prev, batchCodeText: e.target.value.toUpperCase() }))}
                        placeholder="Ej. L1C"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 uppercase font-bold text-slate-900 text-xs focus:outline-none focus:border-blue-600 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 2: EXPORTACIÓN POR LOTE (Multiformato, Comprimido/Individual y Lienzo Expandible) */}
                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-200 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-bold text-blue-700 text-xs uppercase tracking-wide">
                      {printConfig.includeQr ? 'Exportación por Lote' : 'Exportación de Plantilla (Sin QR)'}
                    </span>
                  </div>

                  {printConfig.includeQr ? (
                    <>
                      {/* Selector Rápido: Pendientes vs Todos */}
                      <div className="flex items-center gap-2 bg-white p-1 rounded-xl text-xs font-bold border border-blue-200/80">
                        <button
                          type="button"
                          onClick={() => {
                            setPrintOnlyPendingInBatch(true);
                            const pCount = filteredQrs.filter(q => !q.isPrinted).length;
                            setPrintExportCount(Math.min(15, Math.max(1, pCount)));
                          }}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer text-xs ${
                            printOnlyPendingInBatch ? 'bg-amber-500 text-white font-extrabold shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Solo Pendientes ({pendingPrintCount})
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPrintOnlyPendingInBatch(false);
                            setPrintExportCount(Math.min(15, Math.max(1, filteredQrs.length)));
                          }}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-center transition-all cursor-pointer text-xs ${
                            !printOnlyPendingInBatch ? 'bg-blue-600 text-white font-extrabold shadow-xs' : 'text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Todos ({filteredQrs.length})
                        </button>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="number"
                          min="1"
                          max={Math.max(1, printOnlyPendingInBatch ? filteredQrs.filter(q => !q.isPrinted).length : filteredQrs.length)}
                          value={printExportCount}
                          onChange={(e) => {
                            const maxAllowed = printOnlyPendingInBatch ? filteredQrs.filter(q => !q.isPrinted).length : filteredQrs.length;
                            setPrintExportCount(Math.min(Math.max(1, maxAllowed), Math.max(1, parseInt(e.target.value, 10) || 1)));
                          }}
                          className="bg-white border border-blue-200 rounded-xl px-3 py-2 font-bold text-sm text-slate-900 focus:outline-none focus:border-blue-600 w-24 text-center shadow-xs"
                        />
                        <div className="flex flex-wrap items-center gap-1.5 flex-1">
                          {(() => {
                            const maxQty = printOnlyPendingInBatch ? filteredQrs.filter(q => !q.isPrinted).length : filteredQrs.length;
                            return [1, 2, 3, 5, 10, 15, 30, maxQty].filter((v, idx, arr) => v > 0 && v <= maxQty && arr.indexOf(v) === idx).map(qty => (
                              <button
                                key={qty}
                                type="button"
                                onClick={() => setPrintExportCount(qty)}
                                className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                  Number(printExportCount) === qty
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-white hover:bg-blue-50 text-blue-600 border border-blue-200'
                                }`}
                              >
                                {qty === maxQty ? `Todos (${qty})` : qty}
                              </button>
                            ));
                          })()}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-blue-200/80">
                      <span className="text-xs font-semibold text-slate-700">
                        Cantidad de plantillas base (copias):
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={printExportCount}
                        onChange={(e) => setPrintExportCount(Math.min(500, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-bold text-sm text-slate-900 focus:outline-none focus:border-blue-600 w-24 text-center"
                      />
                    </div>
                  )}

                  {/* Selector de Formato (JPG, SVG, PDF, PNG) */}
                  <div className="bg-white p-3 rounded-xl border border-blue-200/80 flex flex-col gap-2">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Formato de Exportación
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['jpg', 'svg', 'pdf', 'png'].map((fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() => setBatchExportFormat(fmt)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer border ${
                            batchExportFormat === fmt
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Modo de Entrega: Comprimido (.zip / RAR) o Individuales */}
                  <div className="bg-white p-3 rounded-xl border border-blue-200/80 flex flex-col gap-2">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Modo de Descarga
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setBatchDeliveryMode('zip')}
                        title="Empaqueta todos los archivos en un solo comprimido (.zip compatible con WinRAR)"
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          batchDeliveryMode === 'zip'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Archive className="w-3.5 h-3.5" />
                        <span>Comprimido (ZIP / RAR)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBatchDeliveryMode('individual')}
                        title="Descarga cada archivo por separado uno a uno"
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          batchDeliveryMode === 'individual'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Todos Individuales</span>
                      </button>
                    </div>
                  </div>

                  {/* BOTÓN PRINCIPAL DE DESCARGA POR LOTE + DESPLEGABLE DE LIENZO */}
                  <div className="pt-1 flex flex-col gap-2">
                    <button
                      type="button"
                      disabled={isExporting}
                      onClick={() => handleExportBatchByFormat(printExportCount)}
                      className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold py-3 px-3 rounded-xl transition-all cursor-pointer shadow-sm text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {batchDeliveryMode === 'zip' ? (
                        <Archive className="w-4 h-4" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>
                        {isExporting
                          ? 'Generando exportación...'
                          : `Descargar ${printExportCount} ${batchExportFormat.toUpperCase()} (${batchDeliveryMode === 'zip' ? 'Comprimido' : 'Individuales'})`}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowCanvasRollPanel(prev => !prev)}
                      className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-between gap-2 transition-all cursor-pointer"
                      title="Expandir configuración de lienzo o bobina para plotter"
                    >
                      <span className="flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-amber-700" />
                        <span>Exportar por Lienzo / Bobina CMYK</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="bg-amber-200/80 text-amber-900 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          Plotter
                        </span>
                        {showCanvasRollPanel ? (
                          <ChevronUp className="w-4 h-4 text-amber-800" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-amber-800" />
                        )}
                      </span>
                    </button>

                    {/* PANEL EXPANDIBLE INLINE: Lienzo / Bobina CMYK */}
                    {showCanvasRollPanel && (
                      <div className="mt-1 pt-3 border-t border-blue-200/80 flex flex-col gap-3 animate-in fade-in duration-200">
                        {/* Medidas de Bobina y Espaciado */}
                        <div className="bg-white rounded-xl p-3.5 border border-slate-200 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-800">
                              Ancho del Lienzo / Bobina:
                            </label>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                              {canvasConfig.canvasWidthMm ? `${canvasConfig.canvasWidthMm} mm (${(canvasConfig.canvasWidthMm / 10).toFixed(1)} cm)` : '—'}
                            </span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min="50"
                              max="10000"
                              step="1"
                              placeholder="Ej: 1000 (para 1 metro)"
                              value={canvasConfig.canvasWidthMm ?? ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                                setCanvasConfig(prev => ({ ...prev, canvasWidthMm: val }));
                              }}
                              onBlur={() => {
                                if (!canvasConfig.canvasWidthMm || canvasConfig.canvasWidthMm < 50) {
                                  setCanvasConfig(prev => ({ ...prev, canvasWidthMm: 1000 }));
                                }
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-center"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                              mm
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                              <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                                Sep. Horizontal:
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={canvasConfig.gapXMm ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                                    setCanvasConfig(prev => ({ ...prev, gapXMm: val }));
                                  }}
                                  onBlur={() => {
                                    if (canvasConfig.gapXMm === '') setCanvasConfig(prev => ({ ...prev, gapXMm: 0 }));
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-xs text-center"
                                />
                                <span className="text-[10.5px] text-slate-400 font-bold">mm</span>
                              </div>
                            </div>

                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                              <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                                Sep. Vertical:
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={canvasConfig.gapYMm ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                                    setCanvasConfig(prev => ({ ...prev, gapYMm: val }));
                                  }}
                                  onBlur={() => {
                                    if (canvasConfig.gapYMm === '') setCanvasConfig(prev => ({ ...prev, gapYMm: 0 }));
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-xs text-center"
                                />
                                <span className="text-[10.5px] text-slate-400 font-bold">mm</span>
                              </div>
                            </div>

                            <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                              <label className="text-[10.5px] font-bold text-slate-600 block mb-1">
                                Margen Pinzas:
                              </label>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={canvasConfig.marginMm ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                                    setCanvasConfig(prev => ({ ...prev, marginMm: val }));
                                  }}
                                  onBlur={() => {
                                    if (canvasConfig.marginMm === '') setCanvasConfig(prev => ({ ...prev, marginMm: 0 }));
                                  }}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-xs text-center"
                                />
                                <span className="text-[10.5px] text-slate-400 font-bold">mm</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-1">
                            <span className="text-xs font-bold text-slate-800">
                              Cantidad de Filas:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="1"
                                max="500"
                                step="1"
                                value={canvasConfig.targetRows ?? ''}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                                  setCanvasConfig(prev => ({ ...prev, targetRows: val }));
                                }}
                                onBlur={() => {
                                  if (!canvasConfig.targetRows || canvasConfig.targetRows < 1) {
                                    setCanvasConfig(prev => ({ ...prev, targetRows: 1 }));
                                  }
                                }}
                                className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-xs text-slate-900 text-center focus:outline-none focus:border-blue-600"
                              />
                              <span className="text-xs font-semibold text-slate-400">filas</span>
                            </div>
                          </div>
                        </div>

                        {/* Cálculo en Vivo para Plotter */}
                        {(() => {
                          const layout = calculateCanvasRollLayout(canvasConfig, printConfig);
                          return (
                            <div className="bg-white text-slate-800 rounded-xl p-3 flex flex-col gap-2.5 border border-slate-200/90 shadow-2xs">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold uppercase tracking-wider text-blue-600">
                                  Resumen de Bobina
                                </span>
                                <span className="text-slate-500 font-semibold">
                                  {layout.stickerWidth} × {layout.stickerHeight} mm
                                </span>
                              </div>

                              <div className="grid grid-cols-4 gap-1.5 text-center">
                                <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-200/80">
                                  <span className="text-[9.5px] font-semibold text-slate-500 uppercase block">Por Fila</span>
                                  <strong className="text-sm font-bold text-slate-900">{layout.cols}</strong>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-200/80">
                                  <span className="text-[9.5px] font-semibold text-slate-500 uppercase block">Filas</span>
                                  <strong className="text-sm font-bold text-slate-900">{layout.rows}</strong>
                                </div>
                                <div className="bg-blue-50/80 rounded-lg p-1.5 border border-blue-200">
                                  <span className="text-[9.5px] font-semibold text-blue-600 uppercase block">Total</span>
                                  <strong className="text-sm font-bold text-blue-700">{layout.totalStickers}</strong>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-1.5 border border-slate-200/80">
                                  <span className="text-[9.5px] font-semibold text-slate-500 uppercase block">Largo</span>
                                  <strong className="text-sm font-bold text-slate-900">{layout.linearMeters} m</strong>
                                </div>
                              </div>

                              <div className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                                <span className="font-medium">Tamaño del lienzo:</span>
                                <strong className="text-slate-900 font-bold">
                                  {layout.canvasWidthMm} mm × {Math.round(layout.canvasHeightMm)} mm
                                </strong>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Descargas del Lienzo / Bobina CMYK */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled={isExporting}
                            onClick={handleExportCanvasPdf}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer shadow-xs text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Descargar Lienzo PDF CMYK</span>
                          </button>

                          <button
                            type="button"
                            disabled={isExporting}
                            onClick={handleExportCanvasSvg}
                            className="w-full bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer shadow-xs text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                          >
                            <Download className="w-3.5 h-3.5 text-blue-600" />
                            <span>Descargar Lienzo SVG CMYK</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* MODAL 3: Ficha Completa del Conductor / QR Lleno */}
      {selectedHolderModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedHolderModal(null);
          }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative border border-emerald-100 animate-in zoom-in-95 duration-200 flex flex-col gap-4">
            {/* Header del Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                      Ficha Oficial de Seguridad Vial
                    </h3>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                      Activo 24/7
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sticker SKU: <span className="font-bold text-blue-600">{selectedHolderModal.sku}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHolderModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Datos del Titular y Vehículo */}
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conductor Titular</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {selectedHolderModal.holder?.name || 'Usuario Escudo Vial'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 border-b border-slate-200/60 pb-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cédula de Identidad</span>
                    <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                      {selectedHolderModal.holder?.cedula || 'V-00.000.000'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Teléfono Conductor</span>
                    <span className="font-semibold text-slate-800 text-xs mt-0.5 block">
                      {selectedHolderModal.holder?.phone || 'Sin número'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-b border-slate-200/60 pb-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Vehículo / Modelo</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">
                      {selectedHolderModal.holder?.vehicle || 'Vehículo Particular'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Placa del Vehículo</span>
                    <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100 inline-block mt-0.5">
                      {selectedHolderModal.holder?.plate || 'S/P'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tipo de Sangre</span>
                    <span className="font-extrabold text-rose-600 text-xs mt-0.5 block">
                      {selectedHolderModal.holder?.bloodType || 'O+'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Póliza Escudo Vial</span>
                    <span className="font-semibold text-slate-700 text-xs mt-0.5 block truncate">
                      {selectedHolderModal.holder?.insurancePolicy || `Póliza 24/7 #${selectedHolderModal.sku}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Contacto de Auxilio Familiar */}
              <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">Contacto Familiar de Auxilio</span>
                  <div className="font-extrabold text-slate-900 text-xs mt-0.5">
                    {selectedHolderModal.holder?.emergencyContactName || 'Familiar Registrado'}
                  </div>
                  <div className="text-[11px] text-teal-800 mt-0.5">
                    {selectedHolderModal.holder?.emergencyContactPhone || selectedHolderModal.holder?.phone}
                  </div>
                </div>

                {selectedHolderModal.holder?.emergencyContactPhone && (
                  <a
                    href={`tel:${selectedHolderModal.holder.emergencyContactPhone}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Llamar</span>
                  </a>
                )}
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <a
                href={`${getBaseUrl()}/v/${selectedHolderModal.sku}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Abrir Botón S.O.S del Usuario</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  handleOpenEditModal(selectedHolderModal);
                }}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-extrabold text-xs py-2.5 px-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                title="Editar información de este vehículo"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Ficha</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedSku(selectedHolderModal.sku);
                  setSelectedHolderModal(null);
                  setShowPrintModal(true);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-3.5 rounded-xl transition-all cursor-pointer"
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Editar Información del Titular y Vehículo */}
      {editingQrModal && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSavingEdit) setEditingQrModal(null);
          }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl relative border border-blue-100 animate-in zoom-in-95 duration-200 flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                      Editar Ficha del Vehículo
                    </h3>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {editingQrModal.sku}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Modifica los datos del conductor o vehículo sin alterar el código QR físico.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={() => setEditingQrModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulario de Edición */}
            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              {/* Sección 1: Titular */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Datos del Conductor Titular
                </span>
                
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    placeholder="Ej. Carlos Pérez"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Cédula de Identidad</label>
                    <input
                      type="text"
                      required
                      value={editFormData.cedula}
                      onChange={(e) => setEditFormData({ ...editFormData, cedula: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                      placeholder="Ej. V-18.452.901"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Teléfono Principal</label>
                    <input
                      type="tel"
                      required
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                      placeholder="Ej. 0414-1234567"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Vehículo */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Datos del Vehículo
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Marca y Modelo</label>
                    <input
                      type="text"
                      required
                      value={editFormData.vehicle}
                      onChange={(e) => setEditFormData({ ...editFormData, vehicle: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                      placeholder="Ej. Bera SBR 150 / Toyota Corolla"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Placa</label>
                    <input
                      type="text"
                      required
                      value={editFormData.plate}
                      onChange={(e) => setEditFormData({ ...editFormData, plate: e.target.value.toUpperCase() })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 uppercase focus:outline-none focus:border-blue-600"
                      placeholder="Ej. AA1A00A"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Tipo de Sangre</label>
                    <select
                      value={editFormData.bloodType}
                      onChange={(e) => setEditFormData({ ...editFormData, bloodType: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                    >
                      {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Póliza / Contrato</label>
                    <input
                      type="text"
                      value={editFormData.insurancePolicy}
                      onChange={(e) => setEditFormData({ ...editFormData, insurancePolicy: e.target.value })}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                      placeholder="Póliza 24/7 #..."
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Contacto Familiar de Emergencia */}
              <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100 space-y-3">
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block">
                  Contacto Familiar de Auxilio
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Nombre Familiar</label>
                    <input
                      type="text"
                      value={editFormData.emergencyContactName}
                      onChange={(e) => setEditFormData({ ...editFormData, emergencyContactName: e.target.value })}
                      className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#00A896]"
                      placeholder="Ej. Esposa / Padre"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Teléfono Familiar</label>
                    <input
                      type="tel"
                      value={editFormData.emergencyContactPhone}
                      onChange={(e) => setEditFormData({ ...editFormData, emergencyContactPhone: e.target.value })}
                      className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#00A896]"
                      placeholder="Ej. 0424-9876543"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={() => setEditingQrModal(null)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSavingEdit ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
