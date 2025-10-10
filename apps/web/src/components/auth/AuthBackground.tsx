/**
 * Authentication Background Component
 *
 * Provides a full-screen futuristic animated background for auth pages
 * with CSS-based animations for optimal performance.
 * Inspired by: Bloomberg Terminal + Vercel + Cyberpunk aesthetics
 */

'use client';

import { useMemo } from 'react';

// Generate stable particle configurations
function generateParticles(count: number, seed: number) {
  let random = seed;
  
  const seededRandom = () => {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  };
  
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    width: seededRandom() * 4 + 3,
    height: seededRandom() * 4 + 3,
    left: seededRandom() * 100,
    top: seededRandom() * 100,
    delay: seededRandom() * 5,
    duration: seededRandom() * 15 + 15,
    opacity: seededRandom() * 0.5 + 0.5, // Much more visible: 0.5-1.0
  }));
}

export function AuthBackground() {
  const particles = useMemo(() => generateParticles(80, 12345), []);
  const largeOrbs = useMemo(() => generateParticles(15, 54321), []);
  
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-slate-950">
      {/* Animated gradient background - MORE VIBRANT */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-slate-950 to-purple-900/20" />
      
      {/* Small particles - MUCH BRIGHTER AND BIGGER */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-blue-400"
            style={{
              width: `${particle.width}px`,
              height: `${particle.height}px`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              opacity: particle.opacity,
              animation: `float ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
              boxShadow: `0 0 ${particle.width * 6}px rgba(59, 130, 246, 0.8), 0 0 ${particle.width * 12}px rgba(59, 130, 246, 0.4)`,
            }}
          />
        ))}
      </div>
      
      {/* Larger glowing orbs - MORE PROMINENT */}
      <div className="absolute inset-0">
        {largeOrbs.map((orb) => (
          <div
            key={`orb-${orb.id}`}
            className="absolute rounded-full blur-3xl"
            style={{
              width: `${orb.width * 60}px`,
              height: `${orb.height * 60}px`,
              left: `${orb.left}%`,
              top: `${orb.top}%`,
              background: `radial-gradient(circle, rgba(59, 130, 246, ${orb.opacity * 0.6}) 0%, transparent 70%)`,
              animation: `breath ${orb.duration * 1.5}s ease-in-out infinite`,
              animationDelay: `${orb.delay}s`,
            }}
          />
        ))}
      </div>
      
      {/* Scanlines effect - MORE VISIBLE */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(59, 130, 246, 0.1) 2px, rgba(59, 130, 246, 0.1) 4px)',
        }}
      />
      
      {/* Center spotlight - BRIGHTER */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.25)_0%,transparent_50%)]" />
      
      {/* Animated data streams - MUCH MORE VISIBLE */}
      <div className="absolute inset-0 overflow-hidden opacity-60">
        {[...Array(8)].map((_, i) => (
          <div
            key={`stream-${i}`}
            className="absolute h-full w-[2px]"
            style={{
              left: `${(i + 1) * 11}%`,
              background: 'linear-gradient(to bottom, transparent 0%, rgba(59, 130, 246, 0.8) 30%, rgba(59, 130, 246, 0.8) 70%, transparent 100%)',
              animation: `float ${18 + i * 2}s linear infinite`,
              animationDelay: `${i * -2}s`,
            }}
          />
        ))}
      </div>
      
      {/* Additional horizontal data streams for more dynamic feel */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        {[...Array(5)].map((_, i) => (
          <div
            key={`h-stream-${i}`}
            className="absolute w-full h-[1px]"
            style={{
              top: `${(i + 1) * 18}%`,
              background: 'linear-gradient(to right, transparent 0%, rgba(59, 130, 246, 0.6) 30%, rgba(59, 130, 246, 0.6) 70%, transparent 100%)',
              animation: `float ${25 + i * 3}s linear infinite`,
              animationDelay: `${i * -3}s`,
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