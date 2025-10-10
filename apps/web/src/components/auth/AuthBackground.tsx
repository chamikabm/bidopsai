/**
 * Authentication Background Component
 * 
 * Particle network animation with connected dots forming geometric shapes
 * Classic futuristic effect with triangles, lines, and polygons
 */

'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export function AuthBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  
  const particleCount = 100;
  const connectionDistance = 120;
  const particleSpeed = 0.5;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get theme colors from CSS variables
    const getThemeColor = (variable: string) => {
      const value = getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim();
      return value;
    };

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * particleSpeed,
        vy: (Math.random() - 0.5) * particleSpeed,
        radius: Math.random() * 2 + 1,
      }));
    };
    initParticles();

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Keep within bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));

        // Draw connections to nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = 1 - distance / connectionDistance;
            ctx.beginPath();
            const primaryColor = getThemeColor('--color-primary');
            // Parse HSL and convert to rgba
            const hslMatch = primaryColor.match(/hsl\(([^)]+)\)/);
            if (hslMatch) {
              const [h, s, l] = hslMatch[1].split(/\s+/);
              ctx.strokeStyle = `hsla(${h}, ${s}, ${l}, ${opacity * 0.4})`;
            } else {
              ctx.strokeStyle = `rgba(59, 130, 246, ${opacity * 0.4})`;
            }
            ctx.lineWidth = 1;
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        const primaryColor = getThemeColor('--color-primary');
        const hslMatch = primaryColor.match(/hsl\(([^)]+)\)/);
        if (hslMatch) {
          const [h, s, l] = hslMatch[1].split(/\s+/);
          ctx.fillStyle = `hsla(${h}, ${s}, ${l}, 0.8)`;
          ctx.shadowColor = `hsla(${h}, ${s}, ${l}, 0.5)`;
        } else {
          ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
          ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
        }
        ctx.fill();
        
        // Add glow
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Animated gradient background using theme colors */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      
      {/* Canvas for particle network */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: 'screen' as const }}
      />
      
      {/* Center spotlight using theme primary color */}
      <div className="absolute inset-0 opacity-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.15)_0%,transparent_50%)]" />
      </div>
      
      {/* Scanlines effect using theme color */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(var(--primary) / 0.05) 2px, hsl(var(--primary) / 0.05) 4px)',
        }}
      />
      
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