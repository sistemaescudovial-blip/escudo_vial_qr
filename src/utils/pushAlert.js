/**
 * Envía notificación Push nativa con sonido de sirena a todos los celulares
 * de los operadores que tengan instalada la app Escudo Vial Central.
 */
export async function sendOperatorPushAlert(emergency, isReiterated = false) {
  if (!emergency) return;

  try {
    await fetch('/api/push-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emergency, isReiterated })
    });
  } catch (err) {
    console.error('Error enviando alerta Push a operadores:', err);
  }
}
