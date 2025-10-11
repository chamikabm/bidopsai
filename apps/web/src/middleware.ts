/**
 * Next.js Middleware
 *
 * IMPORTANT: Amplify v6 stores auth tokens in localStorage, not HTTP cookies.
 * This means server-side middleware cannot detect authentication state.
 *
 * Authentication and authorization are handled CLIENT-SIDE using:
 * - useAuth hook to check authentication
 * - ProtectedRoute components for route guarding
 * - Layout components that redirect unauthenticated users
 *
 * This middleware is minimal and only handles:
 * - Redirecting authenticated users away from auth pages
 * - Basic route organization
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // All other routes pass through - auth is handled client-side
  return NextResponse.next();
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};