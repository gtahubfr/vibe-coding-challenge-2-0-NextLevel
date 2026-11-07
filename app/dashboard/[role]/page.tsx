import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Player } from "@/models/Player";
import { PracticeSession } from "@/models/PracticeSession";
import { MatchRecord } from "@/models/MatchRecord";
import { computePlayerReadiness, PlayerDocumentLike, SessionDocumentLike, MatchDocumentLike } from "@/lib/readiness";
import { CoachDashboard } from "@/components/dashboard/coach-dashboard";
import { PlayerDashboard } from "@/components/dashboard/player-dashboard";
import { ScoutDashboard } from "@/components/dashboard/scout-dashboard";
import { Button } from "@/components/ui/button";

export const instant = false;

interface PageProps {
  params: Promise<{ role: string }>;
}

export default async function RoleDashboardPage(props: PageProps) {
  const { role } = await props.params;
  const session = await getSession();

  if (!session) {
    redirect(`/login?role=${role}`);
  }

  // Strict server-side role restriction:
  // Do not allow a user to access a different role's dashboard by changing the URL
  if (session.role !== role) {
    redirect(`/dashboard/${session.role}`);
  }

  await connectToDatabase();

  // Load shared collections
  const rawSessions = await PracticeSession.find().sort({ date: -1 }).lean();
  const rawMatches = await MatchRecord.find().sort({ date: -1 }).lean();

  const sessions: SessionDocumentLike[] = rawSessions.map((s) => ({
    _id: s._id,
    status: s.status,
    attendeePlayerIds: (s.attendeePlayerIds || []).map((id) => id.toString()),
  }));

  const matches: MatchDocumentLike[] = rawMatches.map((m) => ({
    _id: m._id,
    playerIds: (m.playerIds || []).map((id) => id.toString()),
  }));

  // COACH VIEW
  if (role === "coach") {
    const rawPlayers = await Player.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const roster = rawPlayers.map((p) => {
      const u = typeof p.userId === "object" && p.userId !== null && "name" in p.userId
        ? (p.userId as { name?: string; email?: string })
        : null;

      const playerDoc: PlayerDocumentLike = {
        _id: p._id,
        sport: p.sport,
        position: p.position,
        jerseyNumber: p.jerseyNumber,
        userId: u,
      };

      return computePlayerReadiness(playerDoc, sessions, matches);
    });

    const sessionItems = rawSessions.map((s) => ({
      _id: s._id.toString(),
      title: s.title,
      sport: s.sport,
      date: s.date.toISOString(),
      status: s.status as "open" | "closed",
      attendeePlayerIds: (s.attendeePlayerIds || []).map((id) => id.toString()),
    }));

    const matchItems = rawMatches.map((m) => ({
      _id: m._id.toString(),
      opponent: m.opponent,
      sport: m.sport,
      date: m.date.toISOString(),
      ourScore: m.ourScore,
      opponentScore: m.opponentScore,
      playerIds: (m.playerIds || []).map((id) => id.toString()),
      notes: m.notes,
    }));

    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e4e8] pb-4 dark:border-[#222c3a]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Operations Center
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Head Coach Administration
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Active Session: {session.name} ({session.email})
            </p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <Button type="submit" variant="outline" size="sm">
              Sign Out
            </Button>
          </form>
        </div>
        <CoachDashboard roster={roster} sessions={sessionItems} matches={matchItems} />
      </div>
    );
  }

  // SCOUT VIEW
  if (role === "scout") {
    const rawPlayers = await Player.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    const allRoster = rawPlayers.map((p) => {
      const u = typeof p.userId === "object" && p.userId !== null && "name" in p.userId
        ? (p.userId as { name?: string; email?: string })
        : null;

      const playerDoc: PlayerDocumentLike = {
        _id: p._id,
        sport: p.sport,
        position: p.position,
        jerseyNumber: p.jerseyNumber,
        userId: u,
      };

      return computePlayerReadiness(playerDoc, sessions, matches);
    });

    // RULE: Scout must see only Ready players.
    const readyPlayers = allRoster.filter((p) => p.isReady);

    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e4e8] pb-4 dark:border-[#222c3a]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Talent Radar
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Talent Scout Inspection Radar
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Active Session: {session.name} ({session.email})
            </p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <Button type="submit" variant="outline" size="sm">
              Sign Out
            </Button>
          </form>
        </div>
        <ScoutDashboard readyPlayers={readyPlayers} />
      </div>
    );
  }

  // PLAYER VIEW
  let playerRecord = await Player.findOne({ userId: session.userId })
    .populate("userId", "name email")
    .lean();

  if (!playerRecord) {
    playerRecord = await Player.create({
      userId: session.userId,
      sport: "Football",
      position: "General",
      status: "active",
    });
  }

  const pDoc: PlayerDocumentLike = {
    _id: playerRecord._id,
    sport: playerRecord.sport,
    position: playerRecord.position,
    jerseyNumber: playerRecord.jerseyNumber,
    userId: { name: session.name, email: session.email },
  };

  const pIdStr = playerRecord._id.toString();
  const stats = computePlayerReadiness(pDoc, sessions, matches);

  const playerMatches = rawMatches
    .filter((m) => (m.playerIds || []).some((id) => id.toString() === pIdStr))
    .map((m) => ({
      _id: m._id.toString(),
      opponent: m.opponent,
      date: m.date.toISOString(),
      ourScore: m.ourScore,
      opponentScore: m.opponentScore,
      notes: m.notes,
    }));

  const sessionHistory = rawSessions.map((s) => ({
    _id: s._id.toString(),
    title: s.title,
    date: s.date.toISOString(),
    sport: s.sport,
    status: s.status as "open" | "closed",
    attended: (s.attendeePlayerIds || []).some((id) => id.toString() === pIdStr),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e2e4e8] pb-4 dark:border-[#222c3a]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Athlete Portal
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Personal Performance &amp; Attendance Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active Session: {session.name} &bull; {playerRecord.sport} ({playerRecord.position})
          </p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <Button type="submit" variant="outline" size="sm">
            Sign Out
          </Button>
        </form>
      </div>
      <PlayerDashboard
        stats={stats}
        matches={playerMatches}
        sessionHistory={sessionHistory}
      />
    </div>
  );
}

