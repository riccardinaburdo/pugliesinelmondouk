export const prerender = false;

import { readFileSync } from 'fs';
import { join } from 'path';

function getHeroBase64(): string {
  try {
    // Try multiple paths for the hero image
    const paths = [
      join(process.cwd(), 'public', 'images', 'general', 'hero.jpg'),
      join(process.cwd(), 'dist', 'client', 'images', 'general', 'hero.jpg'),
    ];
    for (const p of paths) {
      try {
        const buf = readFileSync(p);
        return `data:image/jpeg;base64,${buf.toString('base64')}`;
      } catch { continue; }
    }
  } catch {}
  // Fallback to URL if file not found
  return 'https://pugliesinelmondouk.org/images/general/hero.jpg';
}

export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const name = url.searchParams.get('name') || 'Member Name';
  const memberNo = url.searchParams.get('id') || 'PNMUK-001';
  const plan = url.searchParams.get('plan') || 'Ordinary Member';
  const validUntil = url.searchParams.get('until') || '31/03/2027';

  const heroUrl = getHeroBase64();

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Lato:wght@400;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #e8e0d4;
      font-family: 'Lato', sans-serif;
    }

    .card {
      width: 340px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0,0,0,0.25);
      display: flex;
      flex-direction: column;
    }

    /* Top: image + association name */
    .card-top {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .card-top img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .card-top-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(rgba(250, 245, 235, 0.85), transparent);
      padding: 14px 20px 30px;
      text-align: center;
    }

    .card-assoc-name {
      font-family: 'Playfair Display', serif;
      color: #3d2b1f;
      font-size: 18px;
      font-weight: 700;
    }

    .card-assoc-sub {
      color: #6b4c3b;
      font-size: 7px;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 3px;
      font-weight: 700;
    }

    /* Bottom: member data */
    .card-bottom {
      background: #1a5632;
      padding: 22px 22px 18px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .card-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .card-field {
      flex: 1;
    }

    .card-field-label {
      font-size: 8px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #a8c9b4;
      font-weight: 700;
    }

    .card-field-value {
      font-size: 17px;
      color: #ffffff;
      font-weight: 700;
      font-family: 'Playfair Display', serif;
      margin-top: 3px;
    }

    .card-field-value.small {
      font-size: 13px;
      font-family: 'Lato', sans-serif;
      font-weight: 600;
      color: #dce8e0;
    }

    .card-divider {
      height: 1px;
      background: rgba(212, 168, 67, 0.3);
    }

    .card-footer-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .card-member-no {
      font-size: 11px;
      color: #d4a843;
      font-weight: 700;
      letter-spacing: 2px;
    }

    .card-website {
      font-size: 7px;
      color: rgba(255,255,255,0.35);
      letter-spacing: 1px;
      margin-top: 3px;
    }

    .card-valid-label {
      font-size: 7px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #a8c9b4;
      font-weight: 700;
      text-align: right;
    }

    .card-valid-date {
      font-size: 14px;
      color: #ffffff;
      font-weight: 700;
      margin-top: 2px;
      text-align: right;
    }

    .page-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      padding: 40px 20px;
    }

    .download-btn {
      display: inline-block;
      background: #1a5632;
      color: #fff;
      font-family: 'Lato', sans-serif;
      font-size: 15px;
      font-weight: 700;
      padding: 14px 36px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      letter-spacing: 1px;
      text-transform: uppercase;
      transition: background 0.2s;
    }

    .download-btn:hover {
      background: #2a7a4a;
    }

    .download-btn:disabled {
      background: #999;
      cursor: wait;
    }

    .page-title {
      font-family: 'Playfair Display', serif;
      color: #3d2b1f;
      font-size: 22px;
      text-align: center;
    }

    .page-subtitle {
      color: #6b6b6b;
      font-size: 14px;
      text-align: center;
      max-width: 400px;
    }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"><\/script>
  <script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js"><\/script>
</head>
<body>
  <div class="page-wrapper">
  <div class="page-title">La tua Tessera Associativa</div>
  <div class="page-subtitle">Clicca il pulsante per scaricare la tua tessera in formato PDF</div>
  <div class="card" id="membership-card">
    <div class="card-top">
      <img src="${heroUrl}" alt="Pugliesi nel Mondo UK" />
      <div class="card-top-overlay">
        <div class="card-assoc-name">Pugliesi nel Mondo UK</div>
        <div class="card-assoc-sub">Association of Apulians in the World</div>
      </div>
    </div>

    <div class="card-bottom">
      <div>
        <div class="card-field-label">Member</div>
        <div class="card-field-value">${name}</div>
      </div>

      <div class="card-row">
        <div class="card-field">
          <div class="card-field-label">Membership</div>
          <div class="card-field-value small">${plan}</div>
        </div>
        <div>
          <div class="card-valid-label">Valid until</div>
          <div class="card-valid-date">${validUntil}</div>
        </div>
      </div>

      <div class="card-divider"></div>

      <div class="card-footer-row">
        <div>
          <div class="card-member-no">${memberNo}</div>
          <div class="card-website">pugliesinelmondouk.org</div>
        </div>
      </div>
    </div>
  </div>
  <button class="download-btn" id="download-btn" onclick="downloadPDF()">Scarica Tessera PDF</button>
  </div>

  <script>
    async function downloadPDF() {
      const btn = document.getElementById('download-btn');
      btn.disabled = true;
      btn.textContent = 'Generazione in corso...';

      try {
        const card = document.getElementById('membership-card');
        const canvas = await html2canvas(card, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
        });

        const { jsPDF } = window.jspdf;
        const imgWidth = 90;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [imgWidth + 10, imgHeight + 10],
        });

        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 5, 5, imgWidth, imgHeight);
        pdf.save('tessera-pnmuk.pdf');
      } catch (err) {
        console.error('PDF generation error:', err);
        alert('Errore nella generazione del PDF. Riprova.');
      }

      btn.disabled = false;
      btn.textContent = 'Scarica Tessera PDF';
    }
  <\/script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
