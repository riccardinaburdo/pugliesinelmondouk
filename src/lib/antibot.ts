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
//  8. Requests from cloud/datacenter IP ranges (where bots run) are dropped.
//  9. Per-IP rate limit (best-effort, per server instance).

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

// Datacenter / cloud ranges (AWS, Google Cloud, Azure, DigitalOcean, OVH, Hetzner, Linode...).
// Real visitors browse from home/mobile connections; signup bots run on cloud servers.
const DATACENTER_CIDRS = [
  // AWS
  '3.0.0.0/8', '13.32.0.0/11', '15.152.0.0/13', '15.220.0.0/14', '16.0.0.0/8', '18.0.0.0/8', '23.20.0.0/14',
  '34.192.0.0/10', '35.71.64.0/18', '35.152.0.0/13', '44.192.0.0/10', '50.16.0.0/14', '50.112.0.0/16',
  '52.0.0.0/8', '54.0.0.0/8', '63.32.0.0/14', '67.202.0.0/18', '72.44.32.0/19', '75.101.128.0/17',
  '98.80.0.0/12', '99.77.0.0/16', '100.20.0.0/14', '100.24.0.0/13', '107.20.0.0/14', '174.129.0.0/16',
  '184.72.0.0/15', '184.169.128.0/17', '204.236.128.0/17',
  // Google Cloud
  '34.0.0.0/9', '34.128.0.0/10', '35.184.0.0/13', '35.192.0.0/11', '35.224.0.0/12', '104.154.0.0/15',
  '104.196.0.0/14', '107.178.192.0/18', '130.211.0.0/16', '146.148.0.0/17',
  // Microsoft Azure
  '4.144.0.0/12', '13.64.0.0/11', '20.0.0.0/8', '40.64.0.0/10', '51.104.0.0/14', '104.40.0.0/13',
  '137.116.0.0/15', '168.61.0.0/16', '191.232.0.0/13',
  // DigitalOcean
  '64.225.0.0/16', '68.183.0.0/16', '104.131.0.0/16', '128.199.0.0/16', '134.209.0.0/16', '138.68.0.0/16',
  '138.197.0.0/16', '139.59.0.0/16', '142.93.0.0/16', '143.110.0.0/16', '143.198.0.0/16', '146.190.0.0/16',
  '157.230.0.0/16', '157.245.0.0/16', '159.65.0.0/16', '159.89.0.0/16', '159.203.0.0/16', '161.35.0.0/16',
  '164.90.0.0/16', '164.92.0.0/16', '165.22.0.0/16', '165.227.0.0/16', '167.71.0.0/16', '167.99.0.0/16',
  '167.172.0.0/16', '174.138.0.0/17', '178.62.0.0/16', '188.166.0.0/16', '206.189.0.0/16', '209.97.128.0/18',
  // Linode / Akamai cloud, Vultr, Hetzner, OVH (server ranges)
  '45.33.0.0/17', '45.56.64.0/18', '45.79.0.0/16', '139.162.0.0/16', '172.104.0.0/15', '45.32.0.0/16',
  '45.63.0.0/17', '45.76.0.0/15', '108.61.0.0/16', '149.28.0.0/16', '5.9.0.0/16', '78.46.0.0/15',
  '88.198.0.0/16', '116.202.0.0/15', '135.181.0.0/16', '136.243.0.0/16', '138.201.0.0/16', '144.76.0.0/16',
  '148.251.0.0/16', '159.69.0.0/16', '162.55.0.0/16', '167.233.0.0/16', '168.119.0.0/16', '176.9.0.0/16',
  '178.63.0.0/16', '188.40.0.0/16', '195.201.0.0/16', '213.239.192.0/18', '51.38.0.0/16', '51.68.0.0/16',
  '51.75.0.0/16', '51.77.0.0/16', '51.79.0.0/16', '51.83.0.0/16', '51.89.0.0/16', '51.91.0.0/16',
  '51.161.0.0/16', '51.178.0.0/16', '51.195.0.0/16', '51.210.0.0/16', '54.36.0.0/14', '137.74.0.0/16',
  '141.94.0.0/15', '145.239.0.0/16', '147.135.0.0/16', '149.202.0.0/16', '151.80.0.0/16', '164.132.0.0/16',
  '176.31.0.0/16', '178.32.0.0/15', '188.165.0.0/16', '192.99.0.0/16', '198.27.64.0/18', '198.50.128.0/17',
];

function ipToInt(ip: string): number | null {
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(ip.replace(/^::ffff:/, ''));
  if (!m) return null;
  return ((+m[1] << 24) >>> 0) + (+m[2] << 16) + (+m[3] << 8) + +m[4];
}
const PARSED_CIDRS = DATACENTER_CIDRS.map((c) => {
  const [base, bits] = c.split('/');
  const mask = bits === '0' ? 0 : (~0 << (32 - Number(bits))) >>> 0;
  return { net: (ipToInt(base)! & mask) >>> 0, mask };
});
export function isDatacenterIp(ip: string): boolean {
  const n = ipToInt(ip);
  if (n === null) return false;
  return PARSED_CIDRS.some(({ net, mask }) => ((n & mask) >>> 0) === net);
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

  const ip = clientAddress || request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isDatacenterIp(ip)) return { ok: false, silent: true, reason: 'datacenter' };

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
  if (rateLimited(ip)) return { ok: false, silent: false, reason: 'rate' };

  if (looksLikeGibberish(body.fname || '') || looksLikeGibberish(body.lname || '')) {
    return { ok: false, silent: true, reason: 'gibberish' };
  }

  if (!EMAIL_RE.test(email) || !(await domainAcceptsMail(email))) {
    return { ok: false, silent: false, reason: 'email' };
  }

  return { ok: true };
}
