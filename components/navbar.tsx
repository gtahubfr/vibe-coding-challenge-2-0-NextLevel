"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  // On the public homepage, the page itself renders the dedicated brand header per specification
  if (pathname === "/") {
    return null;
  }

  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e2e4e8] bg-white dark:border-[#222c3a] dark:bg-[#141c26]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#0f1c2e] text-white font-bold text-xs tracking-wider dark:bg-[#1b4332]">
            AD
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 uppercase">
              Academy Desk
            </span>
            <span className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">
              Sports Management
            </span>
          </div>
        </Link>

        {/* Right Action */}
        <div className="flex items-center gap-3 text-xs">
          {isDashboard ? (
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="rounded-sm border border-slate-300 bg-transparent px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Sign Out
              </button>
            </form>
          ) : (
            <Link
              href="/"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            >
              &larr; Role Selection
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
