// Browser side of the anti-bot check: fetches a signed token from the server and solves
// a small proof-of-work bound to the email address. Exposed as window.pnmukAntibot.solve(email).

let tokenPromise: Promise<{ token: string; bits: number }> | null = null;
let tokenFetchedAt = 0;

function getToken() {
  // Tokens last 2 hours on the server; refresh after 90 minutes.
  if (!tokenPromise || Date.now() - tokenFetchedAt > 90 * 60 * 1000) {
    tokenFetchedAt = Date.now();
    tokenPromise = fetch('/api/form-token', { cache: 'no-store' }).then((r) => {
      if (!r.ok) throw new Error('token');
      return r.json();
    });
    tokenPromise.catch(() => { tokenPromise = null; });
  }
  return tokenPromise;
}

function leadingZeroBits(bytes: Uint8Array): number {
  let bits = 0;
  for (const b of bytes) {
    if (b === 0) { bits += 8; continue; }
    return bits + Math.clz32(b) - 24;
  }
  return bits;
}

async function solve(email: string): Promise<{ _t: string; _p: number }> {
  const { token, bits } = await getToken();
  // The server rejects submissions made within 3 seconds of the token being issued.
  const wait = 3200 - (Date.now() - Number(token.split('.')[0]));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  const enc = new TextEncoder();
  const prefix = `${token}|${email.trim().toLowerCase()}|`;
  for (let n = 0; ; n++) {
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(prefix + n)));
    if (leadingZeroBits(digest) >= bits) return { _t: token, _p: n };
  }
}

declare global {
  interface Window { pnmukAntibot: { solve: typeof solve; prefetch: () => void } }
}

window.pnmukAntibot = { solve, prefetch: () => { getToken().catch(() => {}); } };

// Fetch the token as soon as someone starts interacting with any form on the page.
document.addEventListener('focusin', (e) => {
  const t = e.target as HTMLElement;
  if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) window.pnmukAntibot.prefetch();
}, { passive: true });
