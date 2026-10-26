// Crea el pago en Mercado Pago (Checkout Pro) para el usuario que lo pide y devuelve
// el link de pago. El usuario se identifica con su sesión de Supabase.
//
// Precio: USD 10 (PRICE_USD). Mercado Pago en Argentina cobra en pesos, así que se
// convierte al dólar oficial del día (venta) y se redondea hacia arriba a la centena.
// Con {"quote": true} solo devuelve el precio del día, sin crear el pago.
//
// Variables (Supabase → Edge Functions → Secrets), las carga el dueño del proyecto:
//   MP_ACCESS_TOKEN      credencial de Mercado Pago (de prueba o de producción)
//   APP_URL              dirección de la app, por ejemplo https://melquiadesiguini.github.io/cronometro-rcp/
//   PRICE_USD            opcional, precio en dólares (por defecto 10)
//   USD_ARS_FALLBACK     opcional, cotización a usar si no se puede consultar la del día (ej. 1400)
// SUPABASE_URL y SUPABASE_ANON_KEY los pone Supabase solo.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

/** Dólar oficial (venta) del día. Si la consulta falla, usa USD_ARS_FALLBACK. */
async function usdToArs(): Promise<{ rate: number; source: string }> {
  try {
    const r = await fetch('https://dolarapi.com/v1/dolares/oficial', { signal: AbortSignal.timeout(4000) });
    const d = await r.json();
    if (Number(d?.venta) > 0) return { rate: Number(d.venta), source: 'Dólar oficial (dolarapi.com)' };
  } catch (e) {
    console.warn('dolarapi.com no respondió', String(e));
  }
  const fallback = Number(Deno.env.get('USD_ARS_FALLBACK'));
  if (fallback > 0) return { rate: fallback, source: 'Cotización de respaldo' };
  throw new Error('Sin cotización');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return json({ error: 'Iniciá sesión para pagar.' }, 401);

  const body = await req.json().catch(() => ({}));
  const priceUsd = Number(Deno.env.get('PRICE_USD')) || 10;

  let rate: number, source: string;
  try {
    ({ rate, source } = await usdToArs());
  } catch {
    return json({ error: 'No se pudo obtener la cotización del dólar. Probá de nuevo en unos minutos.' }, 503);
  }
  const priceArs = Math.ceil((priceUsd * rate) / 100) * 100;

  if (body?.quote) return json({ priceUsd, priceArs, rate, source });

  const appUrl = Deno.env.get('APP_URL')!;
  const webhook = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mp-webhook`;

  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [
        {
          id: 'cronometro-rcp-6m',
          title: `Cronómetro RCP · 6 meses (USD ${priceUsd})`,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: priceArs,
        },
      ],
      payer: { email: user.email },
      external_reference: user.id, // así el webhook sabe a quién acreditar
      notification_url: webhook,
      back_urls: {
        success: `${appUrl}#pago-ok`,
        pending: `${appUrl}#pago-pendiente`,
        failure: `${appUrl}#pago-error`,
      },
      // Mercado Pago solo vuelve solo a la app si la dirección es https (en pruebas con
      // localhost aparece el botón «Volver al sitio»).
      ...(appUrl.startsWith('https://') ? { auto_return: 'approved' } : {}),
      statement_descriptor: 'CRONOMETRO RCP',
      metadata: { price_usd: priceUsd, usd_ars: rate, rate_source: source },
    }),
  });

  if (!res.ok) {
    console.error('Mercado Pago', res.status, await res.text());
    return json({ error: 'No se pudo crear el pago. Probá de nuevo en unos minutos.' }, 502);
  }
  const pref = await res.json();
  return json({ url: pref.init_point, priceArs, rate });
});
