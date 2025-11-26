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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

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

