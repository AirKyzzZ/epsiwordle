"use client";

import Link from "next/link";
import Image from "next/image";
import { User, Settings, BarChart3, Infinity } from "lucide-react";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  
  // Don't show header on auth pages or landing page if not authenticated (middleware handles redirect)
  // But for landing page we might want a simple header.
  // Let's assume this header is for the app shell (logged in).
  if (pathname.startsWith("/auth") || pathname === "/") return null;

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800">
      <div className="flex w-1/3 justify-start">
        {/* Left side placeholder or hamburger menu if needed */}
      </div>
      
      <div className="flex w-1/3 justify-center">
        <Link href="/game" className="flex items-center justify-center">
          <Image 
            src="/logo.png" 
            alt="EPSIWORDLE" 
            width={120}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </Link>
      </div>

      <div className="flex w-1/3 justify-end gap-4">
        <Link href="/infinite" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100" title="Mode Infini">
          <Infinity size={24} />
        </Link>
        <Link href="/stats" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
          <BarChart3 size={24} />
        </Link>
        <Link href="/profile" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
          <User size={24} />
        </Link>
        <Link href="/settings" className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100">
          <Settings size={24} />
        </Link>
      </div>
    </header>
  );
}

