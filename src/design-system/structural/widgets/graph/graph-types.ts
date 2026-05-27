export type GraphNode = {
  id: string;
  title: string;
  folder: string;
  inDegree: number;
  outDegree: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fixed?: boolean;
  color: string;
};

export type GraphLink = { source: string; target: string; alias?: string | null };

export type GraphSettingsProps = {
  ui: Record<string, string>;
  bgAlpha: number;
  kRepel: number;
  edgeLen: number;
  folderFilter: string | null;
  folders: string[];
  onlyConnected: boolean;
  clickToOpen: boolean;
  onBgAlpha: (v: number) => void;
  onKRepel: (v: number) => void;
  onEdgeLen: (v: number) => void;
  onFolderFilter: (v: string | null) => void;
  onOnlyConnected: (v: boolean) => void;
  onClickToOpen: (v: boolean) => void;
  onRekick: () => void;
  onResetView: () => void;
};

export type GraphBodyProps = {
  ui: Record<string, string>;
  nodes: GraphNode[];
  links: GraphLink[];
  nodeMap: Map<string, GraphNode>;
  loadErr: string | null;
  folderFilter: string | null;
  selectedId: string | null;
  hoveredId: string | null;
  clickToOpen: boolean;
  simFrame: number;
  zoom: number;
  panX: number;
  panY: number;
  showDetail: boolean;
  noteHref: (id: string) => string;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
  onNodeClick: (id: string) => void;
  onGotoNote: (id: string) => void;
  onPanZoom: (panX: number, panY: number, zoom: number) => void;
  onNodeMove: (id: string, x: number, y: number) => void;
  onNodeDragEnd: (id: string) => void;
  onReheat: () => void;
};
