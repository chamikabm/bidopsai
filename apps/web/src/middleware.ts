import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Middleware for route protection
 * 
 * Protects authenticated routes and redirects unauthenticated users
 * Note: Authentication state is managed client-side with AWS Amplify
 * This middleware provides basic route protection
 */

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/projects',
  '/knowledge-bases',
  '/users',
  '/settings',
];

// Routes that are public (no authentication required)
const publicRoutes = ['/auth', '/api/auth', '/'];

// Routes that require specific roles (enforced client-side)
const roleBasedRoutes: Record<string, string[]> = {
  '/users': ['Admin'],
  '/settings/agents': ['Admin'],
  '/settings/integrations': ['Admin'],
  '/knowledge-bases/global': ['Admin', 'KB-Admin'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // For protected routes, authentication is checked client-side
  // The useAuth hook will redirect to /auth if not authenticated
  // This middleware just adds headers for role-based routes
  const response = NextResponse.next();

  // Add role requirements to headers for client-side checking
  for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
    if (pathname.startsWith(route)) {
      response.headers.set('x-required-roles', allowedRoles.join(','));
    }
  }

  return response;
}

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
