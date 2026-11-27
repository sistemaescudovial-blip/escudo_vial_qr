const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://whsawcpdxkjvxteekics.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_NMBhODhYGcSbSAYaerN-CA_LpEmck89';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, message: 'Escudo Vial Push Register endpoint ready' });
  }

  try {
    const { token, deviceName = 'Operador Android', platform = 'android' } = req.body || {};

    if (!token || (!String(token).startsWith('ExponentPushToken[') && !String(token).startsWith('ExpoPushToken['))) {
      return res.status(400).json({ ok: false, error: 'Token Push inválido' });
    }

    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/operator_push_tokens?on_conflict=token`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        token: String(token),
        device_name: String(deviceName).slice(0, 80),
        platform: String(platform).slice(0, 20),
        updated_at: new Date().toISOString()
      })
    });

    if (!dbRes.ok) {
      const details = await dbRes.text();
      return res.status(500).json({ ok: false, error: 'Error guardando token en Supabase', details });
    }

    return res.status(200).json({ ok: true, registered: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
