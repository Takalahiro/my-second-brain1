import type { WikiData } from '../../../components/graph/graph-data';

export type TerritoryStarHud = { ra: string; dec: string; sector: string };

export type TerritoryBodyProps = {
  ui: Record<string, string>;
  data: WikiData | null;
  loadErr: string | null;
  selectedPath: string | null;
  starHud: TerritoryStarHud;
  onSelectPath: (path: string | null) => void;
};
