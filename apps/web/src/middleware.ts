import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. all root files inside /public (e.g. favicon.ico)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || 'localhost:3000';

  const currentHost =
    process.env.NODE_ENV === 'production' && process.env.VERCEL === '1'
      ? hostname.replace(`.revenuepilot.com`, '')
      : hostname.replace(`.localhost:3000`, '');

  // If it's the root domain (or localhost), just continue to the normal path
  if (
    hostname === 'localhost:3000' ||
    hostname === 'revenuepilot.com' ||
    hostname === 'www.revenuepilot.com' ||
    hostname === 'revenuepilot.in' ||
    hostname === 'www.revenuepilot.in' ||
    hostname.startsWith('187.127.173.247') ||
    hostname.startsWith('0.0.0.0') ||
    hostname.startsWith('127.0.0.1')
  ) {
    return NextResponse.next();
  }

  // Otherwise it's a custom domain or a subdomain (e.g., agency.revenuepilot.com)
  // Rewrite the request to a special dynamic route /_tenant/[domain]/path
  return NextResponse.rewrite(new URL(`/_tenant/${currentHost}${url.pathname}${url.search}`, req.url));
}
