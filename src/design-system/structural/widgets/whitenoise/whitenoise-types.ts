export type WhiteNoiseTrack = { key: string; enabled: boolean; volume: number; src: string; label: string };

export type WhiteNoiseBodyProps = {
  ui: Record<string, string>;
  tracks: WhiteNoiseTrack[];
  masterVol: number;
  onToggleTrack: (key: string, on: boolean) => void;
  onSetVol: (key: string, v: number) => void;
  onMasterVol: (v: number) => void;
};
