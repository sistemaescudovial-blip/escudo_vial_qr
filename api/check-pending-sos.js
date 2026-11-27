const TELEGRAM_BOT_TOKEN = '9140137525:AAGfciv2x4qNOEs8XwTXXil0y3syIC9UMyM';
const TELEGRAM_CHAT_ID = '-5350347338';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://whsawcpdxkjvxteekics.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_NMBhODhYGcSbSAYaerN-CA_LpEmck89';

const MIN_AGE_MS = 45 * 1000;      // Esperar al menos 45s tras la alerta inicial
const REMINDER_INTERVAL_MS = 50 * 1000; // Mínimo 50s entre recordatorios
const MAX_AGE_MS = 30 * 60 * 1000; // Tope de seguridad: 30 minutos

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  try {
    const queryUrl = `${SUPABASE_URL}/rest/v1/emergencies?status=eq.critico&select=*`;
    const dbRes = await fetch(queryUrl, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!dbRes.ok) {
      const errText = await dbRes.text();
      return res.status(500).json({ ok: false, error: 'Supabase query failed', details: errText });
    }

    const emergencies = await dbRes.json();
    const now = Date.now();
    let reminded = 0;

    for (const emg of emergencies) {
      const loc = emg.location && typeof emg.location === 'object' ? emg.location : {};
      if (loc.telegramSilenced === true) continue;

      const createdAtMs = emg.created_at ? new Date(emg.created_at).getTime() : now;
      const ageMs = now - createdAtMs;

      if (ageMs < MIN_AGE_MS || ageMs > MAX_AGE_MS) continue;

      const lastRemindedAt = Number(loc.lastTelegramReminderAt || 0);
      if (lastRemindedAt && (now - lastRemindedAt) < REMINDER_INTERVAL_MS) continue;

      const minutesAgo = Math.max(1, Math.round(ageMs / 60000));
      const nextCount = Number(loc.reminderCount || 0) + 1;

      const lat = loc.lat || 10.4880;
      const lng = loc.lng || -66.8792;
      const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      const adminUrl = 'https://escudo-vial-qr.vercel.app/admin';

      const lines = [
        `🔔 <b>RECORDATORIO #${nextCount} — S.O.S SIN ATENDER</b>`,
        `⏱️ <i>Lleva ${minutesAgo} min esperando atención</i>`,
        '',
        `🆔 <b>Folio:</b> <code>${escapeHtml(emg.folio)}</code>`,
        `🏷️ <b>Sticker:</b> <code>${escapeHtml(emg.sku)}</code>`,
        `👤 <b>Titular:</b> ${escapeHtml(emg.holder_name)} (${escapeHtml(emg.cedula)})`,
        `🚗 <b>Vehículo:</b> ${escapeHtml(emg.vehicle)}`,
        `📞 <b>Teléfono:</b> ${escapeHtml(emg.phone)}`,
        `📍 <b>Ubicación:</b> ${escapeHtml(loc.address || 'Ubicación GPS en vivo')}`
      ];

      const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: lines.join('\n'),
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📍 Ver en Google Maps', url: mapsUrl },
                { text: '🖥️ Abrir Central', url: adminUrl }
              ],
              [
                { text: '✅ Atender / Silenciar', callback_data: `ack:${emg.id}` }
              ]
            ]
          }
        })
      });

      if (tgRes.ok) {
        reminded++;
        const updatedLocation = {
          ...loc,
          lastTelegramReminderAt: now,
          reminderCount: nextCount
        };
        await fetch(`${SUPABASE_URL}/rest/v1/emergencies?id=eq.${encodeURIComponent(emg.id)}`, {
          method: 'PATCH',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal'
          },
          body: JSON.stringify({ location: updatedLocation })
        });
      }
    }

    return res.status(200).json({
      ok: true,
      checked: emergencies.length,
      reminded,
      timestamp: new Date(now).toISOString()
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
