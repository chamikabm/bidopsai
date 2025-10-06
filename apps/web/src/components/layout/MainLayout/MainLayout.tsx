'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TopNavigation } from '../TopNavigation';
import { Sidebar } from '../Sidebar';
import { MobileSidebar } from '../Sidebar/MobileSidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <TopNavigation onMobileMenuToggle={() => setMobileMenuOpen(true)} />
      <div className="flex">
        <Sidebar />
        <MobileSidebar open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
