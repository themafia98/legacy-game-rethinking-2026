export interface LeaderboardEntry {
  readonly name: string;
  readonly points: number;
  readonly id: string;
  readonly ip: string;
  readonly realPlayer: boolean;
}

export interface ScoreSubmission {
  readonly name: string;
  readonly points: number;
  readonly ip: string;
}
