import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/forms/profile-form";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/game" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-3xl font-bold">Mon Profil</h1>
        </div>
        <div className="bg-white dark:bg-zinc-900 shadow rounded-lg p-6 max-w-2xl mx-auto">
          <p className="text-center text-red-600 dark:text-red-400">
            Erreur lors du chargement du profil. Veuillez rafraîchir la page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/game" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold">Mon Profil</h1>
      </div>

      <ProfileForm profile={profile} />
    </div>
  );
}

