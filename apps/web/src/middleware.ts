/**
 * Next.js Middleware
 *
 * Handles authentication and authorization checks for protected routes.
 * This middleware runs on every request to verify user authentication via Cognito.
 * Supports mock auth bypass for testing (NEXT_PUBLIC_MOCK_AUTH=true)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Check if mock auth is enabled
const MOCK_AUTH_ENABLED = process.env.NEXT_PUBLIC_MOCK_AUTH === 'true';

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/signin', '/signup', '/forgot-password'];

// Route-to-role mapping for role-based access control
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/dashboard': ['ADMIN', 'DRAFTER', 'BIDDER', 'KB_ADMIN', 'KB_VIEW'],
  '/projects': ['ADMIN', 'DRAFTER', 'BIDDER', 'KB_ADMIN', 'KB_VIEW'],
  '/knowledge-bases': ['ADMIN', 'DRAFTER', 'BIDDER', 'KB_ADMIN', 'KB_VIEW'],
  '/users': ['ADMIN'],
  '/settings/agents': ['ADMIN'],
  '/settings/integrations': ['ADMIN'],
  '/settings/system': ['ADMIN', 'DRAFTER', 'BIDDER', 'KB_ADMIN', 'KB_VIEW'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Mock auth bypass - allow all requests when enabled
  if (MOCK_AUTH_ENABLED) {
    console.log('🔧 MOCK AUTH: Middleware bypassed for', pathname);
    return NextResponse.next();
  }
  
  // Check authentication
  const authToken = request.cookies.get('amplify-auth-token')?.value;
  
  if (!authToken) {
    // Redirect to signin if not authenticated
    const url = request.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }
  
  // Check role-based access
  try {
    // Get user roles from the auth token
    // In production, you'd decode the JWT token here
    // For now, we'll pass through and let the client-side handle role checks
    const userRoles = getUserRolesFromToken(authToken);
    
    // Find matching protected route
    const protectedRoute = Object.keys(PROTECTED_ROUTES).find(route =>
      pathname.startsWith(route)
    );
    
    if (protectedRoute) {
      const allowedRoles = PROTECTED_ROUTES[protectedRoute];
      const hasAccess = userRoles.some(role => allowedRoles.includes(role));
      
      if (!hasAccess) {
        // Redirect to dashboard if user doesn't have required role
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        url.searchParams.set('error', 'insufficient-permissions');
        return NextResponse.redirect(url);
      }
    }
  } catch (error) {
    console.error('Error checking user permissions:', error);
    // On error, allow through and let client-side handle it
  }
  
  return NextResponse.next();
}

/**
 * Extract user roles from auth token
 * In production, decode the JWT token properly
 */
function getUserRolesFromToken(token: string): string[] {
  try {
    // This is a simplified version
    // In production, use a JWT library to decode the token
    // and extract cognito:groups from the claims
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload['cognito:groups'] || [];
  } catch {
    return [];
  }
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