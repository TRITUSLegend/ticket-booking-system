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

  if (isLoading) return <div className="p-8 text-center text-white/60">Loading statistics...</div>;
  if (!stats) return <div className="p-8 text-center text-red-400">Failed to load statistics.</div>;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'bg-blue-500/10 text-blue-400' },
    { label: 'Total Venues', value: stats.totalVenues, icon: '🏟️', color: 'bg-purple-500/10 text-purple-400' },
    { label: 'Total Events', value: stats.totalEvents, icon: '🎬', color: 'bg-green-500/10 text-green-400' },
    { label: 'Total Revenue', value: `₹${Number(stats.totalRevenue).toLocaleString()}`, icon: '💰', color: 'bg-amber-500/10 text-amber-400' },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8 text-white">System Statistics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-white/50">{card.label}</p>
              <span className={`text-2xl w-10 h-10 flex items-center justify-center rounded-lg ${card.color}`}>
                {card.icon}
              </span>
            </div>
            <p className="text-3xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
