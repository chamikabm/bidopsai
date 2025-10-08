/**
 * Stats Cards Component
 * 
 * Container for dashboard statistics cards
 */

'use client';

import { FileText, Trophy, DollarSign, FolderKanban } from 'lucide-react';
import { StatCard } from './StatCard';

interface StatsCardsProps {
  stats?: {
    submittedBids: number;
    wonBids: number;
    totalValue: number;
    activeProjects: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  // Default values if no stats provided
  const {
    submittedBids = 0,
    wonBids = 0,
    totalValue = 0,
    activeProjects = 0,
  } = stats || {};

  // Calculate success rate
  const successRate = submittedBids > 0 
    ? Math.round((wonBids / submittedBids) * 100) 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Submitted Bids"
        value={submittedBids}
        icon={FileText}
        description="Total bids submitted"
      />
      
      <StatCard
        title="Won Bids"
        value={wonBids}
        icon={Trophy}
        description={`${successRate}% success rate`}
      />
      
      <StatCard
        title="Total Value"
        value={`$${totalValue.toLocaleString()}`}
        icon={DollarSign}
        description="Value of won bids"
      />
      
      <StatCard
        title="Active Projects"
        value={activeProjects}
        icon={FolderKanban}
        description="Currently in progress"
      />
    </div>
  );
}