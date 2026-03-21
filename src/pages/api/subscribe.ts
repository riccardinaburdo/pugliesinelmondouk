export const prerender = false;

import { createHash } from 'crypto';

export async function POST({ request }: { request: Request }) {
  try {
    const data = await request.json();
    const { fname, lname, email, phone, birthplace, ukResident, plan, business, lang } = data;
    const language = lang === 'en' ? 'en' : 'it';

    if (!fname || !lname || !email) {
      return new Response(JSON.stringify({ error: 'Campi obbligatori mancanti' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const API_KEY = (import.meta.env.MAILCHIMP_API_KEY || '').trim();
    const LIST_ID = (import.meta.env.MAILCHIMP_LIST_ID || '').trim();
    const SERVER = 'us22';

    if (!API_KEY || !LIST_ID) {
      console.error('Missing Mailchimp env vars');
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

    const today = new Date();
    const expiry = new Date(today);
    expiry.setFullYear(expiry.getFullYear() + 1);

    const formatDate = (d: Date) =>
      `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;

    const isAWR = plan === 'Socio AWR' || plan === 'AWR Member';
    const memberTag = isAWR ? 'Socio AWR' : 'Socio Ordinario';

    // Generate member number by counting existing members with a MEMNUMBER
    let memberNumber = 'PNMUK-001';
    try {
      const countRes = await fetch(
        `${mcUrl}/lists/${LIST_ID}/members?count=1000&fields=members.merge_fields.MEMNUMBER`,
        { headers: mcHeaders }
      );
      if (countRes.ok) {
        const countData = await countRes.json();
        const existing = countData.members.filter(
          (m: any) => m.merge_fields?.MEMNUMBER && m.merge_fields.MEMNUMBER.startsWith('PNMUK-')
        );
        const nextNum = existing.length + 1;
        memberNumber = `PNMUK-${nextNum.toString().padStart(3, '0')}`;
      }
    } catch (e) {
      console.error('Error generating member number:', e);
    }

    // Generate confirmation token
    const confirmToken = createHash('sha256').update(email.toLowerCase() + 'pnmuk-confirm').digest('hex').slice(0, 16);
    // Step 1: Add/update subscriber
    const memberResponse = await fetch(
      `${mcUrl}/lists/${LIST_ID}/members/${subscriberHash}`,
      {
        method: 'PUT',
        headers: mcHeaders,
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
          status_if_new: 'subscribed',
          merge_fields: {
            FNAME: fname,
            LNAME: lname,
            PHONE: phone || '',
            BIRTHPLACE: birthplace || '',
            MMERGE7: formatDate(today),
            MMERGE8: formatDate(expiry),
            PIANO: plan || '',
            COMPANY: business || '',
            UKRESIDENT: ukResident ? 'Si' : 'No',
            MEMNUMBER: memberNumber,
            CONFTOKEN: confirmToken,
          },
        }),
      }
    );

    if (!memberResponse.ok) {
      const errorData = await memberResponse.json();
      console.error('Mailchimp member error:', JSON.stringify(errorData));
      return new Response(
        JSON.stringify({ error: 'Errore durante la registrazione. Riprova.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Add tags (await it)
    await fetch(`${mcUrl}/lists/${LIST_ID}/members/${subscriberHash}/tags`, {
      method: 'POST',
      headers: mcHeaders,
      body: JSON.stringify({
        tags: [
          { name: 'In attesa di pagamento', status: 'active' },
          { name: memberTag, status: 'active' },
          { name: `lang-${language}`, status: 'active' },
        ],
      }),
    });

    // Welcome email is now sent automatically via Mailchimp's Customer Journey
    // automation when a new subscriber is added to the list.

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Subscribe error:', err);
    return new Response(JSON.stringify({ error: 'Errore interno del server' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
