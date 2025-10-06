import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';

/**
 * Main backend configuration for bidops.ai
 * 
 * This file defines the Amplify Gen 2 backend resources including:
 * - Authentication (Cognito)
 * - Future: Storage, API, Functions
 */
const backend = defineBackend({
  auth,
});

// Export backend for use in the application
export default backend;
