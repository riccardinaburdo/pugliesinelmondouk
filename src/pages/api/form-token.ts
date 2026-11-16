export const prerender = false;

import { issueToken, POW_BITS } from '../../lib/antibot';

export async function GET() {
  return new Response(JSON.stringify({ token: issueToken(), bits: POW_BITS }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
