export const prerender = false;

import { createHash } from 'crypto';
import { checkSubmission } from '../../lib/antibot';
import { antibotMessage } from '../../lib/antibot-messages';

export async function POST(context: { request: Request; clientAddress?: string }) {
  const { request } = context;
  let ip: string | undefined;
  try { ip = context.clientAddress; } catch { ip = undefined; }
  try {
    const data = await request.json();
    const { fname, lname, email, lang } = data;
    const language = lang === 'en' ? 'en' : 'it';
    const isEn = language === 'en';

    if (!fname || !lname || !email) {
      return new Response(JSON.stringify({ error: isEn ? 'Please fill in all fields' : 'Campi obbligatori mancanti' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const check = await checkSubmission(request, data, ip);
    if (!check.ok) {
      console.warn('Newsletter signup blocked:', check.reason);
      if (check.silent) {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: antibotMessage(check.reason, isEn) }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const API_KEY = (import.meta.env.MAILCHIMP_API_KEY || '').trim();
    const LIST_ID = (import.meta.env.MAILCHIMP_LIST_ID || '').trim();
    const SERVER = 'us22';

    if (!API_KEY || !LIST_ID) {
      return new Response(JSON.stringify({ error: 'Configurazione server mancante' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const subscriberHash = createHash('md5').update(email.toLowerCase()).digest('hex');
    const mcUrl = `https://${SERVER}.api.mailchimp.com/3.0`;
    const mcHeaders = {
      Authorization: `apikey ${API_KEY}`,
      'Content-Type': 'application/json',
    };

    // Add/update subscriber
    const memberResponse = await fetch(
      `${mcUrl}/lists/${LIST_ID}/members/${subscriberHash}`,
      {
        method: 'PUT',
        headers: mcHeaders,
        body: JSON.stringify({
          email_address: email,
          status_if_new: 'pending',
          merge_fields: {
            FNAME: fname,
            LNAME: lname,
          },
        }),
      }
    );

    if (!memberResponse.ok) {
      const errorData = await memberResponse.json();
      console.error('Mailchimp newsletter error:', JSON.stringify(errorData));
      return new Response(
        JSON.stringify({ error: 'Errore durante la registrazione. Riprova.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Add tags: Newsletter + language
    await fetch(`${mcUrl}/lists/${LIST_ID}/members/${subscriberHash}/tags`, {
      method: 'POST',
      headers: mcHeaders,
      body: JSON.stringify({
        tags: [
          { name: 'Newsletter', status: 'active' },
          { name: `lang-${language}`, status: 'active' },
        ],
      }),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    return new Response(JSON.stringify({ error: 'Errore interno del server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
