import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { amplifyConfig } from './amplify-config';
import { cookies } from 'next/headers';

/**
 * Server-side Amplify utilities for Next.js
 * 
 * Provides server-side context for Amplify operations
 * Used in API routes and server components
 */
export const { runWithAmplifyServerContext } = createServerRunner({
  config: amplifyConfig,
});

/**
 * Get Amplify server context for API routes
 * This is a helper to simplify server-side Amplify operations
 */
export async function getAmplifyServerContext() {
  return {
    token: {
      value: (await cookies()).toString(),
    },
  };
}
