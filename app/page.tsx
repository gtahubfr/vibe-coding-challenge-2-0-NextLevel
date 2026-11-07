import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-5xl flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {/* 1. Academy Desk branding and logo */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm bg-[#0f1c2e] text-sm font-bold tracking-widest text-white dark:bg-[#1b4332]">
          AD
        </div>
        <h1 className="mt-3.5 text-2xl font-bold uppercase tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          Academy Desk
        </h1>

        {/* 2. Public Tagline */}
        <p className="mt-2 text-base font-normal text-slate-600 sm:text-lg dark:text-slate-300">
          One platform. Every athlete. Better performance.
        </p>
      </div>

      {/* 3. Section Heading: Who are you? */}
      <div className="mt-10 mb-6 text-center sm:mt-12 sm:mb-8">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">
          Who are you?
        </h2>
        <p className="mt-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
          Select your portal to continue
        </p>
      </div>

      {/* 4. Exactly Three Role Selection Cards: Coach, Player, Scout */}
      <div className="grid w-full max-w-4xl grid-cols-1 gap-5 md:grid-cols-3">
        {/* Coach Card */}
        <Link
          href="/login?role=coach"
          className="group flex flex-col justify-between rounded-sm border border-[#e2e4e8] bg-white p-6 transition-colors hover:border-[#0f1c2e] dark:border-[#222c3a] dark:bg-[#141c26] dark:hover:border-slate-400"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Staff Portal
              </span>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#f0f0eb] text-slate-700 dark:bg-[#1c2633] dark:text-slate-300">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 shrink-0"
                  aria-hidden="true"
                >
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  <path d="M9 12h6" />
                  <path d="M9 16h6" />
                </svg>
              </div>
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-900 group-hover:text-[#0f1c2e] dark:text-slate-100 dark:group-hover:text-white">
              Coach
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Manage squad rosters, create practice sessions, mark attendance sheets, and record official match fixtures.
            </p>
          </div>
          <div className="mt-6 flex items-center text-sm font-semibold text-[#0f1c2e] dark:text-[#82d6a9]">
            <span>Sign in as Coach</span>
            <span className="ml-1 text-sm">&rarr;</span>
          </div>
        </Link>

        {/* Player Card */}
        <Link
          href="/login?role=player"
          className="group flex flex-col justify-between rounded-sm border border-[#e2e4e8] bg-white p-6 transition-colors hover:border-[#1b4332] dark:border-[#222c3a] dark:bg-[#141c26] dark:hover:border-slate-400"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Athlete Portal
              </span>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#f0f0eb] text-slate-700 dark:bg-[#1c2633] dark:text-slate-300">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 shrink-0"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="7" r="4" />
                  <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
                </svg>
              </div>
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-900 group-hover:text-[#1b4332] dark:text-slate-100 dark:group-hover:text-white">
              Player
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Track your personal practice attendance rate, view completed fixtures, and monitor your readiness qualification.
            </p>
          </div>
          <div className="mt-6 flex items-center text-sm font-semibold text-[#1b4332] dark:text-[#82d6a9]">
            <span>Sign in as Player</span>
            <span className="ml-1 text-sm">&rarr;</span>
          </div>
        </Link>

        {/* Scout Card */}
        <Link
          href="/login?role=scout"
          className="group flex flex-col justify-between rounded-sm border border-[#e2e4e8] bg-white p-6 transition-colors hover:border-[#0f1c2e] dark:border-[#222c3a] dark:bg-[#141c26] dark:hover:border-slate-400"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Discovery Radar
              </span>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#f0f0eb] text-slate-700 dark:bg-[#1c2633] dark:text-slate-300">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 shrink-0"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-900 group-hover:text-[#0f1c2e] dark:text-slate-100 dark:group-hover:text-white">
              Scout
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Inspect the verified talent radar to evaluate academy athletes who meet regulatory threshold standards for scouting.
            </p>
          </div>
          <div className="mt-6 flex items-center text-sm font-semibold text-[#0f1c2e] dark:text-[#82d6a9]">
            <span>Sign in as Scout</span>
            <span className="ml-1 text-sm">&rarr;</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
