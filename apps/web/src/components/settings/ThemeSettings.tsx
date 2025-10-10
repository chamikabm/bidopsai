'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUIStore, type Theme } from '@/store/ui-store';
import { cn } from '@/lib/utils';

const themes: { value: Theme; label: string; description: string; preview: string[] }[] = [
  {
    value: 'light',
    label: 'Light',
    description: 'Clean and bright interface',
    preview: ['#ffffff', '#3b82f6', '#f3f4f6'],
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Easy on the eyes',
    preview: ['#0f172a', '#3b82f6', '#1e293b'],
  },
  {
    value: 'deloitte',
    label: 'Deloitte',
    description: 'Professional brand theme',
    preview: ['#f5f5f5', '#86bc25', '#212121'],
  },
  {
    value: 'futuristic',
    label: 'Futuristic',
    description: 'Cyberpunk aesthetics',
    preview: ['#0a0a0f', '#00ffff', '#ff00ff'],
  },
];

export function ThemeSettings() {
  const { theme, setTheme } = useUIStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>Select your preferred theme</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {themes.map((themeOption) => (
            <motion.button
              key={themeOption.value}
              onClick={() => setTheme(themeOption.value)}
              className={cn(
                'relative rounded-lg border-2 p-4 text-left transition-colors',
                theme === themeOption.value
                  ? 'border-primary bg-accent'
                  : 'border-border hover:border-primary/50'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {theme === themeOption.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary"
                >
                  <Check className="h-4 w-4 text-primary-foreground" />
                </motion.div>
              )}
              <div className="mb-3 flex space-x-1">
                {themeOption.preview.map((color) => (
                  <div
                    key={color}
                    className="h-8 w-8 rounded"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="font-semibold">{themeOption.label}</div>
              <div className="text-sm text-muted-foreground">{themeOption.description}</div>
            </motion.button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
