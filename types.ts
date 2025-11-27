
export interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  time: string;
  date: string;
  utcTime?: string;
}

export interface MarketContext {
  spread: string;
  total: string;
  summary: string;
}

export interface PropPrediction {
  player: string;
  team: string;
  stat: string; // e.g., "Points", "Rebounds + Assists"
  line: number;
  prediction: 'OVER' | 'UNDER';
  confidence: number; // 1-10
  rationale: string;
  xFactor: string;
  last5History: string; // e.g., "4/5"
  averageLast5: number;
  last5Values: number[]; // [20, 25, 18, 30, 22]
  opponentRank: string; // e.g. "28th (Soft)"
  protocolAnalysis: {
    refereeFactor?: string;
    injuryIntel?: string;
    schemeMismatch?: string;
    sharpMoney?: string;
  };
}

export interface AnalysisResult {
  game: Game;
  marketContext: MarketContext;
  props: PropPrediction[];
  sources: Source[];
}

export interface Source {
  title: string;
  uri: string;
}

export enum ViewState {
  HOME,
  LOADING_GAMES,
  SELECT_GAME,
  ANALYZING,
  RESULTS
}
