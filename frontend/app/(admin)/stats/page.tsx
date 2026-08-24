'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../../lib/api-client';
import { useAuth } from '../../../lib/auth-context';

/**
 * Admin Statistics Dashboard
 * Displays system-wide metrics: total users, venues, events, and confirmed revenue.
 */

interface StatsData {
  totalUsers: number;
  totalVenues: number;
  totalEvents: number;
  totalRevenue: number;
}

export default function AdminStatsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    const load = async () => {
      try {
        const res = await fetchApi<{ data: StatsData }>('/api/admin/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  if (isLoading) return <div className="p-8 text-center text-[var(--text-secondary)]">Loading statistics...</div>;
  if (!stats) return <div className="p-8 text-center text-red-400">Failed to load statistics.</div>;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'bg-[var(--accent-primary)]/10', glow: 'var(--glow-blue)' },
    { label: 'Total Venues', value: stats.totalVenues, icon: '🏟️', color: 'bg-[var(--accent-purple)]/10', glow: 'var(--glow-purple)' },
    { label: 'Total Events', value: stats.totalEvents, icon: '🎬', color: 'bg-[var(--color-success)]/10', glow: 'var(--glow-green)' },
    { label: 'Total Revenue', value: `₹${Number(stats.totalRevenue).toLocaleString()}`, icon: '💰', color: 'bg-[var(--color-held)]/10', glow: 'var(--glow-amber)' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <p className="micro-label mb-2">System-wide</p>
      <h1 className="text-3xl font-bold tracking-[-0.5px] mb-8 text-[var(--text-primary)]">Statistics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="micro-label">{card.label}</p>
              <span
                className={`text-2xl w-10 h-10 flex items-center justify-center rounded-lg ${card.color}`}
                style={{ boxShadow: `0 0 12px ${card.glow}` }}
              >
                {card.icon}
              </span>
            </div>
            <p className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
