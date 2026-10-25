// Crea el pago en Mercado Pago (Checkout Pro) para el usuario que lo pide y devuelve
// el link de pago. El usuario se identifica con su sesión de Supabase.
//
// Variables (Supabase → Edge Functions → Secrets), las carga el dueño del proyecto:
//   MP_ACCESS_TOKEN   credencial de Mercado Pago (de prueba o de producción)
//   PRICE_ARS         precio de 6 meses en pesos, por ejemplo 12000
//   APP_URL           dirección de la app, por ejemplo https://melquiadesiguini.github.io/cronometro-rcp/
// SUPABASE_URL y SUPABASE_ANON_KEY los pone Supabase solo.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return json({ error: 'Iniciá sesión para pagar.' }, 401);

  const price = Number(Deno.env.get('PRICE_ARS'));
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
          title: 'Cronómetro RCP · 6 meses',
          quantity: 1,
          currency_id: 'ARS',
          unit_price: price,
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
      auto_return: 'approved',
      statement_descriptor: 'CRONOMETRO RCP',
    }),
  });

  if (!res.ok) {
    console.error('Mercado Pago', res.status, await res.text());
    return json({ error: 'No se pudo crear el pago. Probá de nuevo en unos minutos.' }, 502);
  }
  const pref = await res.json();
  return json({ url: pref.init_point });
});
