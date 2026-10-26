import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const requestIdPattern = /^[A-Za-z0-9._:-]{8,100}$/;

export function middleware(request: NextRequest) {
  const incoming = request.headers.get('x-request-id');
  const requestId = incoming && requestIdPattern.test(incoming) ? incoming : crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set('x-request-id', requestId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });

  response.headers.set('x-request-id', requestId);

  return response;
}

export const config = {
  matcher: ['/api/:path*']
};
