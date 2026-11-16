// Server-side anti-bot protection for the signup forms (no third-party service).
//
// Layers, all checked on the server:
//  1. Origin check  – the request must come from the site itself (or a Vercel preview / localhost).
//  2. Signed token  – the form must first fetch /api/form-token; the token is HMAC-signed with a
//                     secret derived from MAILCHIMP_API_KEY, so it cannot be forged, and it expires.
//  3. Minimum time  – the form cannot be submitted less than MIN_AGE_MS after the token was issued.
//  4. Proof of work – the browser must find a nonce so that sha256(token|email|nonce) starts with
//                     POW_BITS zero bits. It costs a real browser ~1 s, and must be redone for every
//                     email address, which makes mass signups expensive.
//  5. Honeypot + gibberish-name check.
//  6. Email domain check – the domain must accept email (MX/A record).
//  7. Control question: "in which Italian region is Bari?" (answer: Puglia).
//  8. Per-IP rate limit (best-effort, per server instance).

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { resolveMx, resolve4 } from 'dns/promises';

export const POW_BITS = 15;
const MIN_AGE_MS = 3_000;
const MAX_AGE_MS = 2 * 60 * 60 * 1000;

const ALLOWED_HOSTS = [/^(www\.)?pugliesinelmondouk\.org$/, /^pugliesinelmondouk[a-z0-9-]*\.vercel\.app$/, /^localhost(:\d+)?$/, /^127\.0\.0\.1(:\d+)?$/];

function secret(): string {
  const explicit = (import.meta.env.ANTIBOT_SECRET || '').trim();
  const base = explicit || (import.meta.env.MAILCHIMP_API_KEY || '').trim();
  return createHash('sha256').update('pnmuk-antibot:' + base).digest('hex');
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('hex').slice(0, 32);
}

export function issueToken(): string {
  const payload = `${Date.now()}.${randomBytes(8).toString('hex')}`;
  return `${payload}.${sign(payload)}`;
}

function leadingZeroBits(buf: Buffer): number {
  let bits = 0;
  for (const byte of buf) {
    if (byte === 0) { bits += 8; continue; }
    return bits + Math.clz32(byte) - 24;
  }
  return bits;
}

function hostAllowed(value: string | null): boolean {
  if (!value) return false;
  try {
    const host = new URL(value).host.toLowerCase();
    return ALLOWED_HOSTS.some((re) => re.test(host));
  } catch {
    return false;
  }
}

const hits = new Map<string, number[]>();
function rateLimited(ip: string, max = 10, windowMs = 10 * 60 * 1000): boolean {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}

export function looksLikeGibberish(str: string): boolean {
  const s = (str || '').trim();
  if (s.length < 1 || s.length > 60) return true;
  if (/https?:|www\.|[<>{}\[\]\\/@#$%^*=_|~`0-9]/i.test(s)) return true;
  const noSpace = s.replace(/[\s'’.-]/g, '');
  if (noSpace.length > 20 && !/\s/.test(s)) return true;
  // Random strings like "xKqWzPtLmB": many capitals inside a single word
  const words = s.split(/[\s'’-]+/);
  for (const w of words) {
    const inner = w.slice(1);
    if (w.length > 5 && (inner.match(/[A-Z]/g) || []).length >= 2 && inner !== inner.toUpperCase()) return true;
    if (w.length > 6 && !/[aeiouyàèéìòù]/i.test(w)) return true;
  }
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

async function dnsWorks(): Promise<boolean> {
  try {
    const mx = await resolveMx('gmail.com');
    return mx.length > 0;
  } catch {
    return false;
  }
}

async function domainAcceptsMail(email: string): Promise<boolean> {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  const timeout = new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), 2500));
  try {
    const mx = await Promise.race([resolveMx(domain), timeout]);
    if (mx === 'timeout') return true; // don't block real users on slow DNS
    if (Array.isArray(mx) && mx.length > 0) return true;
  } catch (e: any) {
    if (e?.code !== 'ENODATA' && e?.code !== 'ENOTFOUND') return true;
    if (e?.code === 'ENOTFOUND') return !(await dnsWorks()); // only trust "not found" if DNS itself works
  }
  try {
    const a = await Promise.race([resolve4(domain), timeout]);
    return a === 'timeout' || (Array.isArray(a) && a.length > 0);
  } catch {
    return !(await dnsWorks());
  }
}

export type AntibotResult =
  | { ok: true }
  | { ok: false; silent: boolean; reason: string };

/**
 * silent=true  → pretend success (don't teach bots what tripped them)
 * silent=false → return an error the real user can see (e.g. expired page, invalid email)
 */
export async function checkSubmission(
  request: Request,
  body: { email?: string; fname?: string; lname?: string; website?: string; q?: string; _t?: string; _p?: string | number },
  clientAddress?: string
): Promise<AntibotResult> {
  if (!hostAllowed(request.headers.get('origin')) && !hostAllowed(request.headers.get('referer'))) {
    return { ok: false, silent: true, reason: 'origin' };
  }

  if (body.website) return { ok: false, silent: true, reason: 'honeypot' };

  const token = String(body._t || '');
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, silent: true, reason: 'token-missing' };
  const [ts, nonce, sig] = parts;
  const expected = sign(`${ts}.${nonce}`);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return { ok: false, silent: true, reason: 'token-forged' };
  }
  const age = Date.now() - Number(ts);
  if (!(age >= MIN_AGE_MS)) return { ok: false, silent: true, reason: 'too-fast' };
  if (age > MAX_AGE_MS) return { ok: false, silent: false, reason: 'expired' };

  const email = String(body.email || '').trim().toLowerCase();
  const work = createHash('sha256').update(`${token}|${email}|${body._p}`).digest();
  if (leadingZeroBits(work) < POW_BITS) return { ok: false, silent: true, reason: 'pow' };

  // Site-specific control question ("In which region is Bari?") that generic bots can't answer.
  const answer = String(body.q || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
  if (!['puglia', 'apulia', 'puglie', 'apulien', 'pouilles'].includes(answer)) {
    return { ok: false, silent: false, reason: 'question' };
  }

  // Only submissions that passed the token + proof-of-work count towards the limit.
  const ip = clientAddress || request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) return { ok: false, silent: false, reason: 'rate' };

  if (looksLikeGibberish(body.fname || '') || looksLikeGibberish(body.lname || '')) {
    return { ok: false, silent: true, reason: 'gibberish' };
  }

  if (!EMAIL_RE.test(email) || !(await domainAcceptsMail(email))) {
    return { ok: false, silent: false, reason: 'email' };
  }

  return { ok: true };
}
