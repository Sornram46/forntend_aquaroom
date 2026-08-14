import { NextRequest, NextResponse } from 'next/server';
import { apiGuard } from './lib/apiGuard';

export async function middleware(request: NextRequest) {
  const guardResponse = await apiGuard(request);
  if (guardResponse) {
    return guardResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/checkout/:path*'],
};
