/**
 * Script per creare il template Mailchimp del reminder pagamento.
 * Esegui con: node scripts/create-reminder-template.mjs
 * Richiede MAILCHIMP_API_KEY nel file .env.local
 */

import fs from 'node:fs';
import path from 'node:path';

// Leggi .env.local
// Prova .env.local poi .env.production
let API_KEY;
for (const file of ['.env.local', '.env.production']) {
  try {
    const env = fs.readFileSync(path.join(process.cwd(), file), 'utf-8');
    const match = env.match(/MAILCHIMP_API_KEY="?([^"\n]+)"?/);
    if (match) { API_KEY = match[1].trim().replace(/\\n$/, ''); break; }
  } catch {}
}

if (!API_KEY) {
  console.error('MAILCHIMP_API_KEY non trovata in .env.local');
  process.exit(1);
}

const SERVER = 'us22';
const BASE_URL = `https://${SERVER}.api.mailchimp.com/3.0`;
const CONFIRM_URL = 'https://pugliesinelmondouk.org/api/confirm-payment?token=*|CONFTOKEN|*';

const html = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Completa la tua iscrizione / Complete your membership</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:20px;">

  <!-- Header -->
  <div style="background:#1a5632;border-radius:12px 12px 0 0;padding:30px;text-align:center;">
    <h1 style="color:#ffffff;font-family:Georgia,serif;font-size:22px;margin:0 0 6px 0;">Pugliesi nel Mondo UK</h1>
    <p style="color:#d4a843;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0;">Associazione No Profit</p>
  </div>

  <!-- Body IT -->
  <div style="background:#ffffff;padding:35px 30px;">
    <h2 style="color:#1a5632;font-family:Georgia,serif;font-size:20px;margin:0 0 15px 0;">Ciao *|FNAME|*,</h2>
    <p style="color:#444;font-size:15px;line-height:1.7;margin:0 0 15px 0;">
      Abbiamo notato che la tua iscrizione a <strong>Pugliesi nel Mondo UK</strong> è ancora in sospeso — il pagamento non risulta ancora confermato.
    </p>
    <p style="color:#444;font-size:15px;line-height:1.7;margin:0 0 6px 0;">Può succedere per diversi motivi:</p>
    <ul style="color:#444;font-size:15px;line-height:1.9;margin:0 0 20px 0;padding-left:20px;">
      <li>📧 <strong>L'email con i dati bancari è finita nello spam</strong> — se è così, eccoli di nuovo qui sotto</li>
      <li>💸 <strong>Hai già effettuato il bonifico</strong> ma non hai ancora cliccato il pulsante "Ho effettuato il pagamento" — lo trovi in fondo a questa email</li>
      <li>❓ <strong>Non hai ancora avuto modo di fare il bonifico</strong> — nessun problema, ci siamo ancora!</li>
    </ul>

    <!-- Bank details IT -->
    <div style="background:#f9f7f3;border:1px solid #e8e0d4;border-radius:8px;padding:20px;margin:0 0 20px 0;">
      <h3 style="color:#1a5632;font-size:16px;margin:0 0 12px 0;">Dati per il bonifico</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:7px 10px;border-bottom:1px solid #e8e0d4;color:#888;width:40%;">Intestatario</td><td style="padding:7px 10px;border-bottom:1px solid #e8e0d4;font-weight:bold;color:#333;">Anna Quaranta</td></tr>
        <tr><td style="padding:7px 10px;border-bottom:1px solid #e8e0d4;color:#888;">Sort Code</td><td style="padding:7px 10px;border-bottom:1px solid #e8e0d4;font-weight:bold;color:#333;">04-00-75</td></tr>
        <tr><td style="padding:7px 10px;border-bottom:1px solid #e8e0d4;color:#888;">Account Number</td><td style="padding:7px 10px;border-bottom:1px solid #e8e0d4;font-weight:bold;color:#333;">00731463</td></tr>
        <tr><td style="padding:7px 10px;color:#888;">Causale</td><td style="padding:7px 10px;font-weight:bold;color:#333;">Iscrizione *|FNAME|* *|LNAME|* – *|MEMNUMBER|*</td></tr>
      </table>
    </div>

    <p style="color:#444;font-size:14px;margin:0 0 5px 0;"><strong>Piano scelto:</strong> *|PIANO|*</p>
    <p style="color:#444;font-size:14px;margin:0 0 20px 0;">Una volta ricevuto il pagamento, ti invieremo la tua <strong>tessera digitale</strong> con il numero <strong>*|MEMNUMBER|*</strong>.</p>

    <!-- CTA IT -->
    <div style="background:#fff8e8;border:1px solid #d4a843;border-radius:8px;padding:20px;margin:0 0 20px 0;text-align:center;">
      <p style="color:#444;font-size:14px;margin:0 0 15px 0;"><strong>Hai già fatto il bonifico?</strong><br>Ti chiediamo di non saltare questo passaggio: è fondamentale per notificare l'associazione e ricevere la tua tessera.</p>
      <a href="${CONFIRM_URL}" style="display:inline-block;background:#c8102e;color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:6px;">Ho effettuato il pagamento</a>
    </div>

    <p style="color:#888;font-size:13px;margin:0 0 30px 0;">Per qualsiasi domanda scrivici a <a href="mailto:info@pugliesinelmondouk.org" style="color:#1a5632;">info@pugliesinelmondouk.org</a></p>

    <!-- Divider -->
    <hr style="border:none;border-top:2px dashed #e8e0d4;margin:30px 0;">

    <!-- Body EN -->
    <h2 style="color:#1a5632;font-family:Georgia,serif;font-size:20px;margin:0 0 15px 0;">Hi *|FNAME|*,</h2>
    <p style="color:#444;font-size:15px;line-height:1.7;margin:0 0 15px 0;">
      We noticed that your <strong>Pugliesi nel Mondo UK</strong> membership is still pending — your payment has not yet been confirmed.
    </p>
    <p style="color:#444;font-size:15px;line-height:1.7;margin:0 0 6px 0;">This can happen for a few reasons:</p>
    <ul style="color:#444;font-size:15px;line-height:1.9;margin:0 0 20px 0;padding-left:20px;">
      <li>📧 <strong>Our email with the bank details ended up in your spam folder</strong> — if so, you'll find them again below</li>
      <li>💸 <strong>You've already made the bank transfer</strong> but haven't yet clicked "I have made the payment" — you'll find the button at the bottom of this email</li>
      <li>❓ <strong>You haven't had a chance to make the transfer yet</strong> — no problem, we're still here!</li>
    </ul>

    <!-- Bank details EN -->
    <div style="background:#f9f7f3;border:1px solid #e8e0d4;border-radius:8px;padding:20px;margin:0 0 20px 0;">
      <h3 style="color:#1a5632;font-size:16px;margin:0 0 12px 0;">Bank transfer details</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:7px 10px;border-bottom:1px solid #e8e0d4;color:#888;width:40%;">Account name</td><td style="padding:7px 10px;border-bottom:1px solid #e8e0d4;font-weight:bold;color:#333;">Anna Quaranta</td></tr>
        <tr><td style="padding:7px 10px;border-bottom:1px solid #e8e0d4;color:#888;">Sort Code</td><td style="padding:7px 10px;border-bottom:1px solid #e8e0d4;font-weight:bold;color:#333;">04-00-75</td></tr>
        <tr><td style="padding:7px 10px;border-bottom:1px solid #e8e0d4;color:#888;">Account Number</td><td style="padding:7px 10px;border-bottom:1px solid #e8e0d4;font-weight:bold;color:#333;">00731463</td></tr>
        <tr><td style="padding:7px 10px;color:#888;">Reference</td><td style="padding:7px 10px;font-weight:bold;color:#333;">Membership *|FNAME|* *|LNAME|* – *|MEMNUMBER|*</td></tr>
      </table>
    </div>

    <p style="color:#444;font-size:14px;margin:0 0 5px 0;"><strong>Selected plan:</strong> *|PIANO|*</p>
    <p style="color:#444;font-size:14px;margin:0 0 20px 0;">Once your payment is received, we will send you your <strong>digital membership card</strong> with your number <strong>*|MEMNUMBER|*</strong>.</p>

    <!-- CTA EN -->
    <div style="background:#fff8e8;border:1px solid #d4a843;border-radius:8px;padding:20px;margin:0 0 20px 0;text-align:center;">
      <p style="color:#444;font-size:14px;margin:0 0 15px 0;"><strong>Already made the transfer?</strong><br>Please don't skip this step — it's essential to notify the association and receive your membership card.</p>
      <a href="${CONFIRM_URL}" style="display:inline-block;background:#c8102e;color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:14px 28px;border-radius:6px;">I have made the payment</a>
    </div>

    <p style="color:#888;font-size:13px;margin:0;">For any questions, write to us at <a href="mailto:info@pugliesinelmondouk.org" style="color:#1a5632;">info@pugliesinelmondouk.org</a></p>
  </div>

  <!-- Footer -->
  <div style="background:#1a5632;border-radius:0 0 12px 12px;padding:20px;text-align:center;">
    <p style="color:#d4a843;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px 0;">Pugliesi nel Mondo UK</p>
    <p style="color:#ffffff;font-size:12px;margin:0;">
      <a href="https://pugliesinelmondouk.org" style="color:#d4a843;text-decoration:none;">pugliesinelmondouk.org</a>
    </p>
  </div>

</div>
</body>
</html>`;

// Create or update the Mailchimp template
async function createTemplate() {
  console.log('Creazione template Mailchimp...');

  const res = await fetch(`${BASE_URL}/templates`, {
    method: 'POST',
    headers: {
      Authorization: `apikey ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Reminder Pagamento IT+EN',
      html,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('Errore:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log(`✅ Template creato con ID: ${data.id}`);
  console.log(`   Nome: ${data.name}`);
  console.log('');
  console.log('Prossimo passo: configura l\'automazione Customer Journey in Mailchimp');
  console.log(`  - Trigger: tag "In attesa di pagamento" applicato da almeno 3 giorni`);
  console.log(`  - Azione: invia email con template ID ${data.id}`);
  console.log(`  - (opzionale) Secondo reminder dopo 7 giorni se ancora "In attesa di pagamento"`);
}

createTemplate();
