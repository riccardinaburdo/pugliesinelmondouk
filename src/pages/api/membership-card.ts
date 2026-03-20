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
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: url('${heroUrl}') center center / cover;
      opacity: 0.45;
    }

    .card-content {
      position: relative;
      z-index: 2;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 0;
    }

    .card-header {
      background: rgba(26, 86, 50, 0.95);
      padding: 24px 32px 16px;
      border-bottom: 3px solid #d4a843;
    }

    .card-title {
      font-family: 'Playfair Display', serif;
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .card-subtitle {
      color: #d4a843;
      font-size: 10px;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-top: 4px;
      font-weight: 700;
    }

    .card-body {
      flex: 1;
      display: flex;
      padding: 28px 32px;
      gap: 24px;
    }

    .card-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 16px;
    }

    .card-field-label {
      font-size: 9px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #a8c9b4;
      font-weight: 700;
    }

    .card-field-value {
      font-size: 20px;
      color: #ffffff;
      font-weight: 700;
      font-family: 'Playfair Display', serif;
      margin-top: 2px;
    }

    .card-field-value.small {
      font-size: 14px;
      font-family: 'Lato', sans-serif;
    }

    .card-details {
      display: flex;
      gap: 32px;
    }

    .card-footer {
      background: rgba(26, 86, 50, 0.95);
      padding: 14px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid rgba(212, 168, 67, 0.3);
    }

    .card-member-no {
      font-size: 13px;
      color: #d4a843;
      font-weight: 700;
      letter-spacing: 2px;
    }

    .card-valid {
      text-align: right;
    }

    .card-valid-label {
      font-size: 8px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #a8c9b4;
      font-weight: 700;
    }

    .card-valid-date {
      font-size: 15px;
      color: #ffffff;
      font-weight: 700;
      margin-top: 1px;
    }

    .card-website {
      font-size: 10px;
      color: rgba(255,255,255,0.5);
      letter-spacing: 1px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="card-bg"></div>
    <div class="card-content">
      <div class="card-header">
        <div class="card-title">Pugliesi nel Mondo UK</div>
        <div class="card-subtitle">International Association of Apulians in the World</div>
      </div>

      <div class="card-body">
        <div class="card-info">
          <div>
            <div class="card-field-label">Member</div>
            <div class="card-field-value">${name}</div>
          </div>
          <div>
            <div class="card-field-label">Membership</div>
            <div class="card-field-value small">${plan}</div>
          </div>
        </div>
      </div>

      <div class="card-footer">
        <div class="card-member-no">${memberNo}</div>
        <div class="card-website">pugliesinelmondouk.org</div>
        <div class="card-valid">
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
