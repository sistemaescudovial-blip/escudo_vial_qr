const TELEGRAM_BOT_TOKEN = '9140137525:AAGfciv2x4qNOEs8XwTXXil0y3syIC9UMyM';
const TELEGRAM_CHAT_ID = '-5350347338';

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Envía una alerta inmediata al grupo privado de Telegram de la Central
 * sin bloquear el flujo principal del botón S.O.S.
 */
export async function sendTelegramSosAlert(emergency, isReiterated = false) {
  if (!emergency) return;

  try {
    const lat = emergency.location?.lat || 10.4880;
    const lng = emergency.location?.lng || -66.8792;
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
    const adminUrl = `${typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://escudo-vial-qr.vercel.app'}/admin`;

    const title = isReiterated
      ? '🚨 <b>¡ALERTA S.O.S REITERADA (URGENTE)!</b>'
      : '🚨 <b>¡NUEVA ALERTA S.O.S ACTIVA!</b>';

    const reporterLabel = emergency.reporterType === 'titular'
      ? 'Conductor Titular'
      : 'Testigo / Tercero en vía';

    const lines = [
      title,
      '',
      `🆔 <b>Folio:</b> <code>${escapeHtml(emergency.folio)}</code>`,
      `🏷️ <b>Sticker:</b> <code>${escapeHtml(emergency.sku)}</code>`,
      `👤 <b>Titular:</b> ${escapeHtml(emergency.holderName)} (${escapeHtml(emergency.cedula)})`,
      `📢 <b>Reporta:</b> ${escapeHtml(reporterLabel)}`,
      `🚗 <b>Vehículo:</b> ${escapeHtml(emergency.vehicle)}`,
      `📞 <b>Teléfono:</b> ${escapeHtml(emergency.phone)}`,
      `📍 <b>Ubicación:</b> ${escapeHtml(emergency.location?.address || 'Ubicación GPS en vivo')}`,
      `🕒 <b>Hora:</b> ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
    ];

    const payload = {
      chat_id: TELEGRAM_CHAT_ID,
      text: lines.join('\n'),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📍 Ver en Google Maps', url: mapsUrl },
            { text: '🖥️ Abrir Central', url: adminUrl }
          ]
        ]
      }
    };

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('Error enviando notificación a Telegram:', err);
  }
}
