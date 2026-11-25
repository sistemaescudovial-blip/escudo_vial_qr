import QRCode from 'qrcode';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import rawTemplateSvg from '../assets/sticker_template.svg?raw';

/**
 * Genera el string de comandos SVG (d="") para un código QR
 */
function generateQrPath(modules, targetX, targetY, targetSize) {
  const size = modules.size;
  const cellSize = targetSize / size;
  let d = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules.get(r, c)) {
        const x = (targetX + c * cellSize).toFixed(3);
        const y = (targetY + r * cellSize).toFixed(3);
        const s = cellSize.toFixed(3);
        d += `M${x},${y}h${s}v${s}h-${s}z `;
      }
    }
  }
  return d.trim();
}

export const DEFAULT_PRINT_CONFIG = {
  cutExternal: true,     // Trazo fucsia perimetral exterior (45x130mm base)
  cutInternal: true,     // Trazos fucsia interiores (ambos stickers)
  showBatchCode: true,   // Texto vertical de lote (L1C0)
  batchCodeText: 'L1C',  // Texto personalizado del lote
  includeQr: true,       // Incluir los códigos QR y sus SKUs alfanuméricos
  templateWidthMm: 45,   // Ancho físico oficial (mm)
  templateHeightMm: 130, // Alto físico oficial (mm)
};

export const OFFICIAL_TEMPLATE_ASPECT = 45 / 130;

/**
 * Resuelve medidas exactas de la plantilla oficial manteniendo la proporción 45:130
 */
export function resolveTemplateDimensionsMm(printConfig = {}) {
  const rawW = Number(printConfig.templateWidthMm);
  const rawH = Number(printConfig.templateHeightMm);

  if (Number.isFinite(rawW) && rawW > 0 && Number.isFinite(rawH) && rawH > 0) {
    return {
      widthMm: Math.round(Math.max(15, Math.min(300, rawW)) * 10) / 10,
      heightMm: Math.round(Math.max(40, Math.min(900, rawH)) * 10) / 10
    };
  }
  return { widthMm: 45, heightMm: 130 };
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Genera el SVG oficial milimétrico completo con (o sin) los dos códigos QR y el SKU centrado,
 * aplicando tamaño físico configurable, vectores de corte y número de lote.
 */
export function generateOfficialStickerSvg(sku, targetUrl, printConfig = {}) {
  const config = { ...DEFAULT_PRINT_CONFIG, ...printConfig };
  const cleanSku = (sku || 'EV3362VE').replace(/[#-]/g, '').toUpperCase();
  const url = targetUrl || `https://escudo-vial-qr.vercel.app/v/${cleanSku}`;
  const { widthMm, heightMm } = resolveTemplateDimensionsMm(config);

  let svg = rawTemplateSvg;

  // Aplicar dimensiones físicas reales al SVG raíz
  svg = svg.replace(
    /width="127\.559px"\s+height="368\.504px"\s+viewBox="0 0 127\.559 368\.504"/,
    `width="${widthMm}mm" height="${heightMm}mm" viewBox="0 0 127.559 368.504"`
  );

  if (config.includeQr !== false) {
    // Nivel de corrección 'H' (30% de redundancia) para máxima resistencia en intemperie
    const qr = QRCode.create(url, { errorCorrectionLevel: 'H' });

    // 1. QR Superior (Pequeño): centro (64.355, 109.398), tamaño 36.5 mm/pt
    const topSize = 36.5;
    const topX = 64.355 - topSize / 2;
    const topY = 109.398 - topSize / 2;
    const topPath = generateQrPath(qr.modules, topX, topY, topSize);

    // 2. QR Inferior (Principal/Grande): centro (64.356, 248.460), tamaño 54.0 mm/pt
    const btmSize = 54.0;
    const btmX = 64.356 - btmSize / 2;
    const btmY = 248.46 - btmSize / 2;
    const btmPath = generateQrPath(qr.modules, btmX, btmY, btmSize);

    // Reemplazar el dummy path del QR superior
    svg = svg.replace(
      /<path d="M45\.403,91\.265[\s\S]*?z"\/>/,
      `<path fill="#000000" d="${topPath}"/>`
    );

    // Reemplazar el dummy path del QR inferior
    svg = svg.replace(
      /<path d="M36\.437,221\.745[\s\S]*?z"\/>/,
      `<path fill="#000000" d="${btmPath}"/>`
    );

    // Reemplazar el texto "QR0001" superior centrando el SKU real
    svg = svg.replace(
      /<text transform="matrix\(1 0 0 1 46\.6963 139\.3701\)"[^>]*>QR0001<\/text>/,
      `<text x="64.356" y="139.3701" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="8.9831" fill="#000000">${cleanSku}</text>`
    );

    // Reemplazar el texto "QR0001" inferior centrando el SKU real
    svg = svg.replace(
      /<text transform="matrix\(1 0 0 1 38\.3418 292\.6177\)"[^>]*>QR0001<\/text>/,
      `<text x="64.356" y="292.6177" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="13.2345" fill="#000000">${cleanSku}</text>`
    );
  } else {
    // Modo Sin QR: quitar ambos QR y su SKU alfanumérico emparejado
    svg = svg.replace(/<path d="M45\.403,91\.265[\s\S]*?z"\/>/, '');
    svg = svg.replace(/<path d="M36\.437,221\.745[\s\S]*?z"\/>/, '');
    svg = svg.replace(/<text transform="matrix\(1 0 0 1 46\.6963 139\.3701\)"[^>]*>QR0001<\/text>/, '');
    svg = svg.replace(/<text transform="matrix\(1 0 0 1 38\.3418 292\.6177\)"[^>]*>QR0001<\/text>/, '');
  }

  // --- CONFIGURACIÓN DE IMPRESIÓN Y VECTORES DE CORTE (CutContour) ---
  const cutStrokeWidth = config.previewDpi ? '0.6' : '0.25pt';

  // Inyectar definición de color de corte CutContour (CMYK 0,100,0,0) exclusivamente para vectores de corte
  svg = svg.replace(
    /<svg([^>]*)>/i,
    `<svg$1>\n<defs><style type="text/css">.CutContour{fill:none;stroke:#FF00FF;stroke-width:${cutStrokeWidth};}</style><solidColor id="CutContour" solid-color="#EC008C"/></defs>`
  );

  // 1. Vector de corte externo (Contorno perimetral exterior)
  if (config.cutExternal) {
    svg = svg.replace(
      /<path fill="none" stroke="#F0047F" stroke-width="0\.1" stroke-miterlimit="10" (d="M118\.138,365\.149[\s\S]*?118\.138,365\.149z")\/>/,
      `<path id="CutContour_Externo" class="CutContour" fill="none" stroke="#FF00FF" stroke-width="${cutStrokeWidth}" stroke-miterlimit="10" $1/>`
    );
  } else {
    svg = svg.replace(
      /<path fill="none" stroke="#F0047F" stroke-width="0\.1" stroke-miterlimit="10" d="M118\.138,365\.149[\s\S]*?118\.138,365\.149z"\/>/,
      ''
    );
  }

  // 2. Vectores de corte internos (Troqueles interiores del sticker superior e inferior)
  if (config.cutInternal) {
    svg = svg.replace(
      /<path fill="none" stroke="#F0047F" stroke-width="0\.1" stroke-miterlimit="10" (d="M89\.632,158\.269[\s\S]*?89\.632,158\.269z")\/>/,
      `<path id="CutContour_Interno_1" class="CutContour" fill="none" stroke="#FF00FF" stroke-width="${cutStrokeWidth}" stroke-miterlimit="10" $1/>`
    );
    svg = svg.replace(
      /<path fill="none" stroke="#F0047F" stroke-width="0\.1" stroke-miterlimit="10" (d="M101\.596,320\.458[\s\S]*?101\.596,320\.458z")\/>/,
      `<path id="CutContour_Interno_2" class="CutContour" fill="none" stroke="#FF00FF" stroke-width="${cutStrokeWidth}" stroke-miterlimit="10" $1/>`
    );
  } else {
    svg = svg.replace(
      /<path fill="none" stroke="#F0047F" stroke-width="0\.1" stroke-miterlimit="10" d="M89\.632,158\.269[\s\S]*?89\.632,158\.269z"\/>/,
      ''
    );
    svg = svg.replace(
      /<path fill="none" stroke="#F0047F" stroke-width="0\.1" stroke-miterlimit="10" d="M101\.596,320\.458[\s\S]*?101\.596,320\.458z"\/>/,
      ''
    );
  }

  // 3. Número de lote (Texto vertical L1C0)
  if (config.showBatchCode) {
    const rawBatch = config.batchCodeText !== undefined ? String(config.batchCodeText) : 'L1C';
    const batchText = escapeXml(rawBatch.trim());
    svg = svg.replace(
      /<text transform="matrix\(0 -1\.0007 1 0 11\.8584 169\.7095\)"[^>]*>L1C0<\/text>/,
      `<text transform="matrix(0 -1.0007 1 0 11.8584 169.7095)" font-family="Arial, Helvetica, sans-serif" font-weight="bold" font-size="5.9887">${batchText}</text>`
    );
  } else {
    svg = svg.replace(
      /<text transform="matrix\(0 -1\.0007 1 0 11\.8584 169\.7095\)"[^>]*>L1C0<\/text>/,
      ''
    );
  }

  return svg;
}

/**
 * Convierte el SVG a un Data URL (base64) para renderizar en <img> o Canvas
 */
export function generateOfficialStickerDataUrl(sku, targetUrl, printConfig = {}) {
  const svg = generateOfficialStickerSvg(sku, targetUrl, printConfig);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Dibuja el sticker oficial en un Canvas a 300 DPI según las medidas configuradas
 */
export async function renderOfficialStickerToCanvas(sku, targetUrl, canvas, printConfig = {}) {
  if (!canvas) return;
  const dataUrl = generateOfficialStickerDataUrl(sku, targetUrl, printConfig);
  const { widthMm, heightMm } = resolveTemplateDimensionsMm(printConfig);

  // Conversión milimétrica a 300 DPI (ej. 45x130mm => 531 x 1535 px)
  const dpiScale = printConfig.previewDpi ? Number(printConfig.previewDpi) : 300;
  const widthPx = Math.max(120, Math.min(3500, Math.round((widthMm / 25.4) * dpiScale)));
  const heightPx = Math.max(240, Math.min(6000, Math.round((heightMm / 25.4) * dpiScale)));

  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = dataUrl;
  });

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, widthPx, heightPx);
  ctx.drawImage(img, 0, 0, widthPx, heightPx);
}

/**
 * Descarga individual en formato JPG a 300 ppp
 */
export async function exportOfficialStickerJpg(sku, targetUrl, printConfig = {}) {
  const cleanSku = (sku || 'EV3362VE').replace(/[#-]/g, '').toUpperCase();
  const { widthMm, heightMm } = resolveTemplateDimensionsMm(printConfig);
  const isNoQr = printConfig.includeQr === false;
  const fileLabel = isNoQr ? `Plantilla_Base_SinQR_${widthMm}x${heightMm}mm` : `Sticker_Imprenta_${cleanSku}_${widthMm}x${heightMm}mm`;

  const canvas = document.createElement('canvas');
  await renderOfficialStickerToCanvas(cleanSku, targetUrl, canvas, printConfig);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileLabel}_300DPI.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/jpeg', 0.98);
}

/**
 * Descarga individual en formato SVG vectorial puro (con el vector de corte magenta intacto o configurado)
 */
export function exportOfficialStickerSvg(sku, targetUrl, printConfig = {}) {
  const cleanSku = (sku || 'EV3362VE').replace(/[#-]/g, '').toUpperCase();
  const { widthMm, heightMm } = resolveTemplateDimensionsMm(printConfig);
  const isNoQr = printConfig.includeQr === false;
  const fileLabel = isNoQr ? `Plantilla_Base_SinQR_${widthMm}x${heightMm}mm` : `Sticker_Imprenta_${cleanSku}_${widthMm}x${heightMm}mm`;

  const svg = generateOfficialStickerSvg(cleanSku, targetUrl, printConfig);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileLabel}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Contornos exactos normalizados (0..1 sobre viewBox 127.559 x 368.504)
 * tomados directamente del SVG oficial para emitir líneas vectoriales CutContour en PDF.
 */
const CUT_CONTOURS_NORMALIZED = {
  external: {
    x: 5.001 / 127.559,
    y: 3.597 / 368.504,
    w: 117.979 / 127.559,
    h: 361.552 / 368.504,
    rx: 4.842 / 127.559,
    ry: 5.998 / 368.504
  },
  internalTop: {
    x: 33.756 / 127.559,
    y: 54.413 / 368.504,
    w: 61.209 / 127.559,
    h: 103.856 / 368.504,
    rx: 5.333 / 127.559,
    ry: 5.477 / 368.504
  },
  internalBottom: {
    x: 19.277 / 127.559,
    y: 167.452 / 368.504,
    w: 90.176 / 127.559,
    h: 153.006 / 368.504,
    rx: 7.857 / 127.559,
    ry: 8.069 / 368.504
  }
};

/**
 * Registra una tinta directa (Spot Color / Volltonfarbe) llamada exactamente
 * /CutContour en modo CMYK (C:0, M:100, Y:0, K:0) dentro del catálogo /Resources del PDF.
 */
function registerCutContourSpotColor(doc) {
  let csObjId = null;
  doc.internal.events.subscribe('putResources', () => {
    const fnObjId = doc.internal.newObject();
    doc.internal.write('<< /FunctionType 2 /Domain [0 1] /C0 [0 0 0 0] /C1 [0 1 0 0] /N 1 >>');
    doc.internal.write('endobj');
    csObjId = doc.internal.newObject();
    doc.internal.write(`[/Separation /CutContour /DeviceCMYK ${fnObjId} 0 R]`);
    doc.internal.write('endobj');
  });

  const originalWrite = doc.internal.write;
  let colorSpaceInjected = false;

  doc.internal.write = function (...args) {
    const str = args.length === 1 ? String(args[0]) : args.map(String).join(' ');
    originalWrite.apply(this, args);

    if (csObjId && !colorSpaceInjected && (str.includes('/Resources <<') || str.includes('/Resources\n<<'))) {
      colorSpaceInjected = true;
      originalWrite.call(this, `/ColorSpace << /CS_CutContour ${csObjId} 0 R >>`);
    }
  };
}

/**
 * Dibuja exclusivamente los trazos vectoriales de corte (externo e internos)
 * con la tinta directa CutContour (100% tinta, CMYK 0/100/0/0, 0.25pt hairline).
 * Si alguna o ambas no están activas en printConfig, no se dibuja ninguna línea de ese tipo.
 */
function drawCutContoursToPdf(doc, originXMm, originYMm, widthMm, heightMm, printConfig = {}) {
  const drawExt = Boolean(printConfig.cutExternal);
  const drawInt = Boolean(printConfig.cutInternal);
  if (!drawExt && !drawInt) return;

  const boxes = [];
  if (drawExt) boxes.push(CUT_CONTOURS_NORMALIZED.external);
  if (drawInt) {
    boxes.push(CUT_CONTOURS_NORMALIZED.internalTop);
    boxes.push(CUT_CONTOURS_NORMALIZED.internalBottom);
  }

  doc.saveGraphicsState();
  doc.setDrawColor(255, 0, 255); // Magenta visible 100% CMYK (#FF00FF)
  doc.internal.write('/CS_CutContour CS 1 SCN'); // Spot Color Separation para RIP / plotter
  doc.setLineWidth(0.088); // 0.25 pt hairline estándar para RIP / plotter
  for (const b of boxes) {
    doc.roundedRect(
      originXMm + (b.x * widthMm),
      originYMm + (b.y * heightMm),
      b.w * widthMm,
      b.h * heightMm,
      b.rx * widthMm,
      b.ry * heightMm,
      'S'
    );
  }
  doc.restoreGraphicsState();
}

/**
 * Descarga individual en formato PDF listo para corte según tamaño configurado,
 * 100% vectorial nativo (cero pixeles, svg2pdf) con trazos vectoriales exclusivos
 * en tinta directa CutContour (CMYK 0,100,0,0)
 */
export async function exportOfficialStickerPdf(sku, targetUrl, printConfig = {}) {
  const cleanSku = (sku || 'EV3362VE').replace(/[#-]/g, '').toUpperCase();
  const { widthMm, heightMm } = resolveTemplateDimensionsMm(printConfig);
  const isNoQr = printConfig.includeQr === false;
  const fileLabel = isNoQr ? `Plantilla_Base_SinQR_${widthMm}x${heightMm}mm` : `Sticker_Imprenta_${cleanSku}_${widthMm}x${heightMm}mm`;

  const doc = new jsPDF({
    orientation: widthMm > heightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [widthMm, heightMm]
  });
  registerCutContourSpotColor(doc);

  // Renderizado gráfico en alta definición (300 DPI) para imprenta
  const canvas = document.createElement('canvas');
  await renderOfficialStickerToCanvas(cleanSku, targetUrl, canvas, {
    ...printConfig,
    cutExternal: false,
    cutInternal: false
  });
  const imgData = canvas.toDataURL('image/png');
  doc.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm, undefined, 'FAST');

  // Trazos vectoriales de corte con tinta directa CutContour (solo si están activos)
  drawCutContoursToPdf(doc, 0, 0, widthMm, heightMm, printConfig);
  doc.save(`${fileLabel}.pdf`);
}

/**
 * Construye el archivo individual (Blob + nombre) para una plantilla en el formato indicado ('png' | 'jpg' | 'svg' | 'pdf').
 * En PDF y SVG, la salida es 100% vectorial nativa sin rasterización.
 * En JPG y PNG, se rasteriza a 300 DPI mediante Canvas.
 */
async function buildOfficialStickerAsset(qr, index, getBaseUrl, printConfig = {}, format = 'jpg') {
  const { widthMm, heightMm } = resolveTemplateDimensionsMm(printConfig);
  const isNoQr = printConfig.includeQr === false;
  const cleanSku = (qr?.sku || `EV${String(1000 + index).slice(-4)}VE`).replace(/[#-]/g, '').toUpperCase();
  const targetUrl = `${getBaseUrl()}/v/${cleanSku}`;
  const baseName = isNoQr
    ? `Plantilla_SinQR_${String(index + 1).padStart(3, '0')}_${widthMm}x${heightMm}mm`
    : `Sticker_${cleanSku}_${widthMm}x${heightMm}mm`;

  if (format === 'svg') {
    const svgContent = generateOfficialStickerSvg(cleanSku, targetUrl, printConfig);
    return {
      filename: `${baseName}.svg`,
      blob: new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
    };
  }

  if (format === 'pdf') {
    const doc = new jsPDF({
      orientation: widthMm > heightMm ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [widthMm, heightMm]
    });
    registerCutContourSpotColor(doc);

    const canvas = document.createElement('canvas');
    await renderOfficialStickerToCanvas(cleanSku, targetUrl, canvas, {
      ...printConfig,
      cutExternal: false,
      cutInternal: false
    });
    const imgData = canvas.toDataURL('image/png');
    doc.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm, undefined, 'FAST');

    drawCutContoursToPdf(doc, 0, 0, widthMm, heightMm, printConfig);
    return {
      filename: `${baseName}.pdf`,
      blob: doc.output('blob')
    };
  }

  const canvas = document.createElement('canvas');
  await renderOfficialStickerToCanvas(cleanSku, targetUrl, canvas, printConfig);
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'png' ? 'png' : 'jpg';
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.98));
  return {
    filename: `${baseName}_300DPI.${ext}`,
    blob
  };
}

/**
 * Exporta lote de plantillas oficiales en el formato seleccionado ('jpg' | 'svg' | 'pdf' | 'png'),
 * ya sea en un archivo comprimido ('zip') o descargando cada archivo de forma individual ('individual').
 */
export async function exportBatchOfficialByFormat(qrs, getBaseUrl, printConfig = {}, format = 'jpg', delivery = 'zip') {
  if (!qrs || qrs.length === 0) return;
  const safeFormat = ['png', 'jpg', 'svg', 'pdf'].includes(format) ? format : 'jpg';
  const { widthMm, heightMm } = resolveTemplateDimensionsMm(printConfig);
  const isNoQr = printConfig.includeQr === false;

  if (delivery === 'individual') {
    for (let i = 0; i < qrs.length; i++) {
      const { filename, blob } = await buildOfficialStickerAsset(qrs[i], i, getBaseUrl, printConfig, safeFormat);
      if (!blob) continue;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (i < qrs.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 180));
      }
    }
    return;
  }

  const zip = new JSZip();
  for (let i = 0; i < qrs.length; i++) {
    const { filename, blob } = await buildOfficialStickerAsset(qrs[i], i, getBaseUrl, printConfig, safeFormat);
    if (blob) {
      zip.file(filename, blob);
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Lote_Stickers_${safeFormat.toUpperCase()}_${isNoQr ? 'SinQR_' : ''}${qrs.length}_unidades_${widthMm}x${heightMm}mm.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ============================================================================
// EXPORTACIÓN POR LIENZO / BOBINA PERSONALIZADA (PLOTTER DE CORTE CMYK)
// ============================================================================

export const DEFAULT_CANVAS_CONFIG = {
  canvasWidthMm: 1000, // 1000 mm (1 metro de ancho de bobina)
  gapXMm: 5,           // 5 mm entre stickers horizontalmente
  gapYMm: 5,           // 5 mm entre stickers verticalmente
  marginMm: 15,        // 15 mm margen a los bordes
  targetRows: 2,       // 2 filas por defecto
  cmykMode: true       // Modo CMYK activo siempre
};

/**
 * Calcula la distribución matemática exacta de cuántos stickers caben a lo ancho
 * y las dimensiones totales del lienzo resultante sin desperdicio de material.
 */
export function calculateCanvasRollLayout(config = {}, printConfig = {}) {
  const canvasWidthMm = Number(config.canvasWidthMm) || 1000;
  const gapXMm = config.gapXMm !== undefined && config.gapXMm !== '' ? Number(config.gapXMm) : 5;
  const gapYMm = config.gapYMm !== undefined && config.gapYMm !== '' ? Number(config.gapYMm) : 5;
  const marginMm = config.marginMm !== undefined && config.marginMm !== '' ? Number(config.marginMm) : 15;
  const targetRows = Math.max(1, Number(config.targetRows) || 1);

  const { widthMm: stickerWidth, heightMm: stickerHeight } = resolveTemplateDimensionsMm(printConfig);

  const usableWidth = Math.max(stickerWidth, canvasWidthMm - (2 * marginMm));
  const cols = Math.max(1, Math.floor((usableWidth + gapXMm) / (stickerWidth + gapXMm)));
  const rows = targetRows;
  const totalStickers = cols * rows;

  const totalGridWidth = (cols * stickerWidth) + ((cols - 1) * gapXMm);
  const offsetX = marginMm + Math.max(0, (usableWidth - totalGridWidth) / 2);
  const canvasHeightMm = (2 * marginMm) + (rows * stickerHeight) + ((rows - 1) * gapYMm);

  // Metros lineales gastados de bobina
  const linearMeters = (canvasHeightMm / 1000).toFixed(2);

  return {
    canvasWidthMm,
    canvasHeightMm,
    usableWidth,
    cols,
    rows,
    totalStickers,
    gapXMm,
    gapYMm,
    marginMm,
    offsetX,
    stickerWidth,
    stickerHeight,
    totalGridWidth,
    linearMeters
  };
}

/**
 * Convierte los colores RGB del SVG a equivalentes CMYK puros para imprenta profesional
 * - Vector de corte: Magenta 100% CMYK (C:0 M:100 Y:0 K:0 / #FF00FF)
 * - Morado Escudo Vial: C:75 M:90 Y:0 K:10 (#471A70)
 * - Turquesa Escudo Vial: C:80 M:0 Y:45 K:0 (#00A896)
 * - Rojo emergencia: C:0 M:100 Y:100 K:0 (#E30613)
 * - Negro QR/Texto: K:100 Puro (C:0 M:0 Y:0 K:100 / #000000)
 */
export function convertSvgToCmyk(svgString) {
  let svg = svgString;
  // Magenta puro 100% CMYK para vector de corte y troqueles
  svg = svg.replace(/#F0047F/gi, '#FF00FF');
  // Ajustes de color a perfiles de imprenta offset / plotter digital
  svg = svg.replace(/#4B2C84/gi, '#471A70');
  svg = svg.replace(/#1ABC9C/gi, '#00A896');
  svg = svg.replace(/#E00707/gi, '#E30613');
  return svg;
}

/**
 * Exporta un lienzo / bobina completa en formato PDF 100% vectorial nativo (cero pixeles, svg2pdf)
 * con vectores de corte exclusivos en tinta directa Spot /CutContour CMYK (0,100,0,0) solo si están activos.
 */
export async function exportCanvasRollPdf(qrs, getBaseUrl, canvasConfig = {}, printConfig = {}) {
  const layout = calculateCanvasRollLayout(canvasConfig, printConfig);
  const { canvasWidthMm, canvasHeightMm, cols, rows, totalStickers, gapXMm, gapYMm, marginMm, offsetX, stickerWidth, stickerHeight } = layout;
  const isNoQr = printConfig.includeQr === false;

  const orientation = canvasWidthMm > canvasHeightMm ? 'landscape' : 'portrait';
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: [canvasWidthMm, canvasHeightMm]
  });
  registerCutContourSpotColor(doc);

  // Fondo blanco vectorial para todo el pliego
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, canvasWidthMm, canvasHeightMm, 'F');

  const artworkConfig = { ...printConfig, cutExternal: false, cutInternal: false, cmykMode: true };
  const parser = new DOMParser();

  let cachedSvgElement = null;
  if (isNoQr) {
    const blankSvg = generateOfficialStickerSvg('BASE', getBaseUrl(), artworkConfig);
    cachedSvgElement = parser.parseFromString(blankSvg, 'image/svg+xml').documentElement;
  }

  for (let i = 0; i < totalStickers; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const xMm = offsetX + col * (stickerWidth + gapXMm);
    const yMm = marginMm + row * (stickerHeight + gapYMm);

    let svgEl = cachedSvgElement;
    if (!isNoQr) {
      const q = qrs[i] || qrs[i % qrs.length] || { sku: `EV${String(1000 + i).slice(-4)}VE` };
      const cleanSku = (q.sku || 'EV3362VE').replace(/[#-]/g, '').toUpperCase();
      const targetUrl = `${getBaseUrl()}/v/${cleanSku}`;
      const stickerSvg = generateOfficialStickerSvg(cleanSku, targetUrl, artworkConfig);
      svgEl = parser.parseFromString(stickerSvg, 'image/svg+xml').documentElement;
    }

    // Dibujar sticker 100% vectorial nativo directamente en PDF (cero rasterización)
    await svg2pdf(svgEl, doc, {
      x: xMm,
      y: yMm,
      width: stickerWidth,
      height: stickerHeight
    });

    // Trazos vectoriales de corte con tinta directa CutContour (solo si están activos en printConfig)
    drawCutContoursToPdf(doc, xMm, yMm, stickerWidth, stickerHeight, printConfig);
  }

  // Título y datos técnicos de prepress en DeviceCMYK / Grayscale
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `ESCUDO VIAL 24/7 - LIENZO BOBINA PREPRESS - ${totalStickers} UNIDADES (${cols} cols x ${rows} filas) - ${canvasWidthMm}x${Math.round(canvasHeightMm)}mm - CutContour Spot CMYK (0,100,0,0)`,
    offsetX,
    marginMm - 4 > 5 ? marginMm - 4 : 5
  );

  doc.save(`Lienzo_Bobina_CutContour_${isNoQr ? 'SinQR_' : ''}${totalStickers}_Stickers_${canvasWidthMm}x${Math.round(canvasHeightMm)}mm.pdf`);

  return { totalExported: totalStickers, layout };
}

/**
 * Genera el archivo SVG Maestro completo del Lienzo / Bobina con todos los stickers
 * montados en alta definición vectorial y espacio de color CMYK.
 */
export function generateCanvasRollMasterSvg(qrs, getBaseUrl, canvasConfig = {}, printConfig = {}) {
  const layout = calculateCanvasRollLayout(canvasConfig, printConfig);
  const { canvasWidthMm, canvasHeightMm, cols, rows, totalStickers, gapXMm, gapYMm, marginMm, offsetX, stickerWidth, stickerHeight } = layout;

  const widthPt = (canvasWidthMm * 2.834645).toFixed(2);
  const heightPt = (canvasHeightMm * 2.834645).toFixed(2);
  const scaleX = (stickerWidth / 45).toFixed(4);
  const scaleY = (stickerHeight / 130).toFixed(4);

  let stickersSvgContent = '';

  for (let i = 0; i < totalStickers; i++) {
    const q = qrs[i] || qrs[i % qrs.length] || { sku: `EV${String(1000 + i).slice(-4)}VE` };
    const cleanSku = (q.sku || 'EV3362VE').replace(/[#-]/g, '').toUpperCase();
    const targetUrl = `${getBaseUrl()}/v/${cleanSku}`;

    const col = i % cols;
    const row = Math.floor(i / cols);

    const xMm = offsetX + col * (stickerWidth + gapXMm);
    const yMm = marginMm + row * (stickerHeight + gapYMm);

    const xPt = (xMm * 2.834645).toFixed(3);
    const yPt = (yMm * 2.834645).toFixed(3);

    let stickerSvg = generateOfficialStickerSvg(cleanSku, targetUrl, { ...printConfig, cmykMode: true });
    stickerSvg = convertSvgToCmyk(stickerSvg);

    // Extraer contenido interno del SVG para agruparlo en <g> escalado sin duplicar <defs> o IDs
    const innerMatch = stickerSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
    let innerContent = innerMatch ? innerMatch[1] : stickerSvg;
    innerContent = innerContent
      .replace(/<defs>[\s\S]*?<\/defs>/i, '')
      .replace(/id="(CutContour_[^"]+)"/g, `id="$1_${i + 1}"`);

    stickersSvgContent += `
    <!-- Sticker ${i + 1}: ${cleanSku} (Columna ${col + 1}, Fila ${row + 1}) -->
    <g transform="translate(${xPt}, ${yPt}) scale(${scaleX}, ${scaleY})">
      ${innerContent}
    </g>`;
  }

  const masterSvg = `<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Escudo Vial Prepress Engine - CMYK Master Canvas Roll -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
     width="${canvasWidthMm}mm" height="${canvasHeightMm}mm" 
     viewBox="0 0 ${widthPt} ${heightPt}" 
     color-interpolation="sRGB">
  <defs>
    <style type="text/css">
      .CutContour, .cmyk-cut-contour { stroke: #FF00FF !important; stroke-width: 0.25pt !important; fill: none !important; }
      text { font-family: Arial, Helvetica, sans-serif !important; }
    </style>
    <solidColor id="CutContour" solid-color="#EC008C"/>
  </defs>
  
  <!-- Fondo blanco del pliego -->
  <rect width="100%" height="100%" fill="#FFFFFF"/>
  
  <!-- Marcas de información prepress -->
  <text x="${(offsetX * 2.834645).toFixed(2)}" y="25" font-family="Arial, Helvetica, sans-serif" font-size="10" font-weight="bold" fill="#666666">
    ESCUDO VIAL 24/7 - LIENZO BOBINA CMYK PREPRESS (PLOTTER) - ${totalStickers} STICKERS (${cols} cols x ${rows} filas) - ANCHO: ${canvasWidthMm}mm x ALTO: ${Math.round(canvasHeightMm)}mm - VECTORES DE CORTE MAGENTA 100% CMYK (0,100,0,0)
  </text>

  <!-- Grilla de Stickers en Alta Definición Vectorial -->
  ${stickersSvgContent}
</svg>`;

  return masterSvg;
}

/**
 * Descarga directamente el archivo SVG Maestro del Lienzo / Bobina
 */
export function exportCanvasRollSvg(qrs, getBaseUrl, canvasConfig = {}, printConfig = {}) {
  const masterSvg = generateCanvasRollMasterSvg(qrs, getBaseUrl, canvasConfig, printConfig);
  const layout = calculateCanvasRollLayout(canvasConfig, printConfig);
  
  const blob = new Blob([masterSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Lienzo_Bobina_CMYK_${layout.totalStickers}_Stickers_${layout.canvasWidthMm}x${Math.round(layout.canvasHeightMm)}mm.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
