export const prerender = false;

import { createHash, randomBytes } from 'crypto';
import { checkSubmission } from '../../lib/antibot';
import { antibotMessage } from '../../lib/antibot-messages';

export async function POST(context: { request: Request; clientAddress?: string }) {
  const { request } = context;
  let ip: string | undefined;
  try { ip = context.clientAddress; } catch { ip = undefined; }
  try {
    const data = await request.json();
    const { fname, lname, phone, birthplace, ukResident, plan, business, lang } = data;
    const email = String(data.email || '').trim();
    const language = lang === 'en' ? 'en' : 'it';
    const isEn = language === 'en';

    if (!fname || !lname || !email) {
      return new Response(JSON.stringify({ error: isEn ? 'Please fill in all required fields' : 'Campi obbligatori mancanti' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const check = await checkSubmission(request, data, ip);
    if (!check.ok) {
      console.warn('Membership signup blocked:', check.reason);
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

    // Look up the contact first, so a resubmission never overwrites an existing
    // member's card number or payment link, and never re-subscribes someone who unsubscribed.
    let existing: any = null;
    const existingRes = await fetch(`${mcUrl}/lists/${LIST_ID}/members/${subscriberHash}`, { headers: mcHeaders });
    if (existingRes.ok) existing = await existingRes.json();

    let memberNumber: string = existing?.merge_fields?.MEMNUMBER || '';
    if (!memberNumber.startsWith('PNMUK-')) {
      // Next number = highest existing PNMUK number + 1 (counting would reuse numbers after archiving)
      memberNumber = 'PNMUK-001';
      try {
        const countRes = await fetch(
          `${mcUrl}/lists/${LIST_ID}/members?count=1000&fields=members.merge_fields.MEMNUMBER`,
          { headers: mcHeaders }
        );
        if (countRes.ok) {
          const countData = await countRes.json();
          const max = countData.members.reduce((acc: number, m: any) => {
            const match = /^PNMUK-(\d+)$/.exec(m.merge_fields?.MEMNUMBER || '');
            return match ? Math.max(acc, Number(match[1])) : acc;
          }, 0);
          memberNumber = `PNMUK-${(max + 1).toString().padStart(3, '0')}`;
        }
      } catch (e) {
        console.error('Error generating member number:', e);
      }
    }

    // Random, unguessable payment-confirmation token (kept if the member already has one)
    const confirmToken: string = existing?.merge_fields?.CONFTOKEN || randomBytes(12).toString('hex');

    // New contacts (and anyone not currently subscribed) must confirm their email address
    // through Mailchimp's double opt-in before they become subscribers and get the welcome email.
    const isSubscribed = existing?.status === 'subscribed';

    // Step 1: Add/update subscriber
    const memberResponse = await fetch(
      `${mcUrl}/lists/${LIST_ID}/members/${subscriberHash}`,
      {
        method: 'PUT',
        headers: mcHeaders,
        body: JSON.stringify({
          email_address: email,
          status_if_new: 'pending',
          ...(existing && !isSubscribed ? { status: 'pending' } : {}),
          merge_fields: {
            FNAME: fname,
            LNAME: lname,
            PHONE: phone || '',
            BIRTHPLACE: birthplace || '',
            MMERGE7: existing?.merge_fields?.MMERGE7 || formatDate(today),
            MMERGE8: existing?.merge_fields?.MMERGE8 || formatDate(expiry),
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

    // The welcome email (with bank details) is sent by Mailchimp's automation once the
    // contact has confirmed their email address.

    return new Response(JSON.stringify({ success: true, confirmEmail: !isSubscribed }), {
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
