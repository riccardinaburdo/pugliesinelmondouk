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
      `${mcUrl}/lists/${LIST_ID}/members?count=1000`,
      { headers: mcHeaders }
    );

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error('Mailchimp search error:', searchRes.status, errText);
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
    const lname = member.merge_fields?.LNAME || '';
    const piano = member.merge_fields?.PIANO || '';
    const memnumber = member.merge_fields?.MEMNUMBER || '';
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

    // Notify association via Resend
    const RESEND_API_KEY = (import.meta.env.RESEND_API_KEY || '').trim();
    if (RESEND_API_KEY) {
      const now = new Date().toLocaleString('it-IT', { timeZone: 'Europe/London' });
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'noreply@pugliesinelmondouk.org',
          to: 'info@pugliesinelmondouk.org',
          subject: `✅ Pagamento confermato – ${fname} ${lname} (${memnumber})`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
              <h2 style="color:#1a5632;">Nuovo pagamento confermato</h2>
              <p>Un nuovo socio ha confermato il proprio pagamento il <strong>${now}</strong>.</p>
              <table style="width:100%;border-collapse:collapse;margin:20px 0;">
                <tr style="background:#f5f0e8;">
                  <td style="padding:10px;border:1px solid #ddd;font-weight:bold;">Nome</td>
                  <td style="padding:10px;border:1px solid #ddd;">${fname} ${lname}</td>
                </tr>
                <tr>
                  <td style="padding:10px;border:1px solid #ddd;font-weight:bold;">Email</td>
                  <td style="padding:10px;border:1px solid #ddd;">${member.email_address}</td>
                </tr>
                <tr style="background:#f5f0e8;">
                  <td style="padding:10px;border:1px solid #ddd;font-weight:bold;">Piano</td>
                  <td style="padding:10px;border:1px solid #ddd;">${piano}</td>
                </tr>
                <tr>
                  <td style="padding:10px;border:1px solid #ddd;font-weight:bold;">Numero tessera</td>
                  <td style="padding:10px;border:1px solid #ddd;">${memnumber}</td>
                </tr>
              </table>
              <p style="color:#888;font-size:12px;">La tessera digitale è stata inviata automaticamente al socio.</p>
            </div>
          `,
        }),
      }).catch((err) => console.error('Resend notification error:', err));
    }

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
