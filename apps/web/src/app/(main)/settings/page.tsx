import { redirect } from 'next/navigation';

export default function SettingsPage() {
  // Redirect to agents page by default
  redirect('/settings/agents');
}