import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { InfiniteGamesManager } from "@/components/game/infinite-games-manager";

export default async function InfinitePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mode Infini</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Créez autant de parties que vous voulez et jouez-les en parallèle !
        </p>
      </div>
      
      <InfiniteGamesManager />
    </div>
  );
}
