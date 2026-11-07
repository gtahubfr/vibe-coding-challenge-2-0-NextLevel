"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { PlayerReadinessStats } from "@/lib/readiness";

interface PlayerMatch {
  _id: string;
  opponent: string;
  date: string;
  ourScore: number;
  opponentScore: number;
  notes?: string;
}

interface PlayerSessionRecord {
  _id: string;
  title: string;
  date: string;
  sport: string;
  status: "open" | "closed";
  attended: boolean;
}

interface PlayerDashboardProps {
  stats: PlayerReadinessStats;
  matches: PlayerMatch[];
  sessionHistory: PlayerSessionRecord[];
}

export function PlayerDashboard({ stats, matches, sessionHistory }: PlayerDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Editorial Readiness Status Card */}
      <div className="border border-[#e2e4e8] bg-white p-6 rounded-sm dark:border-[#222c3a] dark:bg-[#141c26]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Regulatory Status Report
              </span>
              <Badge variant={stats.isReady ? "success" : "warning"}>
                {stats.isReady ? "READY FOR SCOUTING" : "INELIGIBLE"}
              </Badge>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {stats.isReady
                ? "Qualified for Competitive Selection and Scout Review"
                : "Qualification Requirements In Progress"}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {stats.readinessReason}
            </p>
          </div>

          <div className="border border-[#e2e4e8] bg-[#f7f7f4] p-4 rounded-sm text-center min-w-[140px] dark:border-[#222c3a] dark:bg-[#0d131a]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Attendance
            </span>
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100 block mt-0.5">
              {stats.attendancePercentage}%
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Goal: &ge; 75%
            </span>
          </div>
        </div>
      </div>

      {/* Metric Tiles (4 items in 2x2 or 4x1 grid, strictly avoiding 3 feature cards in a row) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="border border-[#e2e4e8] bg-white p-3.5 rounded-sm dark:border-[#222c3a] dark:bg-[#141c26]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Practice Attendance
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">
            {stats.attendancePercentage}%
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {stats.presentSessions} of {stats.totalHeldSessions} sessions attended
          </span>
        </div>

        <div className="border border-[#e2e4e8] bg-white p-3.5 rounded-sm dark:border-[#222c3a] dark:bg-[#141c26]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Match Appearances
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">
            {stats.matchesPlayed}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Minimum 2 required for readiness
          </span>
        </div>

        <div className="border border-[#e2e4e8] bg-white p-3.5 rounded-sm dark:border-[#222c3a] dark:bg-[#141c26]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Scouting Radar
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">
            {stats.isReady ? "Listed" : "Unlisted"}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {stats.isReady ? "Visible to scouting network" : "Hidden until criteria met"}
          </span>
        </div>

        <div className="border border-[#e2e4e8] bg-white p-3.5 rounded-sm dark:border-[#222c3a] dark:bg-[#141c26]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Squad Position
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 block truncate">
            {stats.position || "General"}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
            {stats.sport} {stats.jerseyNumber ? `(#${stats.jerseyNumber})` : ""}
          </span>
        </div>
      </div>

      {/* Two Column Layout: Match Log & Attendance Log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Match Fixtures Column */}
        <div className="border border-[#e2e4e8] bg-white p-5 rounded-sm dark:border-[#222c3a] dark:bg-[#141c26] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#e2e4e8] dark:border-[#222c3a]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Personal Match History ({matches.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Official fixtures where you were selected in the lineup.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
              {stats.matchesPlayed} App(s)
            </span>
          </div>

          {matches.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No match appearances recorded for your profile yet.
            </div>
          ) : (
            <div className="divide-y divide-[#e2e4e8] dark:divide-[#222c3a]">
              {matches.map((m) => {
                const isWin = m.ourScore > m.opponentScore;
                const isDraw = m.ourScore === m.opponentScore;
                return (
                  <div key={m._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          vs {m.opponent}
                        </span>
                        <Badge variant={isWin ? "success" : isDraw ? "warning" : "default"}>
                          {isWin ? "WIN" : isDraw ? "DRAW" : "LOSS"}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {new Date(m.date).toLocaleDateString()} {m.notes ? `• ${m.notes}` : ""}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                      {m.ourScore} - {m.opponentScore}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Practice Sessions Attendance Ledger */}
        <div className="border border-[#e2e4e8] bg-white p-5 rounded-sm dark:border-[#222c3a] dark:bg-[#141c26] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#e2e4e8] dark:border-[#222c3a]">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Practice Session Ledger ({sessionHistory.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Log of held academy practices and your attendance status.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400">
              {stats.presentSessions}/{stats.totalHeldSessions}
            </span>
          </div>

          {sessionHistory.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No academy practice sessions held yet this season.
            </div>
          ) : (
            <div className="divide-y divide-[#e2e4e8] dark:divide-[#222c3a] max-h-72 overflow-y-auto">
              {sessionHistory.map((s) => (
                <div key={s._id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{s.title}</span>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(s.date).toLocaleDateString()} &bull; Session: {s.status.toUpperCase()}
                    </div>
                  </div>
                  <Badge variant={s.attended ? "success" : "default"}>
                    {s.attended ? "PRESENT" : "ABSENT"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
