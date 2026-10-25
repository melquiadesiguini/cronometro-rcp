// Recibe los avisos de Mercado Pago. Cuando un pago queda aprobado, suma 6 meses
// a la cuenta del usuario (función credit_payment de la base de datos).
//
// Se publica SIN verificación de sesión (Mercado Pago no tiene sesión de Supabase):
//   supabase functions deploy mp-webhook --no-verify-jwt
//
// Variables (Supabase → Edge Functions → Secrets):
//   MP_ACCESS_TOKEN     credencial de Mercado Pago
//   MP_WEBHOOK_SECRET   "clave secreta" de Webhooks en el panel de Mercado Pago
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los pone Supabase solo.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const ok = () => new Response('ok', { status: 200 });

/** Verifica la firma x-signature de Mercado Pago (HMAC-SHA256). */
async function validSignature(req: Request, dataId: string): Promise<boolean> {
  const secret = Deno.env.get('MP_WEBHOOK_SECRET');
  if (!secret) return true; // sin clave configurada no se puede verificar (solo para pruebas)
  const header = req.headers.get('x-signature') ?? '';
  const requestId = req.headers.get('x-request-id') ?? '';
  const parts = Object.fromEntries(header.split(',').map((p) => p.trim().split('=')));
  if (!parts.ts || !parts.v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(manifest));
  const hex = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return hex === parts.v1;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return ok();

  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const type = body.type ?? url.searchParams.get('type') ?? url.searchParams.get('topic');
  const paymentId = String(body.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? '');

  // Solo interesan los avisos de pagos.
  if (type !== 'payment' || !paymentId) return ok();
  if (!(await validSignature(req, paymentId))) {
    console.warn('Firma inválida para el pago', paymentId);
    return new Response('firma inválida', { status: 401 });
  }

  // Nunca se confía en el aviso: se consulta el pago real a Mercado Pago.
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${Deno.env.get('MP_ACCESS_TOKEN')}` },
  });
  if (!res.ok) {
    console.error('No se pudo leer el pago', paymentId, res.status);
    return new Response('reintentar', { status: 500 }); // Mercado Pago vuelve a avisar
  }
  const payment = await res.json();
  if (payment.status !== 'approved' || !payment.external_reference) return ok();

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { error } = await admin.rpc('credit_payment', {
    p_user_id: payment.external_reference,
    p_provider_payment_id: String(payment.id),
    p_status: payment.status,
    p_amount: payment.transaction_amount,
    p_currency: payment.currency_id,
    p_months: 6,
  });
  if (error) {
    console.error('No se pudo acreditar', paymentId, error.message);
    return new Response('reintentar', { status: 500 });
  }
  return ok();
});
