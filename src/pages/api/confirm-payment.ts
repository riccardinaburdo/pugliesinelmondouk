export const prerender = false;

import { createHash } from 'crypto';

export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response(errorPage('Link non valido. Contatta info@pugliesinelmondouk.org'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const API_KEY = (import.meta.env.MAILCHIMP_API_KEY || '').trim();
  const LIST_ID = (import.meta.env.MAILCHIMP_LIST_ID || '').trim();
  const SERVER = 'us22';

  if (!API_KEY || !LIST_ID) {
    return new Response(errorPage('Errore di configurazione del server.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const mcUrl = `https://${SERVER}.api.mailchimp.com/3.0`;
  const mcHeaders = {
    Authorization: `apikey ${API_KEY}`,
    'Content-Type': 'application/json',
  };

  try {
    // Find member by CONFTOKEN
    const searchRes = await fetch(
      `${mcUrl}/lists/${LIST_ID}/members?count=1000&fields=members.id,members.email_address,members.merge_fields`,
      { headers: mcHeaders }
    );

    if (!searchRes.ok) {
      return new Response(errorPage('Errore nella ricerca del contatto. Contatta info@pugliesinelmondouk.org'), {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const searchData = await searchRes.json();
    const member = searchData.members.find(
      (m: any) => m.merge_fields?.CONFTOKEN === token
    );

    if (!member) {
      return new Response(errorPage('Link non valido. Contatta info@pugliesinelmondouk.org'), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const fname = member.merge_fields?.FNAME || '';
    const subscriberHash = createHash('md5').update(member.email_address.toLowerCase()).digest('hex');

    // Update tags: remove "In attesa di pagamento", add "Pagamento confermato"
    await fetch(`${mcUrl}/lists/${LIST_ID}/members/${subscriberHash}/tags`, {
      method: 'POST',
      headers: mcHeaders,
      body: JSON.stringify({
        tags: [
          { name: 'In attesa di pagamento', status: 'inactive' },
          { name: 'Pagamento confermato', status: 'active' },
        ],
      }),
    });

    return new Response(successPage(fname), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    console.error('Confirm payment error:', err);
    return new Response(errorPage('Errore interno del server. Riprova o contatta info@pugliesinelmondouk.org'), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

function successPage(name: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Pagamento Confermato - Pugliesi nel Mondo UK</title>
<style>
  body { margin:0; padding:0; background:#f5f0e8; font-family:'Helvetica Neue',Arial,sans-serif; display:flex; justify-content:center; align-items:center; min-height:100vh; }
  .card { max-width:500px; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,0.15); text-align:center; }
  .card-header { background:#1a5632; padding:30px; }
  .card-header h1 { color:#fff; font-family:Georgia,serif; font-size:22px; margin:0 0 5px 0; }
  .card-header p { color:#d4a843; font-size:11px; letter-spacing:3px; text-transform:uppercase; margin:0; }
  .card-body { padding:35px 30px; }
  .check { font-size:60px; margin-bottom:15px; }
  .card-body h2 { color:#1a5632; font-family:Georgia,serif; font-size:20px; margin:0 0 15px 0; }
  .card-body p { color:#555; font-size:15px; line-height:1.6; margin:0 0 10px 0; }
  .note { background:#f9f7f3; border:1px solid #e8e0d4; border-radius:8px; padding:15px; margin:20px 0; font-size:13px; color:#666; }
</style>
</head><body>
<div class="card">
  <div class="card-header">
    <h1>Pugliesi nel Mondo UK</h1>
    <p>Associazione No Profit</p>
  </div>
  <div class="card-body">
    <div class="check">&#10004;</div>
    <h2>Grazie${name ? ', ' + name : ''}!</h2>
    <p>La tua conferma di pagamento e' stata ricevuta.</p>
    <p>Riceverai a breve un'email con la tua <strong>tessera associativa digitale</strong> da scaricare.</p>
    <div class="note">Se non ricevi l'email entro qualche minuto, controlla la cartella spam o contatta <a href="mailto:info@pugliesinelmondouk.org" style="color:#1a5632;">info@pugliesinelmondouk.org</a></div>
  </div>
</div>
</body></html>`;
}

function errorPage(message: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Errore - Pugliesi nel Mondo UK</title>
<style>
  body { margin:0; padding:0; background:#f5f0e8; font-family:'Helvetica Neue',Arial,sans-serif; display:flex; justify-content:center; align-items:center; min-height:100vh; }
  .card { max-width:500px; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,0.15); text-align:center; }
  .card-header { background:#1a5632; padding:30px; }
  .card-header h1 { color:#fff; font-family:Georgia,serif; font-size:22px; margin:0 0 5px 0; }
  .card-header p { color:#d4a843; font-size:11px; letter-spacing:3px; text-transform:uppercase; margin:0; }
  .card-body { padding:35px 30px; }
  .icon { font-size:60px; margin-bottom:15px; }
  .card-body h2 { color:#c0392b; font-family:Georgia,serif; font-size:20px; margin:0 0 15px 0; }
  .card-body p { color:#555; font-size:15px; line-height:1.6; }
</style>
</head><body>
<div class="card">
  <div class="card-header">
    <h1>Pugliesi nel Mondo UK</h1>
    <p>Associazione No Profit</p>
  </div>
  <div class="card-body">
    <div class="icon">&#9888;</div>
    <h2>Si e' verificato un errore</h2>
    <p>${message}</p>
  </div>
</div>
</body></html>`;
}
