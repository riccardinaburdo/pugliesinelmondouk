export const prerender = false;

import { createHash } from 'crypto';

export async function POST({ request }: { request: Request }) {
  try {
    const data = await request.json();
    const { fname, lname, email, phone, birthplace, ukResident, plan, business } = data;

    if (!fname || !lname || !email) {
      return new Response(JSON.stringify({ error: 'Campi obbligatori mancanti' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const API_KEY = import.meta.env.MAILCHIMP_API_KEY;
    const LIST_ID = import.meta.env.MAILCHIMP_LIST_ID;
    const SERVER = 'us22';

    if (!API_KEY || !LIST_ID) {
      console.error('Missing Mailchimp env vars');
      return new Response(JSON.stringify({ error: 'Configurazione server mancante' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const subscriberHash = createHash('md5').update(email.toLowerCase()).digest('hex');

    const today = new Date();
    const expiry = new Date(today);
    expiry.setFullYear(expiry.getFullYear() + 1);

    // Mailchimp date fields require MM/DD/YYYY format
    const formatDate = (d: Date) =>
      `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;

    // Determine tag based on plan
    const isAWR = plan === 'Socio AWR' || plan === 'AWR Member';
    const memberTag = isAWR ? 'Socio AWR' : 'Socio Ordinario';

    // Add/update subscriber in Mailchimp
    const memberResponse = await fetch(
      `https://${SERVER}.api.mailchimp.com/3.0/lists/${LIST_ID}/members/${subscriberHash}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `apikey ${API_KEY}`,
          'Content-Type': 'application/json',
        },
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

    // Add tags
    const tagsResponse = await fetch(
      `https://${SERVER}.api.mailchimp.com/3.0/lists/${LIST_ID}/members/${subscriberHash}/tags`,
      {
        method: 'POST',
        headers: {
          Authorization: `apikey ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: [
            { name: 'In attesa di pagamento', status: 'active' },
            { name: memberTag, status: 'active' },
          ],
        }),
      }
    );

    if (!tagsResponse.ok) {
      console.error('Mailchimp tags error:', await tagsResponse.text());
    }

    // Send "Richiesta Ricevuta" email to the new subscriber
    // Strategy: create a static segment, create campaign targeting it, send
    try {
      const TEMPLATE_ID = 160;

      // 1. Create a static segment with this subscriber
      const segmentRes = await fetch(
        `https://${SERVER}.api.mailchimp.com/3.0/lists/${LIST_ID}/segments`,
        {
          method: 'POST',
          headers: {
            Authorization: `apikey ${API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: `welcome-${Date.now()}`,
            static_segment: [email],
          }),
        }
      );

      if (segmentRes.ok) {
        const segment = await segmentRes.json();
        const segmentId = segment.id;

        // 3. Create campaign targeting this segment
        const campaignRes = await fetch(
          `https://${SERVER}.api.mailchimp.com/3.0/campaigns`,
          {
            method: 'POST',
            headers: {
              Authorization: `apikey ${API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'regular',
              recipients: {
                list_id: LIST_ID,
                segment_opts: {
                  saved_segment_id: segmentId,
                },
              },
              settings: {
                subject_line: `Richiesta di iscrizione ricevuta - ${plan}`,
                from_name: 'Pugliesi nel Mondo UK',
                reply_to: 'info@pugliesinelmondouk.org',
                template_id: TEMPLATE_ID,
              },
            }),
          }
        );

        if (campaignRes.ok) {
          const campaign = await campaignRes.json();

          // 4. Send the campaign
          const sendRes = await fetch(
            `https://${SERVER}.api.mailchimp.com/3.0/campaigns/${campaign.id}/actions/send`,
            {
              method: 'POST',
              headers: { Authorization: `apikey ${API_KEY}` },
            }
          );

          if (!sendRes.ok) {
            console.error('Mailchimp send campaign error:', await sendRes.text());
          }
        } else {
          console.error('Mailchimp create campaign error:', await campaignRes.text());
        }

        // Note: segment is kept — Mailchimp needs it to process the async send
      } else {
        console.error('Mailchimp create segment error:', await segmentRes.text());
      }
    } catch (emailErr) {
      // Don't fail the whole request if email sending fails
      console.error('Email sending error:', emailErr);
    }

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
