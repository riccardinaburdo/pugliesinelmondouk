export const prerender = false;

export async function GET({ request }: { request: Request }) {
  try {
    const API_KEY = (import.meta.env.MAILCHIMP_API_KEY || '').trim();
    const SERVER = 'us22';
    const mcUrl = `https://${SERVER}.api.mailchimp.com/3.0`;
    const mcHeaders = {
      Authorization: `apikey ${API_KEY}`,
      'Content-Type': 'application/json',
    };

    if (!API_KEY) {
      return new Response(JSON.stringify({ error: 'Missing MAILCHIMP_API_KEY' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Step 1: Find the campaign with subject containing "tessera"
    const campaignsRes = await fetch(
      `${mcUrl}/campaigns?count=20&sort_field=create_time&sort_dir=DESC`,
      { headers: mcHeaders }
    );
    const campaignsData = await campaignsRes.json();

    const campaign = campaignsData.campaigns?.find(
      (c: any) =>
        c.settings?.subject_line?.toLowerCase().includes('tessera')
    );

    if (!campaign) {
      return new Response(
        JSON.stringify({
          error: 'Campaign not found',
          campaigns: campaignsData.campaigns?.map((c: any) => ({
            id: c.id,
            web_id: c.web_id,
            subject: c.settings?.subject_line,
          })),
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Update the campaign HTML content
    const html = `<!DOCTYPE html>
<html lang="it" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Conferma Iscrizione Socio</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f1ea;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table { border-collapse: collapse; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    .email-container { max-width: 600px; margin: 0 auto; }

    h1, h2, h3 {
      font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
      color: #1a5632;
    }
    p, td, li, span {
      font-family: 'Lato', Arial, Helvetica, sans-serif;
    }

    @media screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
      .stack-column { display: block !important; width: 100% !important; }
      .mobile-padding { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f1ea;">
  <center style="width:100%; background-color:#f4f1ea;">
    <!--[if mso]>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" align="center"><tr><td>
    <![endif]-->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:600px; margin:0 auto;" class="email-container">

      <!-- HEADER -->
      <tr>
        <td style="background-color:#1a5632; padding:30px 40px; text-align:center;">
          <h1 style="font-family:'Playfair Display', Georgia, serif; color:#ffffff; font-size:28px; font-weight:700; margin:0 0 4px 0; letter-spacing:0.5px;">
            Pugliesi nel Mondo UK
          </h1>
          <p style="font-family:'Lato', Arial, sans-serif; color:#d4a843; font-size:12px; font-weight:700; letter-spacing:3px; text-transform:uppercase; margin:0;">
            ASSOCIAZIONE NO PROFIT
          </p>
        </td>
      </tr>

      <!-- GOLD ACCENT LINE -->
      <tr>
        <td style="background-color:#d4a843; height:4px; font-size:0; line-height:0;">&nbsp;</td>
      </tr>

      <!-- BODY -->
      <tr>
        <td style="background-color:#faf8f0; padding:40px 40px 10px 40px;" class="mobile-padding">

          <!-- GREETING -->
          <h2 style="font-family:'Playfair Display', Georgia, serif; color:#1a5632; font-size:26px; font-weight:700; margin:0 0 20px 0;">
            Benvenuto/a, *|FNAME|*!
          </h2>

          <p style="font-family:'Lato', Arial, sans-serif; color:#333333; font-size:16px; line-height:1.7; margin:0 0 28px 0;">
            Siamo lieti di confermare la tua iscrizione all'associazione <strong>Pugliesi nel Mondo UK</strong>. Grazie per aver scelto di far parte della nostra comunita'!
          </p>

          <!-- MEMBER DETAILS BOX -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:28px;">
            <tr>
              <td style="background-color:#ffffff; border:1px solid #e8e4d9; border-radius:8px; padding:24px 28px;">
                <h3 style="font-family:'Playfair Display', Georgia, serif; color:#1a5632; font-size:18px; font-weight:600; margin:0 0 16px 0; border-bottom:2px solid #d4a843; padding-bottom:10px;">
                  Dettagli Iscrizione
                </h3>
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="font-family:'Lato', Arial, sans-serif; color:#777777; font-size:14px; padding:6px 0; width:140px; vertical-align:top;">Nome</td>
                    <td style="font-family:'Lato', Arial, sans-serif; color:#333333; font-size:14px; font-weight:700; padding:6px 0;">*|FNAME|* *|LNAME|*</td>
                  </tr>
                  <tr>
                    <td style="font-family:'Lato', Arial, sans-serif; color:#777777; font-size:14px; padding:6px 0; vertical-align:top;">Email</td>
                    <td style="font-family:'Lato', Arial, sans-serif; color:#333333; font-size:14px; font-weight:700; padding:6px 0;">*|EMAIL|*</td>
                  </tr>
                  <tr>
                    <td style="font-family:'Lato', Arial, sans-serif; color:#777777; font-size:14px; padding:6px 0; vertical-align:top;">Tipo di iscrizione</td>
                    <td style="font-family:'Lato', Arial, sans-serif; color:#333333; font-size:14px; font-weight:700; padding:6px 0;">*|PIANO|*</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- VALIDITY GREEN BOX -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:28px;">
            <tr>
              <td style="background-color:#1a5632; border-radius:8px; padding:24px 28px; text-align:center;">
                <p style="font-family:'Playfair Display', Georgia, serif; color:#ffffff; font-size:18px; font-weight:600; margin:0 0 8px 0;">
                  La tua tessera e' valida
                </p>
                <p style="font-family:'Lato', Arial, sans-serif; color:#d4a843; font-size:20px; font-weight:700; margin:0 0 10px 0;">
                  dal *|MMERGE7|* al *|MMERGE8|*
                </p>
                <p style="font-family:'Lato', Arial, sans-serif; color:#c8d6ce; font-size:13px; margin:0;">
                  Riceverai un promemoria prima della scadenza
                </p>
              </td>
            </tr>
          </table>

          <!-- NOTE -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:28px;">
            <tr>
              <td style="background-color:#fff8e7; border-left:4px solid #d4a843; border-radius:0 8px 8px 0; padding:16px 20px;">
                <p style="font-family:'Lato', Arial, sans-serif; color:#7a6b3a; font-size:14px; line-height:1.6; margin:0;">
                  <strong>Nota:</strong> La tessera associativa ti sara' inviata separatamente dopo la conferma dell'avvenuto pagamento.
                </p>
              </td>
            </tr>
          </table>

          <!-- BENEFITS -->
          <h3 style="font-family:'Playfair Display', Georgia, serif; color:#1a5632; font-size:18px; font-weight:600; margin:0 0 16px 0;">
            I vantaggi della tua iscrizione
          </h3>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:32px;">
            <tr>
              <td style="padding:8px 0 8px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-size:18px; color:#d4a843; padding-right:12px; vertical-align:top; line-height:1.5;">&#10148;</td>
                    <td style="font-family:'Lato', Arial, sans-serif; color:#333333; font-size:15px; line-height:1.5;">Partecipare a eventi culturali, festival e iniziative</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0 8px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-size:18px; color:#d4a843; padding-right:12px; vertical-align:top; line-height:1.5;">&#10148;</td>
                    <td style="font-family:'Lato', Arial, sans-serif; color:#333333; font-size:15px; line-height:1.5;">Connetterti con la comunita' pugliese nel Regno Unito</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0 8px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-size:18px; color:#d4a843; padding-right:12px; vertical-align:top; line-height:1.5;">&#10148;</td>
                    <td style="font-family:'Lato', Arial, sans-serif; color:#333333; font-size:15px; line-height:1.5;">Ricevere la newsletter con aggiornamenti e opportunita'</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 0 8px 0;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="font-size:18px; color:#d4a843; padding-right:12px; vertical-align:top; line-height:1.5;">&#10148;</td>
                    <td style="font-family:'Lato', Arial, sans-serif; color:#333333; font-size:15px; line-height:1.5;">Contribuire allo sviluppo culturale ed economico della Puglia</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- CTA BUTTON -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:36px;">
            <tr>
              <td style="text-align:center;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                  <tr>
                    <td style="background-color:#1a5632; border-radius:8px;">
                      <a href="https://pugliesinelmondouk.org/api/membership-card?name=*|FNAME|*+*|LNAME|*&amp;plan=*|PIANO|*&amp;until=*|MMERGE8|*&amp;id=PNMUK-*|MMERGE9|*" target="_blank" style="display:inline-block; font-family:'Lato', Arial, sans-serif; font-size:18px; font-weight:700; color:#ffffff; text-decoration:none; padding:18px 48px; border-radius:8px; letter-spacing:0.5px;">
                        SCARICA LA TUA TESSERA
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

        </td>
      </tr>

      <!-- GOLD ACCENT LINE -->
      <tr>
        <td style="background-color:#d4a843; height:4px; font-size:0; line-height:0;">&nbsp;</td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background-color:#1a5632; padding:32px 40px; text-align:center;" class="mobile-padding">
          <p style="font-family:'Playfair Display', Georgia, serif; color:#ffffff; font-size:18px; font-weight:600; margin:0 0 4px 0;">
            Pugliesi nel Mondo UK
          </p>
          <p style="font-family:'Lato', Arial, sans-serif; color:#d4a843; font-size:11px; letter-spacing:2px; text-transform:uppercase; margin:0 0 20px 0;">
            Associazione No Profit
          </p>

          <p style="font-family:'Lato', Arial, sans-serif; color:#c8d6ce; font-size:13px; line-height:1.8; margin:0 0 16px 0;">
            <a href="mailto:info@pugliesinelmondouk.org" style="color:#d4a843; text-decoration:none;">info@pugliesinelmondouk.org</a><br>
            <a href="tel:+447903903651" style="color:#c8d6ce; text-decoration:none;">+44 7903 903651</a>
          </p>

          <p style="font-family:'Lato', Arial, sans-serif; color:#8faa97; font-size:12px; line-height:1.8; margin:0 0 8px 0;">
            <a href="*|UNSUB|*" style="color:#c8d6ce; text-decoration:underline;">Cancella iscrizione</a> &nbsp;|&nbsp;
            <a href="*|UPDATE_PROFILE|*" style="color:#c8d6ce; text-decoration:underline;">Aggiorna preferenze</a>
          </p>

          <p style="font-family:'Lato', Arial, sans-serif; color:#6b8f75; font-size:11px; line-height:1.6; margin:16px 0 0 0;">
            *|LIST:ADDRESSLINE|*
          </p>
          <p style="font-family:'Lato', Arial, sans-serif; color:#6b8f75; font-size:11px; line-height:1.6; margin:4px 0 0 0;">
            <a href="*|ABOUT_LIST|*" style="color:#6b8f75; text-decoration:underline;">Informazioni su questa lista</a>
          </p>
          <p style="font-family:'Lato', Arial, sans-serif; color:#6b8f75; font-size:11px; margin:8px 0 0 0;">
            *|REWARDS|*
          </p>
        </td>
      </tr>

    </table>
    <!--[if mso]>
    </td></tr></table>
    <![endif]-->
  </center>
</body>
</html>`;

    const updateRes = await fetch(`${mcUrl}/campaigns/${campaign.id}/content`, {
      method: 'PUT',
      headers: mcHeaders,
      body: JSON.stringify({ html }),
    });

    const result = await updateRes.json();

    return new Response(
      JSON.stringify({
        success: updateRes.ok,
        campaignId: campaign.id,
        webId: campaign.web_id,
        subject: campaign.settings?.subject_line,
        result,
      }),
      {
        status: updateRes.ok ? 200 : 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('Update campaign error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: err?.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
