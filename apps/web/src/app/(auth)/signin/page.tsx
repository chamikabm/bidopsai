/**
 * Sign In Page
 * 
 * Authentication page for user login.
 */

import { Suspense } from 'react';
import { SignInForm } from '@/components/auth/SignInForm';

export const metadata = {
  title: 'Sign In | BidOps.AI',
  description: 'Sign in to your BidOps.AI account',
};

function SignInContent() {
  return <SignInForm />;
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInContent />
    </Suspense>
  );
}