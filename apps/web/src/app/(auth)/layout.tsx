/**
 * Authentication Layout
 * 
 * Provides full-screen layout for authentication pages
 * with futuristic animated background.
 */

import { AuthBackground } from '@/components/auth/AuthBackground';
import { Card } from '@/components/ui/card';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Animated background */}
      <AuthBackground />
      
      {/* Content card */}
      <Card className="relative z-10 w-full max-w-md p-8 animate-fade-in">
        {children}
      </Card>
    </div>
  );
}