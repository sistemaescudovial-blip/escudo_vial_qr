const TELEGRAM_BOT_TOKEN = '9140137525:AAGfciv2x4qNOEs8XwTXXil0y3syIC9UMyM';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://whsawcpdxkjvxteekics.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_NMBhODhYGcSbSAYaerN-CA_LpEmck89';

async function silenceEmergency(row, operatorName) {
  const currentLoc = row.location && typeof row.location === 'object' ? row.location : {};
  const updatedLocation = {
    ...currentLoc,
    telegramSilenced: true,
    silencedBy: operatorName,
    silencedAt: new Date().toISOString()
  };

  await fetch(`${SUPABASE_URL}/rest/v1/emergencies?id=eq.${encodeURIComponent(row.id)}`, {
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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, message: 'Escudo Vial Telegram Webhook ready' });
  }

  try {
    const update = req.body || {};
    const callback = update.callback_query;

    if (!callback || !callback.data) {
      return res.status(200).json({ ok: true });
    }

    const data = String(callback.data);
    const operatorName = [callback.from?.first_name, callback.from?.last_name]
      .filter(Boolean)
      .join(' ') || callback.from?.username || 'Operador';

    if (data === 'ack_all') {
      const getRes = await fetch(
        `${SUPABASE_URL}/rest/v1/emergencies?status=eq.critico&select=id,location`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );

      if (getRes.ok) {
        const rows = await getRes.json();
        for (const row of rows) {
          await silenceEmergency(row, operatorName);
        }
      }
    } else if (data.startsWith('ack:')) {
      const emergencyId = data.slice(4);
      const getRes = await fetch(
        `${SUPABASE_URL}/rest/v1/emergencies?id=eq.${encodeURIComponent(emergencyId)}&select=id,folio,location`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`
          }
        }
      );

      if (getRes.ok) {
        const rows = await getRes.json();
        if (rows[0]) {
          await silenceEmergency(rows[0], operatorName);
        }
      }
    } else {
      return res.status(200).json({ ok: true });
    }

    // Responder a Telegram para quitar el relojito del botón
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callback.id,
        text: `✅ Alerta silenciada por ${operatorName}.`
      })
    });

    // Actualizar botones del mensaje para mostrar que ya fue tomada
    if (callback.message?.chat?.id && callback.message?.message_id) {
      const existingRows = callback.message.reply_markup?.inline_keyboard || [];
      const linkRow = existingRows[0] || [];
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageReplyMarkup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: callback.message.chat.id,
          message_id: callback.message.message_id,
          reply_markup: {
            inline_keyboard: [
              linkRow,
              [
                { text: `✅ Tomada / Silenciada por ${operatorName}`, callback_data: 'noop' }
              ]
            ].filter(r => r.length > 0)
          }
        })
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook error:', err);
    return res.status(200).json({ ok: true });
  }
}
