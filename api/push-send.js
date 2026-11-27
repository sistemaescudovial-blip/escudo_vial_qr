const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://whsawcpdxkjvxteekics.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_NMBhODhYGcSbSAYaerN-CA_LpEmck89';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, message: 'Escudo Vial Push Send endpoint ready' });
  }

  try {
    const { emergency, isReiterated = false } = req.body || {};
    if (!emergency) {
      return res.status(400).json({ ok: false, error: 'Faltan datos de la emergencia' });
    }

    const tokensRes = await fetch(`${SUPABASE_URL}/rest/v1/operator_push_tokens?select=token`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!tokensRes.ok) {
      const details = await tokensRes.text();
      return res.status(500).json({ ok: false, error: 'Error leyendo tokens de Supabase', details });
    }

    const rows = await tokensRes.json();
    const tokens = rows.map((r) => r.token).filter(Boolean);

    if (tokens.length === 0) {
      return res.status(200).json({ ok: true, sent: 0, message: 'No hay dispositivos registrados aún' });
    }

    const prefix = isReiterated ? '🚨 S.O.S REITERADA' : '🚨 NUEVA ALERTA S.O.S';
    const title = `${prefix} ${emergency.folio || ''} — ${emergency.holderName || 'Usuario'}`;
    const body = `${emergency.sku || ''} • ${emergency.vehicle || 'Vehículo'} • ${emergency.location?.address || 'Ubicación GPS en vivo'}`;

    const messages = tokens.map((to) => ({
      to,
      title,
      body,
      sound: 'siren.wav',
      channelId: 'sos-emergency-v2',
      priority: 'high',
      data: {
        emergencyId: emergency.id,
        folio: emergency.folio,
        sku: emergency.sku
      }
    }));

    const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messages)
    });

    const expoData = await expoRes.json();
    return res.status(200).json({ ok: true, sent: tokens.length, expo: expoData });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
