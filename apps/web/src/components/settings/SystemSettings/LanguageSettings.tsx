'use client';

import { motion } from 'framer-motion';
import { Check, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUIStore, type Language } from '@/store/ui-store';
import { cn } from '@/lib/utils';

const languages: { value: Language; label: string; flag: string }[] = [
  { value: 'en-US', label: 'English (US)', flag: '🇺🇸' },
  { value: 'en-AU', label: 'English (AU)', flag: '🇦🇺' },
];

export function LanguageSettings() {
  const { language, setLanguage } = useUIStore();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5" />
          <CardTitle>Language</CardTitle>
        </div>
        <CardDescription>Select your preferred language</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {languages.map((lang) => (
            <motion.button
              key={lang.value}
              onClick={() => setLanguage(lang.value)}
              className={cn(
                'relative flex items-center space-x-3 rounded-lg border-2 p-4 text-left transition-colors',
                language === lang.value
                  ? 'border-primary bg-accent'
                  : 'border-border hover:border-primary/50'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {language === lang.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary"
                >
                  <Check className="h-4 w-4 text-primary-foreground" />
                </motion.div>
              )}
              <div className="text-2xl">{lang.flag}</div>
              <div className="font-medium">{lang.label}</div>
            </motion.button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
