/**
 * Sign In Page
 * 
 * Authentication page for user login.
 */

import { SignInForm } from '@/components/auth/SignInForm';

export const metadata = {
  title: 'Sign In | BidOps.AI',
  description: 'Sign in to your BidOps.AI account',
};

export default function SignInPage() {
  return <SignInForm />;
}