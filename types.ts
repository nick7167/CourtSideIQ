export interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  time: string;
  date: string;
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
  protocolAnalysis: {
    refereeFactor?: string;
    injuryIntel?: string;
    schemeMismatch?: string;
    sharpMoney?: string;
  };
}

export interface AnalysisResult {
  game: Game;
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
