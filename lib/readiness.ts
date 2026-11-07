export interface PlayerReadinessStats {
  playerId: string;
  name: string;
  email?: string;
  sport: string;
  position: string;
  jerseyNumber?: number;
  totalHeldSessions: number;
  presentSessions: number;
  attendancePercentage: number;
  matchesPlayed: number;
  isReady: boolean;
  readinessReason: string;
}

export interface PlayerDocumentLike {
  _id: { toString(): string };
  sport: string;
  position: string;
  jerseyNumber?: number;
  userId?: { name?: string; email?: string } | null;
}

export interface SessionDocumentLike {
  _id: unknown;
  status?: string;
  attendeePlayerIds: Array<{ toString(): string }>;
}

export interface MatchDocumentLike {
  _id: unknown;
  playerIds: Array<{ toString(): string }>;
}

/**
 * Calculates attendance as (present sessions / held sessions) * 100.
 * A player is Ready only when attendance is >= 75% AND they have played >= 2 matches.
 */
export function computePlayerReadiness(
  player: PlayerDocumentLike,
  allSessions: SessionDocumentLike[],
  allMatches: MatchDocumentLike[]
): PlayerReadinessStats {
  const pId = player._id.toString();
  const totalHeldSessions = allSessions.length;

  const presentSessions = allSessions.filter((session) =>
    session.attendeePlayerIds.some((id) => id.toString() === pId)
  ).length;

  const attendancePercentage =
    totalHeldSessions > 0
      ? Math.round((presentSessions / totalHeldSessions) * 100)
      : 0;

  const matchesPlayed = allMatches.filter((match) =>
    match.playerIds.some((id) => id.toString() === pId)
  ).length;

  const attendancePass = attendancePercentage >= 75;
  const matchPass = matchesPlayed >= 2;
  const isReady = attendancePass && matchPass;

  let readinessReason = "Ready for competition selection and scouting.";
  if (!isReady) {
    const reasons: string[] = [];
    if (!attendancePass) {
      reasons.push(`Attendance is ${attendancePercentage}% (requires >= 75%)`);
    }
    if (!matchPass) {
      reasons.push(`${matchesPlayed} match(es) played (requires >= 2)`);
    }
    readinessReason = `Not Ready: ${reasons.join(", ")}`;
  }

  return {
    playerId: pId,
    name: player.userId?.name || "Player",
    email: player.userId?.email,
    sport: player.sport,
    position: player.position,
    jerseyNumber: player.jerseyNumber,
    totalHeldSessions,
    presentSessions,
    attendancePercentage,
    matchesPlayed,
    isReady,
    readinessReason,
  };
}

