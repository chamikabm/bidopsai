'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { AuthBackground } from '@/components/auth/AuthBackground';

/**
 * Authentication Page Content
 * Separated to allow Suspense boundary wrapping
 */
function AuthPageContent() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const handleAuthSuccess = () => {
    router.push(redirectUrl);
  };

  const handleSwitchToSignUp = () => {
    setMode('signup');
  };

  const handleSwitchToSignIn = () => {
    setMode('signin');
  };

  const handleForgotPassword = () => {
    // TODO: Implement forgot password flow
    console.warn('Forgot password flow not yet implemented');
  };

  return (
    <>
      <AuthBackground />
      
      <div className="relative z-10 w-full max-w-md">
        {mode === 'signin' ? (
          <SignInForm
            onSuccess={handleAuthSuccess}
            onSwitchToSignUp={handleSwitchToSignUp}
            onForgotPassword={handleForgotPassword}
          />
        ) : (
          <SignUpForm
            onSuccess={handleAuthSuccess}
            onSwitchToSignIn={handleSwitchToSignIn}
          />
        )}
      </div>
    </>
  );
}

/**
 * Authentication Page
 * 
 * Full-screen authentication page with custom forms
 * Supports sign in, sign up, and OAuth authentication
 */
export default function AuthPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }>
        <AuthPageContent />
      </Suspense>
    </div>
  );
}
