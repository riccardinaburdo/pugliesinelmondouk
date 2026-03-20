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
  </style>
</head>
<body>
  <div class="card">
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
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
