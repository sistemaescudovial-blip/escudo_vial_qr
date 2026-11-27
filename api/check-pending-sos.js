const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://whsawcpdxkjvxteekics.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_NMBhODhYGcSbSAYaerN-CA_LpEmck89';

const MIN_AGE_MS = 45 * 1000;
const REMINDER_INTERVAL_MS = 50 * 1000;
const MAX_AGE_MS = 30 * 60 * 1000;

export default async function handler(req, res) {
  try {
    const [emgRes, tokensRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/emergencies?status=eq.critico&select=*&order=created_at.desc`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      }),
      fetch(`${SUPABASE_URL}/rest/v1/operator_push_tokens?select=token`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      })
    ]);

    if (!emgRes.ok) {
      return res.status(500).json({ ok: false, error: 'Supabase emergencies query failed' });
    }

    const emergencies = await emgRes.json();
    const tokenRows = tokensRes.ok ? await tokensRes.json() : [];
    const tokens = tokenRows.map((r) => r.token).filter(Boolean);

    const now = Date.now();
    const pending = emergencies.filter((emg) => {
      const createdAtMs = emg.created_at ? new Date(emg.created_at).getTime() : now;
      const ageMs = now - createdAtMs;
      return ageMs >= MIN_AGE_MS && ageMs <= MAX_AGE_MS;
    });

    if (pending.length === 0 || tokens.length === 0) {
      return res.status(200).json({
        ok: true,
        checked: emergencies.length,
        pending: pending.length,
        devices: tokens.length,
        reminded: 0
      });
    }

    const recentlyReminded = pending.some((emg) => {
      const last = Number(emg.location?.lastPushReminderAt || 0);
      return last && (now - last) < REMINDER_INTERVAL_MS;
    });

    if (recentlyReminded) {
      return res.status(200).json({ ok: true, skipped: 'already_reminded_recently' });
    }

    const title = pending.length === 1
      ? `🔔 S.O.S SIN ATENDER ${pending[0].folio} — ${pending[0].holder_name}`
      : `🔔 ${pending.length} ALERTAS S.O.S SIN ATENDER`;

    const body = pending.length === 1
      ? `${pending[0].sku} • ${pending[0].location?.address || 'Toca para abrir Central'}`
      : pending.slice(0, 3).map((e) => `${e.folio} (${e.sku})`).join(' | ');

    const messages = tokens.map((to) => ({
      to,
      title,
      body,
      sound: 'siren.wav',
      channelId: 'sos-emergency-v2',
      priority: 'high'
    }));

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messages)
    });

    for (const emg of pending) {
      const loc = emg.location && typeof emg.location === 'object' ? emg.location : {};
      await fetch(`${SUPABASE_URL}/rest/v1/emergencies?id=eq.${encodeURIComponent(emg.id)}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          location: { ...loc, lastPushReminderAt: now }
        })
      });
    }

    return res.status(200).json({
      ok: true,
      checked: emergencies.length,
      pending: pending.length,
      remindedDevices: tokens.length
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}
