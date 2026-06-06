/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["ui"],
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';

    return {
      /**
       * beforeFiles — run BEFORE the filesystem check.
       *
       * We explicitly list every NestJS backend auth route here so they
       * get proxied to port 3001.  Any /api/auth/* path that is NOT in
       * this list (e.g. /api/auth/session, /api/auth/_log, /api/auth/csrf,
       * /api/auth/callback/*, /api/auth/signin/*, /api/auth/signout,
       * /api/auth/error) will NOT match and will fall through to the
       * Next.js filesystem where NextAuth's [...nextauth]/route.ts handles it.
       *
       * This is the only reliable way to share /api/auth/* between
       * NextAuth (inside Next.js) and NestJS without them colliding.
       */
      beforeFiles: [
        { source: '/api/auth/login',                  destination: `${backendUrl}/api/auth/login` },
        { source: '/api/auth/register',               destination: `${backendUrl}/api/auth/register` },
        { source: '/api/auth/verify-email',           destination: `${backendUrl}/api/auth/verify-email` },
        { source: '/api/auth/reset-password-request', destination: `${backendUrl}/api/auth/reset-password-request` },
        { source: '/api/auth/reset-password',         destination: `${backendUrl}/api/auth/reset-password` },
        { source: '/api/auth/magic-link-request',     destination: `${backendUrl}/api/auth/magic-link-request` },
        { source: '/api/auth/magic-link-verify',      destination: `${backendUrl}/api/auth/magic-link-verify` },
        { source: '/api/auth/social-sync',            destination: `${backendUrl}/api/auth/social-sync` },
      ],

      /**
       * afterFiles — run AFTER the filesystem check.
       *
       * Proxies all other /api/* routes (billing, campaigns, workspaces,
       * analytics, team, etc.) to the NestJS backend.
       * /api/auth/* routes that weren't in beforeFiles will already have
       * been handled by NextAuth above and never reach here.
       */
      afterFiles: [
        { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
      ],

      fallback: [],
    };
  },
};

module.exports = nextConfig;