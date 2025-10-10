'use client';

import { StatCard } from './StatCard';
import { FileText, Trophy, DollarSign, FolderOpen } from 'lucide-react';

interface DashboardStats {
  submittedBids: number;
  wonBids: number;
  totalValue: number;
  activeProjects: number;
}

interface StatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

export function StatsCards({ stats, isLoading = false }: StatsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Submitted Bids"
        value={stats.submittedBids}
        icon={FileText}
        description="Total bids submitted"
        isLoading={isLoading}
      />
      <StatCard
        title="Won Bids"
        value={stats.wonBids}
        icon={Trophy}
        description="Successfully won bids"
        isLoading={isLoading}
      />
      <StatCard
        title="Total Value"
        value={formatCurrency(stats.totalValue)}
        icon={DollarSign}
        description="Combined value of won bids"
        isLoading={isLoading}
      />
      <StatCard
        title="Active Projects"
        value={stats.activeProjects}
        icon={FolderOpen}
        description="Projects in progress"
        isLoading={isLoading}
      />
    </div>
  );
}
