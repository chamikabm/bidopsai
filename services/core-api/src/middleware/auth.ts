/**
 * Authentication Middleware
 * 
 * Validates AWS Cognito JWT tokens and attaches user info to request.
 * Uses aws-jwt-verify for fast (<50ms) token validation.
 */

import { Request, Response, NextFunction } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { createLogger } from '../utils/logger';
import { AuthenticationError, ErrorCode } from '../utils/errors';

const logger = createLogger('AuthMiddleware');

/**
 * JWT payload from Cognito
 */
interface CognitoJwtPayload {
  sub: string; // Cognito User ID
  email: string;
  'cognito:username': string;
  'cognito:groups'?: string[];
  exp: number;
  iat: number;
}

/**
 * Create JWT verifier instance (cached for performance)
 */
const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: env.AWS_COGNITO_USER_POOL_ID,
  tokenUse: 'access',
  clientId: null, // Accept any client
});

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Fetch user from database with roles and permissions
 */
async function fetchUserWithPermissions(
  prisma: PrismaClient,
  cognitoUserId: string
) {
  const user = await prisma.user.findUnique({
    where: { cognitoUserId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new AuthenticationError(
      'User not found in database',
      ErrorCode.AUTH_TOKEN_INVALID
    );
  }

  // Extract roles and permissions
  const roles = user.roles.map((ur) => ur.role.name);
  const permissions = user.roles.flatMap((ur) =>
    ur.role.permissions.map((p) => `${p.resource}:${p.action}`)
  );

  return {
    id: user.id,
    email: user.email,
    cognitoUserId: user.cognitoUserId,
    roles,
    permissions,
  };
}

/**
 * Authentication middleware
 * 
 * Validates JWT token and attaches user to request.
 * Throws AuthenticationError if token is invalid or expired.
 * 
 * @param prisma - Prisma client instance
 * @returns Express middleware function
 */
export function authMiddleware(prisma: PrismaClient) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = extractToken(req);

      // No token provided - continue without auth (optional auth)
      if (!token) {
        logger.debug('No authentication token provided');
        return next();
      }

      // Verify JWT token
      const startTime = Date.now();
      const payload = await jwtVerifier.verify(token) as unknown as CognitoJwtPayload;
      const verifyDuration = Date.now() - startTime;

      logger.debug('JWT verification successful', {
        cognitoUserId: payload.sub,
        duration: `${verifyDuration}ms`,
      });

      // Fetch user from database with permissions
      const user = await fetchUserWithPermissions(prisma, payload.sub);

      // Attach user to request
      (req as any).user = user;

      logger.info('User authenticated', {
        userId: user.id,
        email: user.email,
        roles: user.roles,
      });

      next();
    } catch (error: any) {
      // JWT verification failed
      if (error.name === 'JwtExpiredError') {
        logger.warn('JWT token expired', { error: error.message });
        return next(
          new AuthenticationError(
            'Token has expired',
            ErrorCode.AUTH_TOKEN_EXPIRED
          )
        );
      }

      if (error.name === 'JwtInvalidClaimError' || error.name === 'JwtParseError') {
        logger.warn('JWT token invalid', { error: error.message });
        return next(
          new AuthenticationError(
            'Invalid token',
            ErrorCode.AUTH_TOKEN_INVALID
          )
        );
      }

      // Database or other errors
      if (error instanceof AuthenticationError) {
        return next(error);
      }

      logger.error('Authentication error', { error: error.message });
      return next(
        new AuthenticationError(
          'Authentication failed',
          ErrorCode.AUTH_TOKEN_INVALID
        )
      );
    }
  };
}

/**
 * Require authentication middleware
 * 
 * Ensures user is authenticated before proceeding.
 * Should be used after authMiddleware.
 */
export function requireAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = (req as any).user;

  if (!user) {
    return next(
      new AuthenticationError(
        'Authentication required',
        ErrorCode.AUTH_TOKEN_MISSING
      )
    );
  }

  next();
}

/**
 * Require specific role middleware
 * 
 * @param role - Required role name
 */
export function requireRoleMiddleware(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return next(
        new AuthenticationError(
          'Authentication required',
          ErrorCode.AUTH_TOKEN_MISSING
        )
      );
    }

    if (!user.roles.includes(role)) {
      return next(
        new AuthenticationError(
          `Required role: ${role}`,
          ErrorCode.AUTH_FORBIDDEN
        )
      );
    }

    next();
  };
}

/**
 * Require specific permission middleware
 * 
 * @param resource - Resource name
 * @param action - Action name
 */
export function requirePermissionMiddleware(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return next(
        new AuthenticationError(
          'Authentication required',
          ErrorCode.AUTH_TOKEN_MISSING
        )
      );
    }

    const requiredPermission = `${resource}:${action}`;
    if (!user.permissions.includes(requiredPermission)) {
      return next(
        new AuthenticationError(
          `Required permission: ${requiredPermission}`,
          ErrorCode.AUTH_FORBIDDEN
        )
      );
    }

    next();
  };
}