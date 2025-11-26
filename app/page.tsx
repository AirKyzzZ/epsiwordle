import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-black to-black z-0"></div>
      
      <div className="z-10 flex flex-col items-center text-center px-4 max-w-3xl">
        <div className="mb-8 relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg blur opacity-75 animate-pulse"></div>
          <div className="relative px-8 py-4 bg-black rounded-lg leading-none flex items-center">
            <span className="text-6xl font-bold tracking-tighter">
              <span className="text-emerald-500">EPSI</span>WORDLE
            </span>
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
          Réservé aux étudiants.
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl">
          L'accès à cette plateforme est strictement limité aux étudiants possédant une adresse <span className="text-emerald-400 font-mono">@ecoles-epsi.net</span>.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link 
            href="/auth/login"
            className="group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md bg-emerald-600 px-8 font-medium text-white transition-all duration-300 hover:bg-emerald-700 hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
          >
            <span className="mr-2">Se connecter</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
          
          <Link 
            href="/auth/signup"
            className="inline-flex h-12 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 px-8 font-medium text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-white focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            Créer un compte
          </Link>
        </div>
        
        <div className="mt-16 text-sm text-gray-600 font-mono">
          SYSTEM_STATUS: <span className="text-emerald-500">ONLINE</span> | ENCRYPTION: <span className="text-emerald-500">SECURE</span>
        </div>
      </div>
    </div>
  );
}
