export const prerender = false;

export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const name = url.searchParams.get('name') || 'Member Name';
  const memberNo = url.searchParams.get('id') || 'PNMUK-001';
  const plan = url.searchParams.get('plan') || 'Ordinary Member';
  const validUntil = url.searchParams.get('until') || '31/03/2027';

  const heroUrl = 'https://pugliesinelmondouk.org/images/general/hero.jpg';

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
      background: #f0ebe3;
      font-family: 'Lato', sans-serif;
    }

    .card {
      width: 600px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 15px 50px rgba(0,0,0,0.25);
      display: flex;
      flex-direction: column;
    }

    .card-image {
      width: 100%;
      height: 180px;
      overflow: hidden;
      border-bottom: 3px solid #d4a843;
    }

    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .card-body {
      background: #1a5632;
      padding: 24px 30px 20px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .card-header {
      text-align: center;
      padding-bottom: 14px;
      border-bottom: 1px solid rgba(212, 168, 67, 0.3);
    }

    .card-title {
      font-family: 'Playfair Display', serif;
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
    }

    .card-subtitle {
      color: #d4a843;
      font-size: 8px;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      margin-top: 4px;
      font-weight: 700;
    }

    .card-noprofit {
      color: rgba(255,255,255,0.4);
      font-size: 7px;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 3px;
    }

    .card-fields {
      display: flex;
      gap: 24px;
    }

    .card-field {
      flex: 1;
    }

    .card-field-label {
      font-size: 8px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #a8c9b4;
      font-weight: 700;
    }

    .card-field-value {
      font-size: 18px;
      color: #ffffff;
      font-weight: 700;
      font-family: 'Playfair Display', serif;
      margin-top: 3px;
    }

    .card-field-value.small {
      font-size: 13px;
      font-family: 'Lato', sans-serif;
      font-weight: 400;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: 14px;
      border-top: 1px solid rgba(212, 168, 67, 0.3);
    }

    .card-member-no {
      font-size: 12px;
      color: #d4a843;
      font-weight: 700;
      letter-spacing: 2px;
    }

    .card-website {
      font-size: 8px;
      color: rgba(255,255,255,0.35);
      letter-spacing: 1px;
    }

    .card-valid-label {
      font-size: 7px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #a8c9b4;
      font-weight: 700;
    }

    .card-valid-date {
      font-size: 14px;
      color: #ffffff;
      font-weight: 700;
      margin-top: 1px;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-image">
      <img src="${heroUrl}" alt="Pugliesi nel Mondo UK" />
    </div>

    <div class="card-body">
      <div class="card-header">
        <div class="card-title">Pugliesi nel Mondo UK</div>
        <div class="card-subtitle">International Association of Apulians in the World</div>
        <div class="card-noprofit">No Profit Association</div>
      </div>

      <div class="card-fields">
        <div class="card-field">
          <div class="card-field-label">Member</div>
          <div class="card-field-value">${name}</div>
        </div>
        <div class="card-field">
          <div class="card-field-label">Membership</div>
          <div class="card-field-value small">${plan}</div>
        </div>
      </div>

      <div class="card-footer">
        <div>
          <div class="card-member-no">${memberNo}</div>
          <div class="card-website">pugliesinelmondouk.org</div>
        </div>
        <div>
          <div class="card-valid-label">Valid until</div>
          <div class="card-valid-date">${validUntil}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
