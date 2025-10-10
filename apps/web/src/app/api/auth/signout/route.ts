import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/signout
 * 
 * Placeholder for sign out - actual sign out happens client-side
 * This endpoint can be used for additional server-side cleanup or logging
 */
export async function POST(_request: NextRequest) {
  try {
    // Sign out is handled client-side with AWS Amplify
    // This endpoint can be extended for server-side session cleanup, logging, etc.
    return NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (error: any) {
    console.error('Sign out error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to sign out',
        code: error.name,
      },
      { status: 500 }
    );
  }
}
