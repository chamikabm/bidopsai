/**
 * Authentication Background Component
 * 
 * Provides a full-screen futuristic animated background for auth pages
 * with CSS-based animations for optimal performance.
 */

'use client';

export function AuthBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10 animate-gradient" />
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/20 animate-float"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 10}s`,
            }}
          />
        ))}
      </div>
      
      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* Radial gradient spotlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.15),transparent_50%)]" />
      
      {/* Theme-specific effects */}
      <FuturisticEffects />
    </div>
  );
}

/**
 * Additional effects for futuristic theme
 */
function FuturisticEffects() {
  return (
    <>
      {/* Scanlines effect for futuristic theme */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-0 [.theme-futuristic_&]:opacity-30"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary) / 0.03) 2px, hsl(var(--primary) / 0.03) 4px)',
        }}
      />
      
      {/* Animated corner accents */}
      <div className="pointer-events-none absolute inset-0 opacity-0 [.theme-futuristic_&]:opacity-100">
        {/* Top-left */}
        <div className="absolute left-8 top-8 h-20 w-20 border-l-2 border-t-2 border-primary/50 animate-pulse" />
        <div className="absolute left-8 top-8 h-16 w-16 border-l border-t border-primary/30" />
        
        {/* Top-right */}
        <div className="absolute right-8 top-8 h-20 w-20 border-r-2 border-t-2 border-secondary/50 animate-pulse" />
        <div className="absolute right-8 top-8 h-16 w-16 border-r border-t border-secondary/30" />
        
        {/* Bottom-left */}
        <div className="absolute bottom-8 left-8 h-20 w-20 border-b-2 border-l-2 border-secondary/50 animate-pulse" />
        <div className="absolute bottom-8 left-8 h-16 w-16 border-b border-l border-secondary/30" />
        
        {/* Bottom-right */}
        <div className="absolute bottom-8 right-8 h-20 w-20 border-b-2 border-r-2 border-primary/50 animate-pulse" />
        <div className="absolute bottom-8 right-8 h-16 w-16 border-b border-r border-primary/30" />
      </div>
      
      {/* Glowing orbs */}
      <div className="pointer-events-none absolute inset-0 opacity-0 [.theme-futuristic_&]:opacity-50">
        <div 
          className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/10 blur-3xl animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        <div 
          className="absolute right-1/4 bottom-1/4 h-64 w-64 rounded-full bg-secondary/10 blur-3xl animate-pulse"
          style={{ animationDuration: '6s', animationDelay: '1s' }}
        />
      </div>
    </>
  );
}