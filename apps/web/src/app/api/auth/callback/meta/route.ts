import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (code) {
    return NextResponse.redirect(new URL(`/onboarding?metaCode=${code}`, request.url));
  }
  return NextResponse.redirect(new URL('/onboarding', request.url));
}
