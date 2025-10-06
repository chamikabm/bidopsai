'use client';

/**
 * AuthBackground Component
 * 
 * Full-screen futuristic animated background for authentication pages
 * Features CSS animations with cyberpunk aesthetics
 */
export function AuthBackground() {
  return (
    <div className="auth-background">
      <div className="auth-background-grid" />
      <div className="auth-background-gradient" />
      <div className="auth-background-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
    </div>
  );
}
