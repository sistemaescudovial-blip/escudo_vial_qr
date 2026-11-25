import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  createStandaloneQrCanvas, 
  exportBatchStandaloneQrZip, 
  exportBatchStandaloneQrPdf 
} from '../../utils/qrGenerator';
import { 
  FileText, 
  Archive, 
  CheckSquare, 
  Square, 
  Search, 
  ArrowLeft,
  ExternalLink, 
  Copy, 
  Check, 
  Layers,
  Palette,
  LayoutList,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';

export default function QrStandaloneExporterView({ searchQuery = '', onBack }) {
  const { qrList } = useApp();

  // Opciones de Configuración de Tamaño, Unidad, Calidad y Formato
  const [unit, setUnit] = useState('cm'); // 'cm' | 'mm'
  const [sizeValue, setSizeValue] = useState('8');
  const [dpiValue, setDpiValue] = useState('300');
  const [exportFormat, setExportFormat] = useState('png'); // 'png' | 'jpg' | 'svg' | 'pdf'
  const [darkColor, setDarkColor] = useState('#0F172A'); // Slate 900 oscuro moderno
  const [transparentBg, setTransparentBg] = useState(false);
  const [showSkuFooter, setShowSkuFooter] = useState(false);
  const [skuSizeValue, setSkuSizeValue] = useState('4');
  const [skuOffsetXValue, setSkuOffsetXValue] = useState('0');
  const [skuBottomYValue, setSkuBottomYValue] = useState('3');
  const [isDraggingSku, setIsDraggingSku] = useState(false);

  const previewBoxRef = useRef(null);
  const dragStartRef = useRef(null);

  const numericDisplaySize = Math.max(
    unit === 'mm' ? 10 : 1,
    Math.min(unit === 'mm' ? 500 : 50, parseFloat(sizeValue) || (unit === 'mm' ? 80 : 8))
  );
  const sizeCm = unit === 'mm' ? numericDisplaySize / 10 : numericDisplaySize;
  const safeDpi = Math.max(72, Math.min(1200, parseInt(dpiValue, 10) || 300));
  const sizeLabel = `${numericDisplaySize}x${numericDisplaySize}${unit}`;

  // Medidas exactas del SKU al pie en mm (tolerancia 0.01 mm)
  const stickerSizeMm = Math.round(sizeCm * 10 * 100) / 100;
  const halfStickerMm = Math.round((stickerSizeMm / 2) * 10) / 10;
  const maxSkuSizeMm = Math.max(1, Math.round(stickerSizeMm * 0.4 * 10) / 10);

  const parsedSkuSize = parseFloat(skuSizeValue);
  const safeSkuSizeMm = Number.isFinite(parsedSkuSize)
    ? Math.round(Math.max(0.5, Math.min(maxSkuSizeMm, parsedSkuSize)) * 100) / 100
    : Math.min(4, maxSkuSizeMm);

  const parsedSkuOffsetX = parseFloat(skuOffsetXValue);
  const safeSkuOffsetXMm = Number.isFinite(parsedSkuOffsetX)
    ? Math.round(Math.max(-halfStickerMm, Math.min(halfStickerMm, parsedSkuOffsetX)) * 100) / 100
    : 0;

  const parsedSkuBottomY = parseFloat(skuBottomYValue);
  const safeSkuBottomYMm = Number.isFinite(parsedSkuBottomY)
    ? Math.round(Math.max(0, Math.min(stickerSizeMm, parsedSkuBottomY)) * 100) / 100
    : Math.min(3, stickerSizeMm);

  const handleResetSkuLayout = () => {
    const defaultSize = Math.max(1, Math.round((stickerSizeMm * 0.05) * 10) / 10);
    const defaultBottom = Math.max(0.5, Math.round((stickerSizeMm * 0.0375) * 10) / 10);
    setSkuSizeValue(String(defaultSize));
    setSkuOffsetXValue('0');
    setSkuBottomYValue(String(defaultBottom));
  };

  const handleUnitChange = (nextUnit) => {
    if (nextUnit === unit) return;
    const current = parseFloat(sizeValue) || (unit === 'mm' ? 80 : 8);
    if (nextUnit === 'mm') {
      setSizeValue(String(Math.round(current * 10 * 10) / 10));
    } else {
      setSizeValue(String(Math.round((current / 10) * 100) / 100));
    }
    setUnit(nextUnit);
  };

  // Modo de visualización: 'table' (compacta) o 'grid' (tarjetas)
  const [viewMode, setViewMode] = useState('table');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Filtros
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [localSearch, setLocalSearch] = useState(searchQuery || '');
  const [selectedSkus, setSelectedSkus] = useState(new Set());
  const [previewSku, setPreviewSku] = useState(qrList[0]?.sku || 'EVAUTO0001');
  const [previewDataUrl, setPreviewDataUrl] = useState('');
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [copiedSku, setCopiedSku] = useState(null);

  // Filtrado de códigos QR
  const filteredQrs = qrList.filter(q => {
    const cleanSku = (q.sku || '').replace(/[#-]/g, '').toUpperCase();
    const matchesSearch = cleanSku.includes(localSearch.toUpperCase()) ||
      (q.batchDescription || '').toLowerCase().includes(localSearch.toLowerCase()) ||
      (q.batchId || '').toLowerCase().includes(localSearch.toLowerCase()) ||
      (q.holder?.name || '').toLowerCase().includes(localSearch.toLowerCase()) ||
      (q.holder?.vehicle || '').toLowerCase().includes(localSearch.toLowerCase());

    const matchesCategory = filterCategory === 'all' || (q.category || 'Auto').toLowerCase() === filterCategory.toLowerCase();
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Paginación calculada
  const totalPages = Math.max(1, Math.ceil(filteredQrs.length / pageSize));
  const paginatedQrs = filteredQrs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset de página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCategory, filterStatus, localSearch, pageSize]);

  // Inicializar selección inicial y preview
  useEffect(() => {
    if (selectedSkus.size === 0 && filteredQrs.length > 0) {
      setSelectedSkus(new Set(filteredQrs.map(q => q.sku)));
    }
    if (!previewSku && filteredQrs.length > 0) {
      setPreviewSku(filteredQrs[0].sku);
    }
  }, [filteredQrs.length]);

  // Actualizar la vista previa interactiva en tiempo real al cambiar tamaño o diseño
  useEffect(() => {
    let isCancelled = false;
    const targetSku = previewSku || (filteredQrs[0]?.sku) || 'EVAUTO0001';
    const cleanSku = targetSku.replace(/[#-]/g, '').toUpperCase();
    const targetUrl = `${window.location.origin}/v/${cleanSku}`;
    // Tope de resolución en vista previa para respuesta fluida al mover controles o arrastrar
    const previewDpi = Math.min(safeDpi, Math.max(96, Math.round((480 * 2.54) / sizeCm)));

    createStandaloneQrCanvas(cleanSku, targetUrl, sizeCm, {
      transparentBg,
      darkColor,
      showSkuFooter,
      skuSizeMm: safeSkuSizeMm,
      skuOffsetXMm: safeSkuOffsetXMm,
      skuBottomYMm: safeSkuBottomYMm,
      dpi: previewDpi,
      forceOpaqueBg: exportFormat === 'jpg' || exportFormat === 'pdf'
    }).then(canvas => {
      if (!isCancelled) {
        setPreviewDataUrl(canvas.toDataURL('image/png'));
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [previewSku, sizeCm, safeDpi, exportFormat, darkColor, transparentBg, showSkuFooter, safeSkuSizeMm, safeSkuOffsetXMm, safeSkuBottomYMm]);

  const handlePreviewPointerDown = (e) => {
    if (!showSkuFooter || !previewBoxRef.current) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startOffsetXMm: safeSkuOffsetXMm,
      startBottomYMm: safeSkuBottomYMm
    };
    setIsDraggingSku(true);
  };

  const handlePreviewPointerMove = (e) => {
    if (!isDraggingSku || !dragStartRef.current || !previewBoxRef.current) return;
    const rect = previewBoxRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dxMm = ((e.clientX - dragStartRef.current.clientX) / rect.width) * stickerSizeMm;
    const dyFromBottomMm = -((e.clientY - dragStartRef.current.clientY) / rect.height) * stickerSizeMm;

    let nextX = Math.max(-halfStickerMm, Math.min(halfStickerMm, dragStartRef.current.startOffsetXMm + dxMm));
    if (Math.abs(nextX) <= Math.max(0.4, stickerSizeMm * 0.005)) {
      nextX = 0;
    }
    const nextY = Math.max(0, Math.min(stickerSizeMm, dragStartRef.current.startBottomYMm + dyFromBottomMm));

    setSkuOffsetXValue(String(Math.round(nextX * 10) / 10));
    setSkuBottomYValue(String(Math.round(nextY * 10) / 10));
  };

  const handlePreviewPointerUp = (e) => {
    if (!isDraggingSku) return;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignorar si ya fue liberado
    }
    dragStartRef.current = null;
    setIsDraggingSku(false);
  };

  // Manejadores de Selección
  const handleSelectAllFiltered = () => {
    if (selectedSkus.size === filteredQrs.length) {
      setSelectedSkus(new Set());
    } else {
      setSelectedSkus(new Set(filteredQrs.map(q => q.sku)));
    }
  };

  const handleSelectFirstN = (n) => {
    const firstN = filteredQrs.slice(0, n).map(q => q.sku);
    setSelectedSkus(new Set(firstN));
  };

  const toggleSelectSku = (sku) => {
    const next = new Set(selectedSkus);
    if (next.has(sku)) {
      next.delete(sku);
    } else {
      next.add(sku);
    }
    setSelectedSkus(next);
  };

  // Descargas Masivas
  const handleExportZip = async () => {
    const targetQrs = filteredQrs.filter(q => selectedSkus.has(q.sku));
    if (targetQrs.length === 0) {
      alert('Por favor selecciona al menos un código QR para exportar.');
      return;
    }

    setIsExportingZip(true);
    try {
      await exportBatchStandaloneQrZip(targetQrs, sizeCm, window.location.origin, {
        transparentBg,
        darkColor,
        showSkuFooter,
        skuSizeMm: safeSkuSizeMm,
        skuOffsetXMm: safeSkuOffsetXMm,
        skuBottomYMm: safeSkuBottomYMm,
        dpi: safeDpi,
        sizeLabel,
        format: exportFormat
      });
    } catch (err) {
      console.error('Error al exportar ZIP:', err);
      alert('Hubo un problema generando el archivo ZIP.');
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportPdf = async () => {
    const targetQrs = filteredQrs.filter(q => selectedSkus.has(q.sku));
    if (targetQrs.length === 0) {
      alert('Por favor selecciona al menos un código QR para imprimir.');
      return;
    }

    setIsExportingPdf(true);
    try {
      await exportBatchStandaloneQrPdf(targetQrs, sizeCm, window.location.origin, {
        transparentBg,
        darkColor,
        showSkuFooter,
        skuSizeMm: safeSkuSizeMm,
        skuOffsetXMm: safeSkuOffsetXMm,
        skuBottomYMm: safeSkuBottomYMm,
        dpi: safeDpi,
        sizeLabel
      });
    } catch (err) {
      console.error('Error al exportar PDF:', err);
      alert('Hubo un problema generando el archivo PDF.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopyLink = (sku) => {
    const cleanSku = sku.replace(/[#-]/g, '').toUpperCase();
    const url = `${window.location.origin}/v/${cleanSku}`;
    navigator.clipboard.writeText(url);
    setCopiedSku(sku);
    setTimeout(() => setCopiedSku(null), 1800);
  };

  const selectedCount = filteredQrs.filter(q => selectedSkus.has(q.sku)).length;
  const resolutionPx = Math.min(4500, Math.max(180, Math.round((sizeCm / 2.54) * safeDpi)));

  return (
    <div className="flex flex-col gap-5 mt-4 animate-in fade-in duration-300">
      {/* 1. CABECERA Y PANEL DE CONFIGURACIÓN DEL QR */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col lg:flex-row gap-6 items-start justify-between">
        <div className="flex-1 w-full">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a Gestión QR</span>
            </button>
          )}
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Exportar QR Solos
          </h2>

          {/* Configuración de Tamaño (Manual) y Calidad (DPI) */}
          <div className="mt-4 flex flex-col gap-4">
            {/* Tamaño Manual (Alto = Ancho automático) + Selector cm / mm */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Tamaño:
              </span>

              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Campo Alto */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 focus-within:border-blue-600 focus-within:bg-white rounded-xl px-3 py-2 transition-all">
                  <span className="text-[11px] font-semibold text-slate-500">Alto</span>
                  <input
                    type="number"
                    step="any"
                    min={unit === 'mm' ? 10 : 1}
                    max={unit === 'mm' ? 500 : 50}
                    value={sizeValue}
                    onChange={(e) => setSizeValue(e.target.value)}
                    onBlur={() => setSizeValue(String(numericDisplaySize))}
                    className="w-16 text-sm font-bold text-slate-900 bg-transparent outline-none text-center"
                  />
                  <span className="text-xs font-semibold text-slate-400">{unit}</span>
                </div>

                <span className="text-xs font-bold text-slate-400">×</span>

                {/* Campo Ancho (Sincronizado automáticamente con Alto) */}
                <div className="flex items-center gap-1.5 bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-2">
                  <span className="text-[11px] font-semibold text-slate-500">Ancho</span>
                  <input
                    type="number"
                    step="any"
                    value={sizeValue}
                    onChange={(e) => setSizeValue(e.target.value)}
                    onBlur={() => setSizeValue(String(numericDisplaySize))}
                    title="Se ajusta automáticamente igual al Alto"
                    className="w-16 text-sm font-bold text-slate-700 bg-transparent outline-none text-center"
                  />
                  <span className="text-xs font-semibold text-slate-400">{unit}</span>
                </div>

                {/* Selector de Unidad (cm / mm) */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleUnitChange('cm')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      unit === 'cm'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    cm
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitChange('mm')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      unit === 'mm'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    mm
                  </button>
                </div>
              </div>
            </div>

            {/* Calidad Configurable (DPI) */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Calidad:
              </span>

              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 focus-within:border-blue-600 focus-within:bg-white rounded-xl px-3 py-2 transition-all">
                  <input
                    type="number"
                    min="72"
                    max="1200"
                    step="1"
                    value={dpiValue}
                    onChange={(e) => setDpiValue(e.target.value)}
                    onBlur={() => setDpiValue(String(safeDpi))}
                    className="w-16 text-sm font-bold text-slate-900 bg-transparent outline-none text-center"
                  />
                  <span className="text-xs font-semibold text-slate-400">DPI</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {[150, 300, 600].map(presetDpi => (
                    <button
                      key={presetDpi}
                      type="button"
                      onClick={() => setDpiValue(String(presetDpi))}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                        safeDpi === presetDpi
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {presetDpi} DPI
                    </button>
                  ))}
                </div>

                <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                  {resolutionPx} × {resolutionPx} px
                </span>
              </div>
            </div>

            {/* Formato */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">
                Formato:
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {['png', 'jpg', 'svg', 'pdf'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setExportFormat(fmt)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wide border transition-all cursor-pointer ${
                      exportFormat === fmt
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
                <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                  {exportFormat === 'svg'
                    ? 'Vectorial escalable'
                    : exportFormat === 'jpg'
                      ? 'Imagen fondo sólido'
                      : exportFormat === 'pdf'
                        ? 'PDF individual por QR'
                        : 'Ráster alta nitidez'}
                </span>
              </div>
            </div>

            {/* Opciones de Color y Acabado */}
            <div className="flex items-center gap-4 flex-wrap pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-slate-400" /> Color:
                </span>
                <button
                  type="button"
                  onClick={() => setDarkColor('#0F172A')}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                    darkColor === '#0F172A' ? 'scale-110 border-blue-600 ring-2 ring-blue-200' : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: '#0F172A' }}
                  title="Slate Oscuro (#0F172A)"
                />
                <button
                  type="button"
                  onClick={() => setDarkColor('#000000')}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                    darkColor === '#000000' ? 'scale-110 border-blue-600 ring-2 ring-blue-200' : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: '#000000' }}
                  title="Negro Puro (#000000)"
                />
              </div>

              <label
                className={`flex items-center gap-2 select-none ${
                  exportFormat === 'jpg' || exportFormat === 'pdf'
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
                title={
                  exportFormat === 'jpg' || exportFormat === 'pdf'
                    ? 'Disponible solo para formatos PNG y SVG'
                    : 'Exportar sin fondo blanco'
                }
              >
                <input 
                  type="checkbox"
                  checked={transparentBg && exportFormat !== 'jpg' && exportFormat !== 'pdf'}
                  disabled={exportFormat === 'jpg' || exportFormat === 'pdf'}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="text-xs font-medium text-slate-700">Fondo Transparente</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={showSkuFooter}
                  onChange={(e) => setShowSkuFooter(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700">Incluir SKU al pie</span>
              </label>
            </div>

            {showSkuFooter && (
              <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 space-y-3.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800">
                      Posición y tamaño del SKU
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      (Sticker {stickerSizeMm} × {stickerSizeMm} mm)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSkuOffsetXValue('0')}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 text-slate-600 transition-colors cursor-pointer"
                      title="Centrar horizontalmente (X = 0 mm)"
                    >
                      Centrar X
                    </button>
                    <button
                      type="button"
                      onClick={handleResetSkuLayout}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer flex items-center gap-1"
                      title="Restablecer posición y tamaño predeterminados"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restablecer</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Tamaño exacto del SKU */}
                  <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold text-slate-700">Tamaño</span>
                      <span className="text-[10.5px] font-medium text-slate-400">
                        {(safeSkuSizeMm * 2.83465).toFixed(1)} pt
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 focus-within:border-blue-600 focus-within:bg-white rounded-lg px-2.5 py-1.5 transition-all">
                      <input
                        type="number"
                        step="0.1"
                        min="0.5"
                        max={maxSkuSizeMm}
                        value={skuSizeValue}
                        onChange={(e) => setSkuSizeValue(e.target.value)}
                        onBlur={() => setSkuSizeValue(String(safeSkuSizeMm))}
                        className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none"
                      />
                      <span className="text-[11px] font-semibold text-slate-400">mm</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max={maxSkuSizeMm}
                      step="0.1"
                      value={safeSkuSizeMm}
                      onChange={(e) => setSkuSizeValue(e.target.value)}
                      className="w-full accent-blue-600 cursor-pointer h-1.5"
                    />
                  </div>

                  {/* Posición Horizontal X (respecto al centro) */}
                  <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold text-slate-700">Posición X</span>
                      <span className="text-[10.5px] font-medium text-slate-400">Centro = 0</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 focus-within:border-blue-600 focus-within:bg-white rounded-lg px-2.5 py-1.5 transition-all">
                      <input
                        type="number"
                        step="0.1"
                        min={-halfStickerMm}
                        max={halfStickerMm}
                        value={skuOffsetXValue}
                        onChange={(e) => setSkuOffsetXValue(e.target.value)}
                        onBlur={() => setSkuOffsetXValue(String(safeSkuOffsetXMm))}
                        className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none"
                      />
                      <span className="text-[11px] font-semibold text-slate-400">mm</span>
                    </div>
                    <input
                      type="range"
                      min={-halfStickerMm}
                      max={halfStickerMm}
                      step="0.1"
                      value={safeSkuOffsetXMm}
                      onChange={(e) => setSkuOffsetXValue(e.target.value)}
                      className="w-full accent-blue-600 cursor-pointer h-1.5"
                    />
                  </div>

                  {/* Posición Vertical Y (desde el borde inferior) */}
                  <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-semibold text-slate-700">Posición Y</span>
                      <span className="text-[10.5px] font-medium text-slate-400">Desde abajo</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 focus-within:border-blue-600 focus-within:bg-white rounded-lg px-2.5 py-1.5 transition-all">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max={stickerSizeMm}
                        value={skuBottomYValue}
                        onChange={(e) => setSkuBottomYValue(e.target.value)}
                        onBlur={() => setSkuBottomYValue(String(safeSkuBottomYMm))}
                        className="w-full text-xs font-bold text-slate-900 bg-transparent outline-none"
                      />
                      <span className="text-[11px] font-semibold text-slate-400">mm</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={stickerSizeMm}
                      step="0.1"
                      value={safeSkuBottomYMm}
                      onChange={(e) => setSkuBottomYValue(e.target.value)}
                      className="w-full accent-blue-600 cursor-pointer h-1.5"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TARJETA DE VISTA PREVIA INTERACTIVA */}
        <div className="w-full lg:w-80 bg-white p-4 rounded-2xl text-slate-800 flex flex-col items-center text-center shadow-xs border border-slate-200/90 shrink-0">
          <div className="flex items-center justify-between w-full mb-2.5">
            <span className="text-[10.5px] font-bold uppercase text-blue-600 tracking-wider">
              Vista Previa en Vivo
            </span>
            <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-semibold">
              {numericDisplaySize} × {numericDisplaySize} {unit}
            </span>
          </div>

          <div
            className={`p-2.5 rounded-xl border border-slate-200 shadow-2xs ${
              transparentBg && exportFormat !== 'jpg' && exportFormat !== 'pdf'
                ? 'bg-[linear-gradient(45deg,#e2e8f0_25%,transparent_25%,transparent_75%,#e2e8f0_75%,#e2e8f0),linear-gradient(45deg,#e2e8f0_25%,transparent_25%,transparent_75%,#e2e8f0_75%,#e2e8f0)] bg-[length:14px_14px] bg-[position:0_0,7px_7px] bg-white'
                : 'bg-slate-50'
            }`}
          >
            <div
              ref={previewBoxRef}
              onPointerDown={handlePreviewPointerDown}
              onPointerMove={handlePreviewPointerMove}
              onPointerUp={handlePreviewPointerUp}
              onPointerCancel={handlePreviewPointerUp}
              title={showSkuFooter ? 'Arrastra horizontal o verticalmente para posicionar el SKU' : undefined}
              className={`w-52 h-52 relative flex items-center justify-center rounded-lg overflow-hidden select-none group ${
                showSkuFooter ? 'cursor-move touch-none' : ''
              }`}
            >
              {previewDataUrl ? (
                <img
                  src={previewDataUrl}
                  alt="Vista Previa QR Solo"
                  draggable={false}
                  className={`w-full h-full object-contain block drop-shadow-xs transition-transform duration-200 ${
                    showSkuFooter ? '' : 'group-hover:scale-105'
                  }`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-medium">
                  Generando...
                </div>
              )}

              {showSkuFooter && isDraggingSku && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-1/2 border-l border-dashed border-blue-500/75"
                />
              )}
            </div>
          </div>

          <div className="mt-3 w-full">
            <div className="text-xs font-bold tracking-wider text-slate-900 truncate">
              {previewSku}
            </div>
            {showSkuFooter && (
              <div className="mt-1 space-y-0.5">
                <div className="text-[11px] font-medium text-slate-600">
                  SKU: {safeSkuSizeMm} mm · X {safeSkuOffsetXMm > 0 ? `+${safeSkuOffsetXMm}` : safeSkuOffsetXMm} mm · Y {safeSkuBottomYMm} mm
                </div>
                <div className="text-[10.5px] text-slate-400">
                  Arrastra en la vista previa o ajusta las medidas
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. BARRA DE CONTROL DE LOTES, FILTROS Y VISTAS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Filtros y Buscador */}
          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Buscar SKU, lote, titular o placa..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-800"
              />
            </div>

            <select 
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 outline-none"
            >
              <option value="all">Todas las categorías</option>
              <option value="auto">Solo Autos</option>
              <option value="moto">Solo Motos</option>
              <option value="camion">Solo Camiones</option>
            </select>

            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Solo Vinculados</option>
              <option value="inactive">Solo Disponibles</option>
            </select>

            {/* Alternador de Vista */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Vista Tabla Compacta"
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabla</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Vista Cuadrícula de Tarjetas"
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'grid' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tarjetas</span>
              </button>
            </div>
          </div>

          {/* Acciones de Descarga en Lote */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <span className="text-xs font-medium text-slate-500 mr-1">
              <b className="text-slate-800">{selectedCount}</b> de {filteredQrs.length} seleccionados
            </span>

            {/* Botón Lote ZIP */}
            <button
              type="button"
              disabled={selectedCount === 0 || isExportingZip}
              onClick={handleExportZip}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
            >
              <Archive className={`w-4 h-4 ${isExportingZip ? 'animate-spin' : ''}`} />
              <span>{isExportingZip ? 'Comprimiendo...' : `Descargar ZIP (${selectedCount} · ${exportFormat.toUpperCase()})`}</span>
            </button>

            {/* Botón Pliego PDF */}
            <button
              type="button"
              disabled={selectedCount === 0 || isExportingPdf}
              onClick={handleExportPdf}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
            >
              <FileText className={`w-4 h-4 ${isExportingPdf ? 'animate-spin' : ''}`} />
              <span>{isExportingPdf ? 'Generando...' : `Planilla PDF (${selectedCount})`}</span>
            </button>
          </div>
        </div>

        {/* Barra de Selección Rápida */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Selección rápida:</span>
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="text-blue-600 hover:underline font-semibold cursor-pointer"
            >
              {selectedSkus.size === filteredQrs.length ? 'Deseleccionar todos' : 'Todos'}
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleSelectFirstN(10)}
              className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              Primeros 10
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleSelectFirstN(25)}
              className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              Primeros 25
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => handleSelectFirstN(50)}
              className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
            >
              Primeros 50
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span>Mostrar por página:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value, 10))}
              className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. VISTA TABLA COMPACTA */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10.5px]">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="cursor-pointer text-slate-400 hover:text-slate-600"
                    >
                      {selectedSkus.size === filteredQrs.length && filteredQrs.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3">QR</th>
                  <th className="py-3 px-4">Código SKU</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Titular / Vehículo</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedQrs.map((qr) => {
                  const isSelected = selectedSkus.has(qr.sku);
                  const isPreviewing = previewSku === qr.sku;
                  const cleanSku = (qr.sku || '').replace(/[#-]/g, '').toUpperCase();
                  const targetUrl = `${window.location.origin}/v/${cleanSku}`;

                  return (
                    <tr
                      key={qr.sku}
                      onClick={() => setPreviewSku(qr.sku)}
                      className={`transition-colors cursor-pointer ${
                        isPreviewing 
                          ? 'bg-blue-50/40 font-medium' 
                          : 'hover:bg-slate-50/60'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => toggleSelectSku(qr.sku)}
                          className="cursor-pointer text-slate-400 hover:text-slate-600"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Miniatura */}
                      <td className="py-2.5 px-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center relative shadow-2xs group">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(targetUrl)}&color=0f-17-2a&bgcolor=ffffff`}
                            alt={cleanSku}
                            className="w-full h-full object-contain rounded"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-white flex items-center justify-center">
                              <span className="text-white text-[5px] font-black">EV</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3 px-4 font-bold text-slate-900 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{cleanSku}</span>
                          {isPreviewing && (
                            <span className="bg-blue-50 text-blue-700 text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border border-blue-200">
                              Activo
                            </span>
                          )}
                        </div>
                        {qr.batchDescription && (
                          <p
                            className="text-[10.5px] font-normal text-slate-500 truncate max-w-[220px] mt-0.5"
                            title={qr.batchDescription}
                          >
                            {qr.batchDescription}
                          </p>
                        )}
                      </td>

                      {/* Categoría */}
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 text-[10.5px] font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                          {qr.category || 'Auto'}
                        </span>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                          qr.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {qr.status === 'active' ? 'Vinculado' : 'Disponible'}
                        </span>
                      </td>

                      {/* Titular */}
                      <td className="py-3 px-4 text-slate-600">
                        {qr.holder?.name ? (
                          <div>
                            <span className="font-semibold text-slate-900 block truncate max-w-xs">{qr.holder.name}</span>
                            <span className="text-[10.5px] text-slate-400 font-normal">{qr.holder.vehicle || 'Vehículo registrado'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Sin asignar (código libre)</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyLink(cleanSku)}
                            title="Copiar enlace directo"
                            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors cursor-pointer shadow-xs"
                          >
                            {copiedSku === cleanSku ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <a
                            href={`/v/${cleanSku}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Abrir vista pública"
                            className="p-1.5 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg transition-colors cursor-pointer shadow-xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Barra de Paginación */}
          <div className="bg-slate-50/80 border-t border-slate-200 px-4 py-3 flex items-center justify-between text-xs text-slate-500">
            <div>
              Mostrando <b className="text-slate-700">{Math.min(filteredQrs.length, (currentPage - 1) * pageSize + 1)}</b> a <b className="text-slate-700">{Math.min(filteredQrs.length, currentPage * pageSize)}</b> de <b className="text-slate-700">{filteredQrs.length}</b> códigos QR
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA EN CUADRÍCULA / TARJETAS (ESTILO RESPOND.IO CHANNEL CARDS) */
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {paginatedQrs.map((qr) => {
              const isSelected = selectedSkus.has(qr.sku);
              const isPreviewing = previewSku === qr.sku;
              const cleanSku = (qr.sku || '').replace(/[#-]/g, '').toUpperCase();
              const targetUrl = `${window.location.origin}/v/${cleanSku}`;

              return (
                <div
                  key={qr.sku}
                  onClick={() => setPreviewSku(qr.sku)}
                  className={`bg-white rounded-2xl p-4 border transition-all duration-200 cursor-pointer flex flex-col justify-between relative group ${
                    isPreviewing 
                      ? 'border-blue-500 shadow-xs ring-2 ring-blue-100 bg-blue-50/20' 
                      : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelectSku(qr.sku);
                      }}
                      className="p-1 -ml-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </button>

                    <span className={`text-[9.5px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                      qr.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {qr.status === 'active' ? 'Vinculado' : 'Disponible'}
                    </span>
                  </div>

                  <div className="w-full aspect-square bg-slate-50/80 rounded-xl p-3 flex items-center justify-center border border-slate-100 relative group-hover:bg-blue-50/30 transition-colors">
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(targetUrl)}&color=0f-17-2a&bgcolor=ffffff`}
                        alt={cleanSku}
                        className="w-full h-full object-contain rounded-lg"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow-xs">
                          <span className="text-white text-[9px] font-black tracking-tight">EV</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 tracking-wider">
                        {cleanSku}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {qr.category || 'Auto'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                      {qr.holder?.name || 'Sticker sin asignar'}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink(cleanSku);
                      }}
                      className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors cursor-pointer shadow-xs"
                    >
                      {copiedSku === cleanSku ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <a
                      href={`/v/${cleanSku}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-xl transition-colors cursor-pointer shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación para Grid */}
          <div className="bg-white rounded-2xl border border-slate-200/90 px-4 py-3 flex items-center justify-between text-xs text-slate-500 shadow-xs">
            <div>
              Página <b className="text-slate-700">{currentPage}</b> de <b className="text-slate-700">{totalPages}</b> ({filteredQrs.length} códigos en total)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredQrs.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/90 flex flex-col items-center shadow-xs">
          <Layers className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No se encontraron códigos QR con estos filtros</h3>
          <p className="text-xs text-slate-400 mt-1">Intenta cambiar la búsqueda o restablecer los filtros de categoría.</p>
        </div>
      )}
    </div>
  );
}
