"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayerReadinessStats } from "@/lib/readiness";

interface SessionItem {
  _id: string;
  title: string;
  sport: string;
  date: string;
  status: "open" | "closed";
  attendeePlayerIds: string[];
}

interface MatchItem {
  _id: string;
  opponent: string;
  sport: string;
  date: string;
  ourScore: number;
  opponentScore: number;
  playerIds: string[];
  notes?: string;
}

interface CoachDashboardProps {
  roster: PlayerReadinessStats[];
  sessions: SessionItem[];
  matches: MatchItem[];
}

export function CoachDashboard({ roster, sessions, matches }: CoachDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"roster" | "sessions" | "matches">("roster");

  // Add Player State
  const [showAddPlayer, setShowAddPlayer] = React.useState(false);
  const [newPlayer, setNewPlayer] = React.useState({
    name: "",
    email: "",
    password: "Password123!",
    sport: "Football",
    position: "Forward",
    jerseyNumber: "10",
  });
  const [addingPlayer, setAddingPlayer] = React.useState(false);

  // Add Session State
  const [showAddSession, setShowAddSession] = React.useState(false);
  const [newSession, setNewSession] = React.useState({
    title: "",
    sport: "Football",
    date: new Date().toISOString().split("T")[0],
  });
  const [addingSession, setAddingSession] = React.useState(false);

  // Attendance Marking State
  const [editingSessionId, setEditingSessionId] = React.useState<string | null>(null);
  const [selectedAttendees, setSelectedAttendees] = React.useState<string[]>([]);
  const [savingAttendance, setSavingAttendance] = React.useState(false);

  // Add Match State
  const [showAddMatch, setShowAddMatch] = React.useState(false);
  const [newMatch, setNewMatch] = React.useState({
    opponent: "",
    sport: "Football",
    date: new Date().toISOString().split("T")[0],
    ourScore: 0,
    opponentScore: 0,
    playerIds: [] as string[],
    notes: "",
  });
  const [addingMatch, setAddingMatch] = React.useState(false);

  const [message, setMessage] = React.useState<{ text: string; error?: boolean } | null>(null);

  const readyCount = roster.filter((p) => p.isReady).length;

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingPlayer(true);
    setMessage(null);
    try {
      const res = await fetch("/api/coach/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlayer),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add player");

      setMessage({ text: `Athlete ${newPlayer.name} enrolled to roster.` });
      setShowAddPlayer(false);
      setNewPlayer({
        name: "",
        email: "",
        password: "Password123!",
        sport: "Football",
        position: "Forward",
        jerseyNumber: "10",
      });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Error adding player", error: true });
    } finally {
      setAddingPlayer(false);
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingSession(true);
    setMessage(null);
    try {
      const res = await fetch("/api/coach/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSession),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create session");

      setMessage({ text: `Practice session "${newSession.title}" opened.` });
      setShowAddSession(false);
      setNewSession({
        title: "",
        sport: "Football",
        date: new Date().toISOString().split("T")[0],
      });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Error creating session", error: true });
    } finally {
      setAddingSession(false);
    }
  };

  const handleOpenAttendanceModal = (session: SessionItem) => {
    if (session.status === "closed") {
      setMessage({ text: "Session is closed. Attendance records are locked.", error: true });
      return;
    }
    setEditingSessionId(session._id);
    setSelectedAttendees(session.attendeePlayerIds || []);
  };

  const handleToggleAttendee = (playerId: string) => {
    setSelectedAttendees((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId]
    );
  };

  const handleSaveAttendance = async () => {
    if (!editingSessionId) return;
    setSavingAttendance(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/coach/sessions/${editingSessionId}/attendance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendeePlayerIds: selectedAttendees }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update attendance");

      setMessage({ text: "Practice attendance saved successfully." });
      setEditingSessionId(null);
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Error saving attendance", error: true });
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleCloseSession = async (sessionId: string) => {
    setMessage(null);
    try {
      const res = await fetch(`/api/coach/sessions/${sessionId}/close`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to close session");

      setMessage({ text: "Session closed. Attendance permanently locked." });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Error closing session", error: true });
    }
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMatch(true);
    setMessage(null);
    try {
      const res = await fetch("/api/coach/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMatch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record match");

      setMessage({ text: `Fixture vs ${newMatch.opponent} recorded.` });
      setShowAddMatch(false);
      setNewMatch({
        opponent: "",
        sport: "Football",
        date: new Date().toISOString().split("T")[0],
        ourScore: 0,
        opponentScore: 0,
        playerIds: [],
        notes: "",
      });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Error recording match", error: true });
    } finally {
      setAddingMatch(false);
    }
  };

  const handleToggleMatchPlayer = (playerId: string) => {
    setNewMatch((prev) => ({
      ...prev,
      playerIds: prev.playerIds.includes(playerId)
        ? prev.playerIds.filter((id) => id !== playerId)
        : [...prev.playerIds, playerId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {message && (
        <div
          className={`border p-3 text-xs font-medium rounded-sm ${
            message.error
              ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300"
              : "border-[#b7dfca] bg-[#edf7ed] text-[#1b4332] dark:border-[#1b4332] dark:bg-[#12281d] dark:text-[#82d6a9]"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* KPI Status Strip (4 columns) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border border-[#e2e4e8] bg-white p-3.5 rounded-sm dark:border-[#222c3a] dark:bg-[#141c26]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Athletes</span>
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">{roster.length}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Active squad members</span>
        </div>
        <div className="border border-[#e2e4e8] bg-white p-3.5 rounded-sm dark:border-[#222c3a] dark:bg-[#141c26]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Practice Sessions</span>
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">{sessions.length}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Held this season</span>
        </div>
        <div className="border border-[#e2e4e8] bg-white p-3.5 rounded-sm dark:border-[#222c3a] dark:bg-[#141c26]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Recorded Fixtures</span>
          <span className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1 block">{matches.length}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Completed matches</span>
        </div>
        <div className="border border-[#e2e4e8] bg-white p-3.5 rounded-sm dark:border-[#222c3a] dark:bg-[#141c26]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1b4332] dark:text-[#82d6a9] block">
            Ready Athletes
          </span>
          <span className="text-xl font-bold text-[#1b4332] dark:text-[#82d6a9] mt-1 block">{readyCount}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Qualified for scouting</span>
        </div>
      </div>

      {/* Section Navigation Tabs */}
      <div className="flex border-b border-[#e2e4e8] dark:border-[#222c3a]">
        <button
          onClick={() => setActiveTab("roster")}
          className={`border-b-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === "roster"
              ? "border-[#0f1c2e] text-[#0f1c2e] dark:border-[#82d6a9] dark:text-[#82d6a9]"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          Roster &amp; Readiness ({roster.length})
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`border-b-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === "sessions"
              ? "border-[#0f1c2e] text-[#0f1c2e] dark:border-[#82d6a9] dark:text-[#82d6a9]"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          Practice Sessions ({sessions.length})
        </button>
        <button
          onClick={() => setActiveTab("matches")}
          className={`border-b-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTab === "matches"
              ? "border-[#0f1c2e] text-[#0f1c2e] dark:border-[#82d6a9] dark:text-[#82d6a9]"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          Match Fixtures ({matches.length})
        </button>
      </div>

      {/* TAB 1: ROSTER & READINESS */}
      {activeTab === "roster" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Squad Roster &amp; Qualification
              </h3>
              <p className="text-xs text-slate-500">
                Standard: Attendance &ge; 75% across held sessions AND &ge; 2 recorded match appearances.
              </p>
            </div>
            <Button size="sm" variant="forest" onClick={() => setShowAddPlayer((prev) => !prev)}>
              {showAddPlayer ? "Cancel Form" : "Enroll New Player"}
            </Button>
          </div>

          {showAddPlayer && (
            <Card className="border-[#cbd5e1] bg-[#f7f7f4] p-4 dark:border-[#222c3a] dark:bg-[#141c26]">
              <form onSubmit={handleAddPlayer} className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  New Athlete Enrollment
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Full Name
                    </label>
                    <input
                      required
                      value={newPlayer.name}
                      onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                      placeholder="e.g. Leo Hayes"
                      className="w-full rounded-sm border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Email Address
                    </label>
                    <input
                      required
                      type="email"
                      value={newPlayer.email}
                      onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
                      placeholder="leo@academy.com"
                      className="w-full rounded-sm border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Initial Password
                    </label>
                    <input
                      required
                      type="password"
                      value={newPlayer.password}
                      onChange={(e) => setNewPlayer({ ...newPlayer, password: e.target.value })}
                      className="w-full rounded-sm border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Sport
                    </label>
                    <input
                      value={newPlayer.sport}
                      onChange={(e) => setNewPlayer({ ...newPlayer, sport: e.target.value })}
                      className="w-full rounded-sm border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Position
                    </label>
                    <input
                      value={newPlayer.position}
                      onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                      className="w-full rounded-sm border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Jersey Number
                    </label>
                    <input
                      type="number"
                      value={newPlayer.jerseyNumber}
                      onChange={(e) => setNewPlayer({ ...newPlayer, jerseyNumber: e.target.value })}
                      className="w-full rounded-sm border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <Button type="submit" size="sm" variant="forest" disabled={addingPlayer}>
                    {addingPlayer ? "Enrolling..." : "Save Athlete"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Roster Data Table */}
          <div className="border border-[#e2e4e8] bg-white rounded-sm overflow-x-auto dark:border-[#222c3a] dark:bg-[#141c26]">
            <table className="min-w-full divide-y divide-[#e2e4e8] text-xs dark:divide-[#222c3a]">
              <thead className="bg-[#f7f7f4] dark:bg-[#0d131a]">
                <tr>
                  <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Athlete
                  </th>
                  <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Discipline / Position
                  </th>
                  <th className="px-4 py-2.5 text-center font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Attendance Rate
                  </th>
                  <th className="px-4 py-2.5 text-center font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Matches
                  </th>
                  <th className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Qualification Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e4e8] dark:divide-[#222c3a]">
                {roster.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      No athletes currently registered in squad. Click &quot;Enroll New Player&quot; to begin.
                    </td>
                  </tr>
                ) : (
                  roster.map((p) => (
                    <tr key={p.playerId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {p.name}
                          {p.jerseyNumber && (
                            <span className="ml-1 text-[11px] text-slate-400">#{p.jerseyNumber}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{p.email}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {p.sport} &bull; {p.position}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {p.attendancePercentage}%
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {p.presentSessions} of {p.totalHeldSessions} sessions
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-slate-100">
                        {p.matchesPlayed}
                      </td>
                      <td className="px-4 py-3">
                        {p.isReady ? (
                          <Badge variant="success">READY</Badge>
                        ) : (
                          <div>
                            <Badge variant="warning">NOT READY</Badge>
                            <span className="block mt-1 text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                              {p.readinessReason}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PRACTICE SESSIONS */}
      {activeTab === "sessions" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Practice Sessions &amp; Attendance Records
              </h3>
              <p className="text-xs text-slate-500">
                Attendance sheets can be updated while open. Closing a session permanently locks attendance records.
              </p>
            </div>
            <Button size="sm" variant="forest" onClick={() => setShowAddSession((prev) => !prev)}>
              {showAddSession ? "Cancel Form" : "Create Practice Session"}
            </Button>
          </div>

          {showAddSession && (
            <Card className="border-[#cbd5e1] bg-[#f7f7f4] p-4 dark:border-[#222c3a] dark:bg-[#141c26]">
              <form onSubmit={handleAddSession} className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Open Practice Session
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Session Title
                    </label>
                    <input
                      required
                      value={newSession.title}
                      onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                      placeholder="e.g. Tactical Passing & Conditioning"
                      className="w-full rounded-sm border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Sport
                    </label>
                    <input
                      value={newSession.sport}
                      onChange={(e) => setNewSession({ ...newSession, sport: e.target.value })}
                      className="w-full rounded-sm border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newSession.date}
                      onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                      className="w-full rounded-sm border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <Button type="submit" size="sm" variant="forest" disabled={addingSession}>
                    {addingSession ? "Opening..." : "Open Session"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Interactive Attendance Modal / Tray */}
          {editingSessionId && (
            <Card className="border-slate-400 bg-white p-4 dark:border-slate-600 dark:bg-[#141c26]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Record Attendance Sheet
                  </h4>
                  <p className="text-xs text-slate-500">
                    Check all athletes present at this practice ({selectedAttendees.length} marked present).
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setEditingSessionId(null)}>
                  Cancel
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 py-4 max-h-56 overflow-y-auto">
                {roster.map((player) => {
                  const isPresent = selectedAttendees.includes(player.playerId);
                  return (
                    <label
                      key={player.playerId}
                      className={`flex items-center gap-2 p-2 rounded-sm border cursor-pointer text-xs select-none ${
                        isPresent
                          ? "bg-[#edf7ed] border-[#b7dfca] text-[#1b4332] dark:bg-[#12281d] dark:border-[#1b4332] dark:text-[#82d6a9]"
                          : "bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isPresent}
                        onChange={() => handleToggleAttendee(player.playerId)}
                        className="rounded-sm"
                      />
                      <span className="font-semibold">{player.name}</span>
                      <span className="text-[11px] text-slate-400">({player.position})</span>
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <Button size="sm" variant="primary" onClick={handleSaveAttendance} disabled={savingAttendance}>
                  {savingAttendance ? "Saving..." : "Save Attendance Sheet"}
                </Button>
              </div>
            </Card>
          )}

          {/* Sessions List */}
          <div className="border border-[#e2e4e8] bg-white rounded-sm divide-y divide-[#e2e4e8] dark:border-[#222c3a] dark:bg-[#141c26] dark:divide-[#222c3a]">
            {sessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No practice sessions recorded yet. Click &quot;Create Practice Session&quot; to begin.
              </div>
            ) : (
              sessions.map((s) => (
                <div key={s._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{s.title}</span>
                      <Badge variant={s.status === "open" ? "success" : "default"}>
                        {s.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-slate-500 mt-1">
                      Date: {new Date(s.date).toLocaleDateString()} &bull; Sport: {s.sport} &bull;{" "}
                      <strong>{s.attendeePlayerIds?.length || 0}</strong> attendee(s) present
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {s.status === "open" ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenAttendanceModal(s)}
                        >
                          Mark Attendance
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCloseSession(s._id)}
                        >
                          Close Session
                        </Button>
                      </>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-sm border border-slate-200 dark:border-slate-700">
                        Attendance Locked
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MATCHES & SCORES */}
      {activeTab === "matches" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Official Match Fixtures
              </h3>
              <p className="text-xs text-slate-500">
                Record final scores and player lineups. Each fixture appearance counts toward the qualification minimum of 2 matches.
              </p>
            </div>
            <Button size="sm" variant="forest" onClick={() => setShowAddMatch((prev) => !prev)}>
              {showAddMatch ? "Cancel Form" : "Record Match Fixture"}
            </Button>
          </div>

          {showAddMatch && (
            <Card className="border-[#cbd5e1] bg-[#f7f7f4] p-4 dark:border-[#222c3a] dark:bg-[#141c26]">
              <form onSubmit={handleAddMatch} className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Record Fixture Sheet
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Opponent Team
                    </label>
                    <input
                      required
                      value={newMatch.opponent}
                      onChange={(e) => setNewMatch({ ...newMatch, opponent: e.target.value })}
                      placeholder="e.g. Metro Academy FC"
                      className="w-full rounded-sm border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Fixture Date
                    </label>
                    <input
                      type="date"
                      value={newMatch.date}
                      onChange={(e) => setNewMatch({ ...newMatch, date: e.target.value })}
                      className="w-full rounded-sm border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Academy Score
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newMatch.ourScore}
                      onChange={(e) => setNewMatch({ ...newMatch, ourScore: Number(e.target.value) })}
                      className="w-full rounded-sm border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Opponent Score
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={newMatch.opponentScore}
                      onChange={(e) =>
                        setNewMatch({ ...newMatch, opponentScore: Number(e.target.value) })
                      }
                      className="w-full rounded-sm border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                    Participating Lineup ({newMatch.playerIds.length} players selected)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-2 bg-white rounded-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-900">
                    {roster.map((player) => (
                      <label key={player.playerId} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={newMatch.playerIds.includes(player.playerId)}
                          onChange={() => handleToggleMatchPlayer(player.playerId)}
                          className="rounded-sm"
                        />
                        <span className="truncate">{player.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                    Technical Notes
                  </label>
                  <input
                    value={newMatch.notes}
                    onChange={(e) => setNewMatch({ ...newMatch, notes: e.target.value })}
                    placeholder="e.g. Clean defensive execution; strong tactical discipline"
                    className="w-full rounded-sm border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <Button type="submit" size="sm" variant="forest" disabled={addingMatch}>
                    {addingMatch ? "Saving..." : "Save Match"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Match Log */}
          <div className="border border-[#e2e4e8] bg-white rounded-sm divide-y divide-[#e2e4e8] dark:border-[#222c3a] dark:bg-[#141c26] dark:divide-[#222c3a]">
            {matches.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No fixtures logged yet. Click &quot;Record Match Fixture&quot; to file scores.
              </div>
            ) : (
              matches.map((m) => {
                const isWin = m.ourScore > m.opponentScore;
                const isDraw = m.ourScore === m.opponentScore;
                return (
                  <div key={m._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          Apex Academy vs {m.opponent}
                        </span>
                        <Badge variant={isWin ? "success" : isDraw ? "warning" : "default"}>
                          {isWin ? "WIN" : isDraw ? "DRAW" : "LOSS"}
                        </Badge>
                      </div>
                      <div className="text-slate-500 mt-1">
                        Date: {new Date(m.date).toLocaleDateString()} &bull; Lineup: {m.playerIds?.length || 0} players &bull; {m.notes}
                      </div>
                    </div>

                    <div className="font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
                      {m.ourScore} - {m.opponentScore}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
