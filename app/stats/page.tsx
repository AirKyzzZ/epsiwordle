import { createClient } from "@/lib/supabase/server";
import { getUserStats } from "@/lib/wordle/stats";
import { StatsCharts, StatCard } from "@/components/stats/stats-charts";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const stats = await getUserStats(user.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/game" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold">Statistiques</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard label="Jouées" value={stats.played} />
        <StatCard label="Victoires %" value={stats.winRate} />
        <StatCard label="Série actuelle" value={stats.currentStreak} />
        <StatCard label="Max série" value={stats.maxStreak} />
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm mb-8">
        <h2 className="text-xl font-semibold mb-6">Distribution des essais</h2>
        <StatsCharts stats={stats} />
      </div>

      {/* Placeholder for Rankings - Requires SQL Aggregation functions */}
      <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-xl text-center opacity-50">
        <h2 className="text-xl font-semibold mb-2">Classements</h2>
        <p>Bientôt disponible : Classement par campus et par classe.</p>
      </div>
    </div>
  );
}

