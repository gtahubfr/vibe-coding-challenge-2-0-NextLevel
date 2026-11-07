"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AllowedRole = "coach" | "player" | "scout";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const roleParam = searchParams.get("role") as AllowedRole | null;
  const isParamValid = roleParam === "coach" || roleParam === "player" || roleParam === "scout";

  const [selectedRole, setSelectedRole] = React.useState<AllowedRole>(() => {
    if (isParamValid && roleParam) {
      return roleParam;
    }
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("academy_desk_selected_role") as AllowedRole | null;
      if (saved && (saved === "coach" || saved === "player" || saved === "scout")) {
        return saved;
      }
    }
    return "player";
  });

  const role: AllowedRole = isParamValid && roleParam ? roleParam : selectedRole;

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Sync remembered role to localStorage without triggering state updates in effect
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("academy_desk_selected_role", role);
    }
  }, [role]);

  const handleSelectRole = (newRole: AllowedRole) => {
    setSelectedRole(newRole);
    setError(null);
  };

  const handlePrefillDemo = () => {
    setEmail(`${role}@apexacademy.demo`);
    setPassword("DemoPassword123!");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          expectedRole: role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Redirect directly to the selected role's dashboard
      router.push(`/dashboard/${role}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred during authentication");
    } finally {
      setLoading(false);
    }
  };

  const roleMeta = {
    coach: {
      label: "Coach Portal",
      title: "Coach Sign In",
      desc: "Sign in to manage squad rosters, create practice sessions, and record matches.",
    },
    player: {
      label: "Athlete Portal",
      title: "Player Sign In",
      desc: "Sign in to check your practice attendance, fixtures, and readiness status.",
    },
    scout: {
      label: "Discovery Radar",
      title: "Scout Sign In",
      desc: "Sign in to review competition-ready athletes meeting the regulatory threshold.",
    },
  }[role];

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md border border-[#e2e4e8] bg-white dark:border-[#222c3a] dark:bg-[#141c26]">
        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 border-b border-[#e2e4e8] text-center text-xs font-semibold dark:border-[#222c3a]">
          <button
            type="button"
            onClick={() => handleSelectRole("coach")}
            className={`py-3 uppercase tracking-wider transition-colors ${
              role === "coach"
                ? "border-b-2 border-[#0f1c2e] text-[#0f1c2e] dark:border-[#82d6a9] dark:text-[#82d6a9]"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            Coach
          </button>
          <button
            type="button"
            onClick={() => handleSelectRole("player")}
            className={`py-3 uppercase tracking-wider transition-colors ${
              role === "player"
                ? "border-b-2 border-[#1b4332] text-[#1b4332] dark:border-[#82d6a9] dark:text-[#82d6a9]"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            Player
          </button>
          <button
            type="button"
            onClick={() => handleSelectRole("scout")}
            className={`py-3 uppercase tracking-wider transition-colors ${
              role === "scout"
                ? "border-b-2 border-[#0f1c2e] text-[#0f1c2e] dark:border-[#82d6a9] dark:text-[#82d6a9]"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
            }`}
          >
            Scout
          </button>
        </div>

        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`h-2 w-2 rounded-none ${
                role === "player" ? "bg-[#1b4332] dark:bg-[#82d6a9]" : "bg-[#0f1c2e] dark:bg-slate-300"
              }`}
            />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {roleMeta.label}
            </span>
          </div>
          <CardTitle className="text-xl font-bold">{roleMeta.title}</CardTitle>
          <CardDescription>{roleMeta.desc}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-sm border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder={role === "coach" ? "coach@academy.com" : role === "player" ? "player@academy.com" : "scout@agency.com"}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="••••••••"
              />
            </div>

            {/* Quick prefill helper */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handlePrefillDemo}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              >
                Fill test credentials ({role}@apexacademy.demo)
              </button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              variant={role === "player" ? "forest" : "primary"}
            >
              {loading ? "Authenticating..." : `Sign In as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
            </Button>

            {/* Registration is shown strictly for the Player role */}
            <div className="flex items-center justify-between w-full pt-1 text-xs text-slate-500">
              <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-200">
                &larr; Role Selection
              </Link>

              {role === "player" ? (
                <Link
                  href="/register"
                  className="font-semibold text-[#1b4332] hover:underline dark:text-[#82d6a9]"
                >
                  Register as Player &rarr;
                </Link>
              ) : (
                <span className="text-[11px] text-slate-400">
                  Staff accounts provisioned by administration
                </span>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading sign in portal...</div>}>
      <LoginForm />
    </React.Suspense>
  );
}
