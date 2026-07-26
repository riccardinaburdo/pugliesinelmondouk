export const prerender = false;

import { createHash } from 'crypto';

export async function POST({ request }: { request: Request }) {
  try {
    const data = await request.json();
    const { fname, lname, email, lang, website, _ts } = data;
    const language = lang === 'en' ? 'en' : 'it';

    if (!fname || !lname || !email) {
      return new Response(JSON.stringify({ error: 'Campi obbligatori mancanti' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Anti-bot: honeypot field (bots fill this hidden field, humans don't)
    if (website) {
      // Silently reject - don't reveal it's a bot check
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Anti-bot: timing check (form submitted too fast = bot)
    const ts = Number(_ts);
    if (!ts || Date.now() - ts < 2000) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Anti-bot: reject gibberish names (random strings with no vowels pattern)
    const hasGibberish = (str: string) => {
      if (str.length > 20) return true;
      const upper = (str.match(/[A-Z]/g) || []).length;
      if (str.length > 5 && upper > 3) return true;
      return false;
    };
    if (hasGibberish(fname) || hasGibberish(lname)) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
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
