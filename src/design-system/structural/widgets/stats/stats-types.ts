export type StatTab = 'overview' | 'trend' | 'folders' | 'heat' | 'tags';

export type StatsFolder = { name: string; count: number; words: number };
export type StatsMonth = { month: string; label: string; count: number };
export type StatsTag = { name: string; count: number };
export type StatsDay = { date: string; count: number };

export type StatsData = {
  generatedAt: string;
  totalNotes: number;
  totalWords: number;
  byFolder: StatsFolder[];
  byMonth: StatsMonth[];
  topTags: StatsTag[];
  heatmap: StatsDay[];
};

export type StatsBodyProps = {
  ui: Record<string, string>;
  stats: StatsData | null;
  loadErr: string | null;
  tab: StatTab;
  tabs: Array<{ id: StatTab; label: string }>;
  maxFolder: number;
  maxMonth: number;
  maxTag: number;
  maxDay: number;
  monthPath: string;
  heatmapCols: (StatsDay | null)[][];
  dayColor: (count: number) => string;
  onTabChange: (tab: StatTab) => void;
};
