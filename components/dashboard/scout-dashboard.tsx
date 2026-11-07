"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { PlayerReadinessStats } from "@/lib/readiness";

interface ScoutDashboardProps {
  readyPlayers: PlayerReadinessStats[];
}

export function ScoutDashboard({ readyPlayers }: ScoutDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Scout Editorial Header */}
      <div className="border border-[#e2e4e8] bg-white p-6 rounded-sm dark:border-[#222c3a] dark:bg-[#141c26]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Talent Discovery Network
              </span>
              <Badge variant="success">Verified Ready Only</Badge>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Competition-Ready Athletes ({readyPlayers.length})
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              By academy regulation, this radar is strictly restricted to athletes who have satisfied
              the regulatory threshold: minimum 75% practice attendance and at least 2 recorded match appearances.
            </p>
          </div>

          <div className="border border-[#e2e4e8] bg-[#f7f7f4] p-4 rounded-sm text-center min-w-[140px] dark:border-[#222c3a] dark:bg-[#0d131a]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b4332] dark:text-[#82d6a9] block">
              Qualified
            </span>
            <span className="text-3xl font-black text-[#1b4332] dark:text-[#82d6a9] block mt-0.5">
              {readyPlayers.length}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Ready for Scouting
            </span>
          </div>
        </div>
      </div>

      {/* Athletes List */}
      {readyPlayers.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white p-10 text-center rounded-sm dark:border-slate-700 dark:bg-[#141c26]">
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              No Athletes Currently Meet Readiness Threshold
            </h3>
            <p className="text-xs text-slate-500">
              Currently no registered athletes have achieved both &ge; 75% practice attendance and &ge; 2 recorded match appearances.
              As coaches log upcoming practices and fixtures, qualifying athletes will automatically populate this radar.
            </p>
          </div>
        </div>
      ) : (
        <div className="border border-[#e2e4e8] bg-white rounded-sm overflow-x-auto dark:border-[#222c3a] dark:bg-[#141c26]">
          <table className="min-w-full divide-y divide-[#e2e4e8] text-xs dark:divide-[#222c3a]">
            <thead className="bg-[#f7f7f4] dark:bg-[#0d131a]">
              <tr>
                <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Athlete Name
                </th>
                <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Sport &amp; Position
                </th>
                <th className="px-4 py-2.5 text-center font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Squad Number
                </th>
                <th className="px-4 py-2.5 text-center font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Attendance Rate
                </th>
                <th className="px-4 py-2.5 text-center font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Matches Played
                </th>
                <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Scout Verification
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e4e8] dark:divide-[#222c3a]">
              {readyPlayers.map((player) => (
                <tr key={player.playerId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {player.name}
                    </div>
                    <div className="text-[11px] text-slate-500">{player.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {player.sport} &bull; {player.position}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                    {player.jerseyNumber ? `#${player.jerseyNumber}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-bold text-[#1b4332] dark:text-[#82d6a9]">
                      {player.attendancePercentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      ({player.presentSessions}/{player.totalHeldSessions} sessions)
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-slate-100">
                    {player.matchesPlayed} fixture(s)
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="success">QUALIFIED &amp; READY</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
