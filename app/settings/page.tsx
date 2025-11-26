import { signOut } from "@/app/auth/actions";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/game" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold">Paramètres</h1>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-medium mb-4">Compte</h2>
          <form action={signOut}>
            <button 
              type="submit" 
              className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
            >
              <LogOut size={20} />
              Se déconnecter
            </button>
          </form>
        </div>
        
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">À propos</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            EPSIWordle v1.0.0<br />
            Fait avec ❤️ pour les étudiants de l'EPSI.
          </p>
        </div>
      </div>
    </div>
  );
}

