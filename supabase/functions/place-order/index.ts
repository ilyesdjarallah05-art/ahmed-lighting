import { createClient } from '@supabase/supabase-js';

// The public order endpoint uses a server-only service-role client. Admin retries verify user membership.
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
type Customer = { customer_name: string; phone: string; email: string; city: string; address: string; notes: string };
type Item = { product_id: string; color: string; temperature: string; quantity: number };
type Snapshot = Item & { name: string; sku: string; unit_price: number };
type Order = Customer & { id: string; reference: string; items: Snapshot[]; subtotal: number; currency: string; telegram_status: string };

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin') || '';
  const origins = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(v => v.trim()).filter(Boolean);
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': origins.includes(origin) ? origin : '', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' };
  const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (!origins.length) return response({ error: 'Order delivery is not configured yet.' }, 503);
  if (!origins.includes(origin)) return response({ error: 'This origin is not allowed.' }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return response({ error: 'Use POST.' }, 405);
  if (Number(request.headers.get('content-length') || '0') > 16000) return response({ error: 'Request is too large.' }, 413);
  try {
    const raw = await request.text(); if (raw.length > 16000) return response({ error: 'Request is too large.' }, 413);
    let body: Record<string, unknown>; try { body = JSON.parse(raw); } catch { return response({ error: 'Invalid request.' }, 400); }
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const s = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    let order: Order;
    if (body.retry_order_id) {
      if (typeof body.retry_order_id !== 'string' || !uuid.test(body.retry_order_id)) return response({ error: 'Invalid order.' }, 400);
      const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
      const { data: auth, error: authError } = await s.auth.getUser(token);
      if (authError || !auth.user) return response({ error: 'Administrator sign-in required.' }, 401);
      const { data: admin } = await s.from('admins').select('user_id').eq('user_id', auth.user.id).maybeSingle();
      if (!admin) return response({ error: 'Administrator access required.' }, 403);
      const { data, error } = await s.from('orders').select('*').eq('id', body.retry_order_id).single();
      if (error || !data) return response({ error: 'Order not found.' }, 404);
      order = data;
    } else {
      const requestId = body.request_id;
      if (body.website || typeof requestId !== 'string' || !uuid.test(requestId) || !Array.isArray(body.items) || !body.items.length || body.items.length > 30 || !body.customer || typeof body.customer !== 'object') return response({ error: 'Please review your order details.' }, 400);
      const c = body.customer as Record<string, unknown>; const customer = {} as Customer;
      const limits = { customer_name: [2, 100], phone: [7, 30], email: [0, 150], city: [2, 100], address: [5, 500], notes: [0, 1000] };
      for (const [key, [min, max]] of Object.entries(limits)) {
        const value = c[key]; if (typeof value !== 'string' || value.trim().length < min || value.length > max) return response({ error: 'Please check your contact and delivery details.' }, 400);
        customer[key as keyof Customer] = value.trim();
      }
      if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) return response({ error: 'Please enter a valid email address.' }, 400);
      const items: Item[] = [];
      for (const item of body.items as Record<string, unknown>[]) {
        if (!item || typeof item.product_id !== 'string' || !uuid.test(item.product_id) || typeof item.color !== 'string' || item.color.length > 100 || typeof item.temperature !== 'string' || item.temperature.length > 100 || !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 99) return response({ error: 'Please review the options and quantities in your basket.' }, 400);
        items.push({ product_id: item.product_id, color: item.color, temperature: item.temperature, quantity: Number(item.quantity) });
      }
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
      const hmacKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(serviceKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const hash = await crypto.subtle.sign('HMAC', hmacKey, new TextEncoder().encode(ip));
      const ipHash = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
      const { data, error } = await s.rpc('create_lighting_order', { p_request_id: requestId, p_customer: customer, p_items: items, p_ip_hash: ipHash });
      if (error) { const publicMessage = /stock|unavailable|basket|Too many|contact|delivery/.test(error.message) ? error.message : 'Could not save your order. Please review your details and try again.'; return response({ error: publicMessage }, /Too many/.test(error.message) ? 429 : 400); }
      order = data;
    }
    if (order.telegram_status === 'sent') return response({ reference: order.reference, telegram_status: 'sent' });
    const { data: claimed, error: claimError } = await s.rpc('claim_order_notification', { p_order_id: order.id });
    if (claimError || !claimed?.id) return response({ reference: order.reference, telegram_status: order.telegram_status });
    const bot = Deno.env.get('TELEGRAM_BOT_TOKEN'); const channel = Deno.env.get('TELEGRAM_CHAT_ID');
    let sent = false;
    if (bot && channel) {
      const lines = order.items.map(i => `• ${i.name} (${i.sku})\n  ${i.color} · ${i.temperature} · Qty ${i.quantity} · ${i.unit_price * i.quantity} ${order.currency}`);
      const text = [`💡 NEW LIGHTING ORDER · ${order.reference}`, '', `Customer: ${order.customer_name}`, `Phone: ${order.phone}`, ...(order.email ? [`Email: ${order.email}`] : []), `City: ${order.city}`, `Address: ${order.address}`, '', ...lines, '', `Subtotal: ${order.subtotal} ${order.currency}`, 'Delivery to be confirmed. No online payment.', ...(order.notes ? ['', `Notes: ${order.notes}`] : [])].join('\n');
      // Plain text prevents merchant/customer text from becoming Telegram markup. Split long requests.
      const chunks = text.match(/[\s\S]{1,3800}/g) || [];
      try {
        sent = true;
        for (const chunk of chunks) {
          const result = await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: channel, text: chunk, disable_web_page_preview: true }), signal: AbortSignal.timeout(12000) });
          const json = await result.json(); if (!result.ok || !json.ok) { sent = false; break; }
        }
      } catch { sent = false; }
    }
    const telegram_status = sent ? 'sent' : 'failed';
    const { error: deliveryError } = await s.from('orders').update({ telegram_status, telegram_claimed_at: null }).eq('id', order.id);
    // The order is durable even if Telegram or the delivery status update temporarily fails.
    return response({ reference: order.reference, telegram_status: deliveryError ? 'pending' : telegram_status });
  } catch {
    // Do not log fetch URLs or Telegram responses: URLs contain the bot token.
    return response({ error: 'Could not submit your request. Please try again.' }, 500);
  }
});
