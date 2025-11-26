"use client";

import { signup } from "@/app/auth/actions";
import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export function SignupForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setMessage(null);
    
    try {
      const result = await signup(formData);
      if (result?.error) setMessage(result.error);
    } catch (e) {
      setMessage("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-xl shadow-lg dark:bg-zinc-900">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Inscription</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Rejoignez la communauté EPSIWordle
        </p>
      </div>

      <form action={handleSubmit} className="mt-8 space-y-6">
        <div className="space-y-4 rounded-md shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="sr-only">Prénom</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                placeholder="Prénom"
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 bg-transparent dark:text-white dark:ring-gray-700"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="sr-only">Nom</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                placeholder="Nom"
                className="relative block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 bg-transparent dark:text-white dark:ring-gray-700"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="email" className="sr-only">Email EPSI</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="xxxx@ecoles-epsi.net"
              className="relative block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 bg-transparent dark:text-white dark:ring-gray-700"
              pattern=".*@ecoles-epsi\.net"
              title="Veuillez utiliser une adresse @ecoles-epsi.net"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="sr-only">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Mot de passe"
              minLength={6}
              className="relative block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6 bg-transparent dark:text-white dark:ring-gray-700"
            />
          </div>
        </div>

        {message && (
          <div className="text-sm text-center p-2 bg-red-100 text-red-700 rounded">
            {message}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative flex w-full justify-center rounded-md bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
            S'inscrire
          </button>
        </div>

        <div className="text-center text-sm">
          <Link href="/auth/login" className="font-medium text-emerald-600 hover:text-emerald-500">
            Déjà un compte ? Se connecter
          </Link>
        </div>
      </form>
    </div>
  );
}

