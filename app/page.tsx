import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      {/* 1. Academy Desk name and logo at the top */}
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#0f1c2e] text-white font-bold text-sm tracking-widest dark:bg-[#1b4332]">
          AD
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 uppercase sm:text-3xl dark:text-slate-100">
          Academy Desk
        </h1>

        {/* 2. Short tagline */}
        <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
          One platform. Every athlete. Better performance.
        </p>
      </div>

      {/* 3. Clear heading: 'Who are you?' */}
      <div className="mt-14 mb-8 text-center">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-100">
          Who are you?
        </h2>
        <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">
          Select your portal to continue
        </p>
      </div>

      {/* 4. Exactly three role selection cards: Coach, Player, Scout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Coach Card */}
        <Link
          href="/login?role=coach"
          className="group block rounded-sm border border-[#e2e4e8] bg-white p-6 transition-colors hover:border-[#0f1c2e] dark:border-[#222c3a] dark:bg-[#141c26] dark:hover:border-slate-400"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Staff Portal
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#f7f7f4] text-slate-700 dark:bg-[#0d131a] dark:text-slate-300">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-[#0f1c2e] dark:text-slate-100 dark:group-hover:text-white">
            Coach
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Manage squad rosters, create practice sessions, mark attendance sheets, and record official match fixtures.
          </p>
          <div className="mt-6 flex items-center text-xs font-semibold text-[#0f1c2e] dark:text-[#82d6a9]">
            <span>Sign in as Coach</span>
            <span className="ml-1 text-sm">&rarr;</span>
          </div>
        </Link>

        {/* Player Card */}
        <Link
          href="/login?role=player"
          className="group block rounded-sm border border-[#e2e4e8] bg-white p-6 transition-colors hover:border-[#1b4332] dark:border-[#222c3a] dark:bg-[#141c26] dark:hover:border-slate-400"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Athlete Portal
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#f7f7f4] text-slate-700 dark:bg-[#0d131a] dark:text-slate-300">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-[#1b4332] dark:text-slate-100 dark:group-hover:text-white">
            Player
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Track your personal practice attendance rate, view completed fixtures, and monitor your readiness qualification.
          </p>
          <div className="mt-6 flex items-center text-xs font-semibold text-[#1b4332] dark:text-[#82d6a9]">
            <span>Sign in as Player</span>
            <span className="ml-1 text-sm">&rarr;</span>
          </div>
        </Link>

        {/* Scout Card */}
        <Link
          href="/login?role=scout"
          className="group block rounded-sm border border-[#e2e4e8] bg-white p-6 transition-colors hover:border-[#0f1c2e] dark:border-[#222c3a] dark:bg-[#141c26] dark:hover:border-slate-400"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Discovery Radar
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#f7f7f4] text-slate-700 dark:bg-[#0d131a] dark:text-slate-300">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.75" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-[#0f1c2e] dark:text-slate-100 dark:group-hover:text-white">
            Scout
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Inspect the verified talent radar to evaluate academy athletes who meet regulatory threshold standards for scouting.
          </p>
          <div className="mt-6 flex items-center text-xs font-semibold text-[#0f1c2e] dark:text-[#82d6a9]">
            <span>Sign in as Scout</span>
            <span className="ml-1 text-sm">&rarr;</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
