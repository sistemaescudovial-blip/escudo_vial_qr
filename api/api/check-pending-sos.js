const TELEGRAM_BOT_TOKEN = '9140137525:AAGfciv2x4qNOEs8XwTXXil0y3syIC9UMyM';
const TELEGRAM_CHAT_ID = '-5350347338';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://whsawcpdxkjvxteekics.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_NMBhODhYGcSbSAYaerN-CA_LpEmck89';

const MIN_AGE_MS = 45 * 1000;         // Esperar al menos 45s tras la alerta inicial
const REMINDER_INTERVAL_MS = 50 * 1000; // Mínimo 50s entre recordatorios
const MAX_AGE_MS = 30 * 60 * 1000;    // Tope de seguridad: 30 minutos

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(req, res) {
  try {
    const queryUrl = `${SUPABASE_URL}/rest/v1/emergencies?status=eq.critico&select=*&order=created_at.desc`;
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

    // Filtrar emergencias críticas que aún no han sido silenciadas y están dentro del rango válido
    const pending = emergencies.filter((emg) => {
      const loc = emg.location && typeof emg.location === 'object' ? emg.location : {};
      if (loc.telegramSilenced === true) return false;
      const createdAtMs = emg.created_at ? new Date(emg.created_at).getTime() : now;
      const ageMs = now - createdAtMs;
      return ageMs >= MIN_AGE_MS && ageMs <= MAX_AGE_MS;
    });

    if (pending.length === 0) {
      return res.status(200).json({
        ok: true,
        checked: emergencies.length,
        pending: 0,
        reminded: 0,
        timestamp: new Date(now).toISOString()
      });
    }

    // Evitar doble disparo si cron o una prueba manual lo llamó hace menos de 50 segundos
    const recentlyReminded = pending.some((emg) => {
      const last = Number(emg.location?.lastTelegramReminderAt || 0);
      return last && (now - last) < REMINDER_INTERVAL_MS;
    });

    if (recentlyReminded) {
      return res.status(200).json({
        ok: true,
        checked: emergencies.length,
        pending: pending.length,
        reminded: 0,
        skipped: 'already_reminded_recently',
        timestamp: new Date(now).toISOString()
      });
    }

    // Borrar el recordatorio resumen anterior para mantener el chat limpio
    const prevMsgId = emergencies
      .map((e) => e.location?.lastSummaryMessageId)
      .find((id) => Boolean(id));

    if (prevMsgId) {
      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            message_id: prevMsgId
          })
        });
      } catch {
        // Ignorar si ya fue borrado manualmente o expiró
      }
    }

    const adminUrl = 'https://escudo-vial-qr.vercel.app/admin';
    let messageText = '';
    const inlineKeyboard = [];

    if (pending.length === 1) {
      const emg = pending[0];
      const loc = emg.location && typeof emg.location === 'object' ? emg.location : {};
      const createdAtMs = emg.created_at ? new Date(emg.created_at).getTime() : now;
      const minutesAgo = Math.max(1, Math.round((now - createdAtMs) / 60000));
      const nextCount = Number(loc.reminderCount || 0) + 1;
      const lat = loc.lat || 10.4880;
      const lng = loc.lng || -66.8792;
      const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

      messageText = [
        `🔔 <b>RECORDATORIO #${nextCount} — S.O.S SIN ATENDER</b>`,
        `⏱️ <i>Lleva ${minutesAgo} min esperando atención</i>`,
        '',
        `🆔 <b>Folio:</b> <code>${escapeHtml(emg.folio)}</code>`,
        `🏷️ <b>Sticker:</b> <code>${escapeHtml(emg.sku)}</code>`,
        `👤 <b>Titular:</b> ${escapeHtml(emg.holder_name)} (${escapeHtml(emg.cedula)})`,
        `🚗 <b>Vehículo:</b> ${escapeHtml(emg.vehicle)}`,
        `📞 <b>Teléfono:</b> ${escapeHtml(emg.phone)}`,
        `📍 <b>Ubicación:</b> ${escapeHtml(loc.address || 'Ubicación GPS en vivo')}`
      ].join('\n');

      inlineKeyboard.push([
        { text: '📍 Ver en Google Maps', url: mapsUrl },
        { text: '🖥️ Abrir Central', url: adminUrl }
      ]);
      inlineKeyboard.push([
        { text: '✅ Atender / Silenciar', callback_data: `ack:${emg.id}` }
      ]);
    } else {
      const lines = [
        `🔔 <b>RECORDATORIO — ${pending.length} ALERTAS S.O.S SIN ATENDER</b>`,
        ''
      ];

      pending.slice(0, 10).forEach((emg, idx) => {
        const loc = emg.location && typeof emg.location === 'object' ? emg.location : {};
        const createdAtMs = emg.created_at ? new Date(emg.created_at).getTime() : now;
        const minutesAgo = Math.max(1, Math.round((now - createdAtMs) / 60000));
        const lat = loc.lat || 10.4880;
        const lng = loc.lng || -66.8792;
        const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        lines.push(
          `${idx + 1}. <code>${escapeHtml(emg.folio)}</code> • <b>${escapeHtml(emg.holder_name)}</b> (<code>${escapeHtml(emg.sku)}</code>) — <i>hace ${minutesAgo} min</i> [<a href="${mapsUrl}">Mapa</a>]`
        );
      });

      if (pending.length > 10) {
        lines.push(`\n...y ${pending.length - 10} alertas más en el Panel Central.`);
      }

      messageText = lines.join('\n');

      inlineKeyboard.push([
        { text: '🖥️ Abrir Panel de la Central', url: adminUrl }
      ]);
      inlineKeyboard.push([
        { text: '✅ Atender / Silenciar Todas', callback_data: 'ack_all' }
      ]);
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: messageText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: inlineKeyboard }
      })
    });

    if (!tgRes.ok) {
      const errTg = await tgRes.text();
      return res.status(500).json({ ok: false, error: 'Telegram sendMessage failed', details: errTg });
    }

    const tgData = await tgRes.json();
    const sentMsgId = tgData?.result?.message_id || null;

    // Actualizar lastTelegramReminderAt en todas las pendientes y guardar lastSummaryMessageId en la primera
    for (let i = 0; i < pending.length; i++) {
      const emg = pending[i];
      const loc = emg.location && typeof emg.location === 'object' ? emg.location : {};
      const updatedLocation = {
        ...loc,
        lastTelegramReminderAt: now,
        reminderCount: Number(loc.reminderCount || 0) + 1,
        lastSummaryMessageId: i === 0 ? sentMsgId : null
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

    return res.status(200).json({
      ok: true,
      checked: emergencies.length,
      pending: pending.length,
      reminded: 1,
      messageId: sentMsgId,
      timestamp: new Date(now).toISOString()
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
