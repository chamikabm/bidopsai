import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/callback
 * 
 * OAuth callback handler for Google sign-in
 * Handles the redirect from Cognito after OAuth authentication
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // If there's an error from OAuth provider
  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    );
  }

  // If we have an authorization code, redirect to dashboard
  // The Amplify library will handle the token exchange automatically
  if (code) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // No code or error, redirect to auth page
  return NextResponse.redirect(new URL('/auth', request.url));
}
