'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center space-x-2">
      <motion.div
        className="flex items-center space-x-2"
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-lg font-bold text-primary-foreground">B</span>
        </div>
        <span className="text-xl font-bold">bidops.ai</span>
      </motion.div>
    </Link>
  );
}
