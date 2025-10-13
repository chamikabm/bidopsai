import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the correct file
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()).default('4000'),

  // Database
  DATABASE_URL: z.string().url(),

  // AWS Configuration
  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_COGNITO_USER_POOL_ID: z.string().min(1),
  AWS_COGNITO_CLIENT_ID: z.string().min(1),
  
  // S3 Buckets (from CDK S3SourceBucketStack)
  AWS_S3_PROJECT_DOCUMENTS_BUCKET: z.string().min(1),
  AWS_S3_ARTIFACTS_BUCKET: z.string().min(1),
  AWS_S3_REGION: z.string().min(1),
  
  // JWT Configuration
  JWT_ISSUER: z.string().url(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Redis (Optional)
  REDIS_URL: z.string().url().optional(),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().int().positive()).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().int().positive()).default('100'),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => err.path.join('.')).join(', ');
      throw new Error(
        `Missing or invalid environment variables: ${missingVars}\n` +
        'Please check your .env file against .env.example'
      );
    }
    throw error;
  }
}

export const env = validateEnv();

// Export for convenience
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';