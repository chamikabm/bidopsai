/**
 * Sign Up Form Component
 * 
 * Provides user registration with email verification.
 * Integrates with AWS Cognito through useAuth hook.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSignUp, useConfirmSignUp, useResendSignUpCode } from '@/hooks/useAuth';
import { validatePassword, validateEmail } from '@/lib/auth/cognito';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2 } from 'lucide-react';
import styles from './AuthForms.module.css';

/**
 * Form validation schema
 */
const signUpSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(128),
  email: z.string().email('Invalid email address').refine(validateEmail, 'Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters').refine(
    (password) => {
      const validation = validatePassword(password);
      return validation.isValid;
    },
    {
      message: 'Password must meet all requirements',
    }
  ),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

/**
 * Confirmation form schema
 */
const confirmationSchema = z.object({
  confirmationCode: z.string().length(6, 'Confirmation code must be 6 digits'),
});

type ConfirmationFormValues = z.infer<typeof confirmationSchema>;

/**
 * Sign Up Form Props
 */
interface SignUpFormProps {
  /** Callback fired on successful sign up */
  onSuccess?: () => void;
}

export function SignUpForm({ onSuccess }: SignUpFormProps) {
  const router = useRouter();
  
  const [step, setStep] = useState<'signup' | 'confirm'>('signup');
  const [registeredUsername, setRegisteredUsername] = useState('');
  
  const signUpMutation = useSignUp();
  const confirmSignUpMutation = useConfirmSignUp();
  const resendCodeMutation = useResendSignUpCode();

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
    },
  });

  const confirmationForm = useForm<ConfirmationFormValues>({
    resolver: zodResolver(confirmationSchema),
    defaultValues: {
      confirmationCode: '',
    },
  });

  /**
   * Handle sign up form submission
   */
  async function onSignUpSubmit(values: SignUpFormValues) {
    signUpMutation.mutate(
      {
        username: values.username,
        email: values.email,
        password: values.password,
        attributes: {
          given_name: values.firstName,
          family_name: values.lastName,
        },
      },
      {
        onSuccess: (result) => {
          if (result.nextStep?.signUpStep === 'CONFIRM_SIGN_UP') {
            setRegisteredUsername(values.username);
            setStep('confirm');
          } else if (result.isSignUpComplete) {
            onSuccess?.();
            router.push('/signin?verified=true');
          }
        },
      }
    );
  }

  /**
   * Handle confirmation code submission
   */
  async function onConfirmSubmit(values: ConfirmationFormValues) {
    confirmSignUpMutation.mutate(
      {
        username: registeredUsername,
        confirmationCode: values.confirmationCode,
      },
      {
        onSuccess: () => {
          onSuccess?.();
          router.push('/signin?verified=true');
        },
      }
    );
  }

  /**
   * Handle resend confirmation code
   */
  async function handleResendCode() {
    resendCodeMutation.mutate(registeredUsername);
  }

  /**
   * Password strength indicator
   */
  function PasswordStrengthIndicator({ password }: { password: string }) {
    if (!password) return null;

    const validation = validatePassword(password);
    const strength = validation.isValid ? 100 : (5 - validation.errors.length) * 20;
    
    const strengthColor = 
      strength >= 80 ? 'bg-green-500' :
      strength >= 60 ? 'bg-yellow-500' :
      strength >= 40 ? 'bg-orange-500' :
      'bg-red-500';

    return (
      <div className="space-y-2">
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${strengthColor}`}
            style={{ width: `${strength}%` }}
          />
        </div>
        {!validation.isValid && (
          <ul className="text-xs text-muted-foreground space-y-1">
            {validation.errors.map((error, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-destructive">•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="space-y-2 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Check your email</h1>
          <p className="text-muted-foreground">
            We&apos;ve sent a 6-digit confirmation code to your email.
          </p>
        </div>

        {/* Confirmation Form */}
        <Form {...confirmationForm}>
          <form
            onSubmit={confirmationForm.handleSubmit(onConfirmSubmit)}
            className={`${styles.form} space-y-4`}
          >
            <FormField
              control={confirmationForm.control}
              name="confirmationCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmation Code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="000000"
                      maxLength={6}
                      autoComplete="one-time-code"
                      disabled={confirmSignUpMutation.isPending}
                      className="text-center text-2xl tracking-widest"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the 6-digit code from your email
                  </FormDescription>
                  <FormMessage className={styles.error} />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className={`${styles.submit} w-full`}
              disabled={confirmSignUpMutation.isPending}
            >
              {confirmSignUpMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirm Email
            </Button>
          </form>
        </Form>

        {/* Resend Code */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Didn&apos;t receive the code?
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResendCode}
            disabled={resendCodeMutation.isPending}
          >
            {resendCodeMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Resend Code
          </Button>
        </div>

        {/* Back to Sign In */}
        <div className="text-center text-sm">
          <Link
            href="/signin"
            className="text-primary hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create an account</h1>
        <p className="text-muted-foreground">
          Enter your details to get started
        </p>
      </div>

      {/* Sign Up Form */}
      <Form {...signUpForm}>
        <form
          onSubmit={signUpForm.handleSubmit(onSignUpSubmit)}
          className={`${styles.form} space-y-4`}
        >
          {/* Username */}
          <FormField
            control={signUpForm.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="johndoe"
                    autoComplete="username"
                    disabled={signUpMutation.isPending}
                  />
                </FormControl>
                <FormDescription>
                  Letters, numbers, and ._- characters only
                </FormDescription>
                <FormMessage className={styles.error} />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={signUpForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    placeholder="john.doe@example.com"
                    autoComplete="email"
                    disabled={signUpMutation.isPending}
                  />
                </FormControl>
                <FormMessage className={styles.error} />
              </FormItem>
            )}
          />

          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={signUpForm.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="John"
                      autoComplete="given-name"
                      disabled={signUpMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage className={styles.error} />
                </FormItem>
              )}
            />

            <FormField
              control={signUpForm.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Doe"
                      autoComplete="family-name"
                      disabled={signUpMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage className={styles.error} />
                </FormItem>
              )}
            />
          </div>

          {/* Password */}
          <FormField
            control={signUpForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    disabled={signUpMutation.isPending}
                  />
                </FormControl>
                <PasswordStrengthIndicator password={field.value} />
                <FormMessage className={styles.error} />
              </FormItem>
            )}
          />

          {/* Confirm Password */}
          <FormField
            control={signUpForm.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    disabled={signUpMutation.isPending}
                  />
                </FormControl>
                <FormMessage className={styles.error} />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className={`${styles.submit} w-full`}
            disabled={signUpMutation.isPending}
          >
            {signUpMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Account
          </Button>
        </form>
      </Form>

      {/* Sign In Link */}
      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link
          href="/signin"
          className="font-medium text-primary hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}