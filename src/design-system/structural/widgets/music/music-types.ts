import type { TrackEntry } from '../../../../lib/media';

export type MusicBodyProps = {
  ui: Record<string, string>;
  tracks: TrackEntry[];
  index: number;
  playing: boolean;
  progress: number;
  position: number;
  duration: number;
  showList: boolean;
  current: TrackEntry | undefined;
  timeStr: (t: number) => string;
  onToggleList: () => void;
  onPickTrack: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onTogglePlay: () => void;
  onSeek: (v: number) => void;
  onSeekEnd: () => void;
};
