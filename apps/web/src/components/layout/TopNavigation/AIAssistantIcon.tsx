'use client';

import { motion } from 'framer-motion';
import { useUIStore } from '@/store/ui-store';
import { Bot } from 'lucide-react';

export function AIAssistantIcon() {
  const theme = useUIStore((state) => state.theme);

  // Theme-based colors for breathing animation
  const themeColors = {
    light: ['#3b82f6', '#60a5fa', '#93c5fd'],
    dark: ['#3b82f6', '#2563eb', '#1d4ed8'],
    deloitte: ['#86bc25', '#43b02a', '#00a3a1'],
    futuristic: ['#00ffff', '#ff00ff', '#00ff00'],
  };

  const colors = themeColors[theme];

  return (
    <motion.div
      className="relative flex items-center justify-center"
      animate={{
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-full blur-md"
        animate={{
          backgroundColor: colors,
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <Bot className="relative z-10 h-6 w-6 text-foreground" />
    </motion.div>
  );
}
