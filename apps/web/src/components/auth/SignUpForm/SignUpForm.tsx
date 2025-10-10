'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signUp, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GoogleSignIn } from '../SocialAuth/GoogleSignIn';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z.string(),
  givenName: z.string().min(1, 'First name is required'),
  familyName: z.string().min(1, 'Last name is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

const verifyCodeSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

type VerifyCodeFormData = z.infer<typeof verifyCodeSchema>;

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
}

export function SignUpForm({ onSuccess, onSwitchToSignIn }: SignUpFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [username, setUsername] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const {
    register: registerVerify,
    handleSubmit: handleSubmitVerify,
    formState: { errors: verifyErrors },
  } = useForm<VerifyCodeFormData>({
    resolver: zodResolver(verifyCodeSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { isSignUpComplete, nextStep } = await signUp({
        username: data.username,
        password: data.password,
        options: {
          userAttributes: {
            email: data.email,
            given_name: data.givenName,
            family_name: data.familyName,
          },
        },
      });

      setUsername(data.username);

      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setShowVerification(true);
        setSuccessMessage(
          'Account created! Please check your email for a verification code.'
        );
      } else if (isSignUpComplete) {
        onSuccess?.();
      }
    } catch (err: any) {
      console.error('Sign up error:', err);

      if (err.name === 'UsernameExistsException') {
        setError('Username already exists. Please choose a different username.');
      } else if (err.name === 'InvalidPasswordException') {
        setError('Password does not meet requirements.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onVerify = async (data: VerifyCodeFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { isSignUpComplete } = await confirmSignUp({
        username,
        confirmationCode: data.code,
      });

      if (isSignUpComplete) {
        setSuccessMessage('Email verified successfully! You can now sign in.');
        setTimeout(() => {
          onSuccess?.();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Verification error:', err);

      if (err.name === 'CodeMismatchException') {
        setError('Invalid verification code. Please try again.');
      } else if (err.name === 'ExpiredCodeException') {
        setError('Verification code has expired. Please request a new one.');
      } else {
        setError(err.message || 'Failed to verify email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await resendSignUpCode({ username });
      setSuccessMessage('Verification code resent! Please check your email.');
    } catch (err: any) {
      console.error('Resend code error:', err);
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerification) {
    return (
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-lg">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Verify your email</h1>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmitVerify(onVerify)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="Enter 6-digit code"
              maxLength={6}
              {...registerVerify('code')}
              disabled={isLoading}
            />
            {verifyErrors.code && (
              <p className="text-sm text-destructive">{verifyErrors.code.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isLoading}
            className="text-sm text-primary hover:underline disabled:opacity-50"
          >
            Resend verification code
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already verified?{' '}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-lg">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Get started with bidops.ai
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="givenName">First Name</Label>
            <Input
              id="givenName"
              type="text"
              placeholder="John"
              {...register('givenName')}
              disabled={isLoading}
            />
            {errors.givenName && (
              <p className="text-sm text-destructive">{errors.givenName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="familyName">Last Name</Label>
            <Input
              id="familyName"
              type="text"
              placeholder="Doe"
              {...register('familyName')}
              disabled={isLoading}
            />
            {errors.familyName && (
              <p className="text-sm text-destructive">{errors.familyName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="john.doe@example.com"
            {...register('email')}
            disabled={isLoading}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="johndoe"
            {...register('username')}
            disabled={isLoading}
          />
          {errors.username && (
            <p className="text-sm text-destructive">{errors.username.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Create a strong password"
            {...register('password')}
            disabled={isLoading}
          />
          {errors.password && (
            <p className="text-sm text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            {...register('confirmPassword')}
            disabled={isLoading}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Sign Up'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <GoogleSignIn onSuccess={onSuccess || (() => {})} />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
