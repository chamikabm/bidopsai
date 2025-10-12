/**
 * Root Page
 *
 * Redirects to signin page
 */

import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/signin');
}
