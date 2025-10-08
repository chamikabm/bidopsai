/**
 * Next.js Middleware for Authentication and Route Protection
 * 
 * This middleware runs on every request to protect routes based on
 * authentication status and user roles.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public routes that don't require authentication
 */
const publicRoutes = [
  '/',
  '/signin',
  '/signup',
  '/reset-password',
  '/confirm-signup',
];

/**
 * Routes that should redirect to dashboard if user is already authenticated
 */
const authRoutes = ['/signin', '/signup', '/reset-password'];

/**
 * API routes that don't require authentication
 */
const publicApiRoutes = [
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/signout',
  '/api/health',
];

/**
 * Check if route is public
 */
function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Check if route is an auth route
 */
function isAuthRoute(pathname: string): boolean {
  return authRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Check if API route is public
 */
function isPublicApiRoute(pathname: string): boolean {
  return publicApiRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Get authentication token from cookies
 */
function getAuthToken(request: NextRequest): string | null {
  // Check for various Amplify auth cookies
  const idToken = request.cookies.get('CognitoIdentityServiceProvider.idToken')?.value;
  const accessToken = request.cookies.get('CognitoIdentityServiceProvider.accessToken')?.value;
  
  return idToken || accessToken || null;
}

/**
 * Check if user is authenticated based on cookies
 * Note: This is a simple check. For production, you might want to verify the token.
 */
function isAuthenticated(request: NextRequest): boolean {
  const token = getAuthToken(request);
  return !!token;
}

/**
 * Middleware function
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }
  
  const isPublic = isPublicRoute(pathname);
  const isPublicApi = isPublicApiRoute(pathname);
  const isAuth = isAuthRoute(pathname);
  const authenticated = isAuthenticated(request);
  
  // Allow public API routes
  if (isPublicApi) {
    return NextResponse.next();
  }
  
  // Redirect authenticated users away from auth pages
  if (isAuth && authenticated) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }
  
  // Allow public routes
  if (isPublic) {
    return NextResponse.next();
  }
  
  // Redirect unauthenticated users to signin
  if (!authenticated) {
    const signinUrl = new URL('/signin', request.url);
    signinUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signinUrl);
  }
  
  // For authenticated users, add auth headers to API requests
  if (pathname.startsWith('/api/')) {
    const token = getAuthToken(request);
    const requestHeaders = new Headers(request.headers);
    
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`);
    }
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  // Allow authenticated users to access protected routes
  return NextResponse.next();
}

/**
 * Middleware configuration
 * Specify which routes should run through middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};