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
    const mcUrl = `https://${SERVER}.api.mailchimp.com/3.0`;
    const mcHeaders = {
      Authorization: `apikey ${API_KEY}`,
      'Content-Type': 'application/json',
    };

    const today = new Date();
    const expiry = new Date(today);
    expiry.setFullYear(expiry.getFullYear() + 1);

    // Mailchimp date fields require MM/DD/YYYY format
    const formatDate = (d: Date) =>
      `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;

    // Determine tag based on plan
    const isAWR = plan === 'Socio AWR' || plan === 'AWR Member';
    const memberTag = isAWR ? 'Socio AWR' : 'Socio Ordinario';

    // Step 1: Add/update subscriber in Mailchimp
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

    // Step 2: Run tags + segment creation in PARALLEL to save time
    const TEMPLATE_ID = 161;

    const [tagsRes, segmentRes] = await Promise.all([
      // Add tags
      fetch(`${mcUrl}/lists/${LIST_ID}/members/${subscriberHash}/tags`, {
        method: 'POST',
        headers: mcHeaders,
        body: JSON.stringify({
          tags: [
            { name: 'In attesa di pagamento', status: 'active' },
            { name: memberTag, status: 'active' },
          ],
        }),
      }),
      // Create static segment for email targeting
      fetch(`${mcUrl}/lists/${LIST_ID}/segments`, {
        method: 'POST',
        headers: mcHeaders,
        body: JSON.stringify({
          name: `welcome-${Date.now()}`,
          static_segment: [email],
        }),
      }),
    ]);

    if (!tagsRes.ok) {
      console.error('Mailchimp tags error:', await tagsRes.text());
    }

    // Step 3: Create and send the "Richiesta Ricevuta" email campaign
    if (segmentRes.ok) {
      const segment = await segmentRes.json();

      // Wait for segment to be fully indexed by Mailchimp
      await new Promise((resolve) => setTimeout(resolve, 2000));

      try {
        const campaignRes = await fetch(`${mcUrl}/campaigns`, {
          method: 'POST',
          headers: mcHeaders,
          body: JSON.stringify({
            type: 'regular',
            recipients: {
              list_id: LIST_ID,
              segment_opts: { saved_segment_id: segment.id },
            },
            settings: {
              subject_line: `Richiesta di iscrizione ricevuta - ${plan}`,
              from_name: 'Pugliesi nel Mondo UK',
              reply_to: 'info@pugliesinelmondouk.org',
              template_id: TEMPLATE_ID,
            },
          }),
        });

        if (campaignRes.ok) {
          const campaign = await campaignRes.json();

          // Wait a moment before sending to ensure campaign is ready
          await new Promise((resolve) => setTimeout(resolve, 1000));

          try {
            await fetch(`${mcUrl}/campaigns/${campaign.id}/actions/send`, {
              method: 'POST',
              headers: mcHeaders,
            });
          } catch (sendErr) {
            console.error('Campaign send error:', sendErr);
          }
        } else {
          console.error('Mailchimp create campaign error:', await campaignRes.text());
        }
      } catch (emailErr) {
        console.error('Email sending error:', emailErr);
      }
    } else {
      console.error('Mailchimp create segment error:', await segmentRes.text());
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
