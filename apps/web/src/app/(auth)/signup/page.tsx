/**
 * Sign Up Page
 * 
 * Authentication page for user registration.
 */

import { SignUpForm } from '@/components/auth/SignUpForm';

export const metadata = {
  title: 'Sign Up | BidOps.AI',
  description: 'Create your BidOps.AI account',
};

export default function SignUpPage() {
  return <SignUpForm />;
}