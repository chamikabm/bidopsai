/**
 * Error Monitoring API Route
 * Receives error reports from the client
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const error = await request.json();

    // In production, send to monitoring service (e.g., CloudWatch, Sentry)
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to CloudWatch Logs
      console.error('[Error Report]', JSON.stringify(error));
      
      // TODO: Integrate with actual monitoring service
      // await sendToCloudWatch(error);
      // await sendToSentry(error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to process error report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}

// Disable body size limit for error reports
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};
