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
      width: 680px;
      height: 400px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 15px 50px rgba(0,0,0,0.25);
      position: relative;
      background: #1a5632;
    }

    .card-bg {
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 280px;
      opacity: 1;
    }

    .card-bg img {
      width: 100%;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }

    .card-content {
      position: relative;
      z-index: 2;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 28px 30px 22px;
    }

    .card-header {
      margin-bottom: 20px;
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
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 18px;
      max-width: 340px;
    }

    .card-field-label {
      font-size: 8px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #a8c9b4;
      font-weight: 700;
    }

    .card-field-value {
      font-size: 20px;
      color: #3d2b1f;
      font-weight: 700;
      font-family: 'Playfair Display', serif;
      margin-top: 2px;
      text-shadow: 0 0 8px rgba(255,255,255,0.3);
    }

    .card-field-value.small {
      font-size: 14px;
      font-family: 'Lato', sans-serif;
      font-weight: 600;
      color: #5a4030;
    }

    .card-bottom {
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
      margin-top: 4px;
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
    <div class="card-bg">
      <img src="${heroUrl}" alt="Pugliesi nel Mondo UK" />
    </div>
    <div class="card-content">
      <div class="card-header">
        <div class="card-title">Pugliesi nel Mondo UK</div>
        <div class="card-subtitle">International Association of Apulians in the World</div>
        <div class="card-noprofit">No Profit Association</div>
      </div>

      <div class="card-fields">
        <div>
          <div class="card-field-label">Member</div>
          <div class="card-field-value">${name}</div>
        </div>
        <div>
          <div class="card-field-label">Membership</div>
          <div class="card-field-value small">${plan}</div>
        </div>
      </div>

      <div class="card-bottom">
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
