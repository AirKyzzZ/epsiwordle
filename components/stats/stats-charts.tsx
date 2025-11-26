"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { UserStats } from "@/lib/wordle/stats";

export function StatsCharts({ stats }: { stats: UserStats }) {
  const data = stats.distribution.map((count, i) => ({
    attempts: i + 1,
    count,
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis type="number" hide />
          <YAxis dataKey="attempts" type="category" width={30} tick={{ fill: '#666' }} />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ backgroundColor: '#333', color: '#fff', borderRadius: '8px', border: 'none' }}
          />
          <Bar dataKey="count" fill="#6aaa64" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.count > 0 ? "#6aaa64" : "#787c7e"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
      <span className="text-3xl font-bold text-gray-900 dark:text-white">{value}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 uppercase text-center mt-1">{label}</span>
    </div>
  );
}

