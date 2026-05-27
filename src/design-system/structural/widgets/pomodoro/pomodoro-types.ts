export type PomodoroPhase = 'focus' | 'short' | 'long';

export type PomodoroBodyProps = {
  ui: Record<string, string>;
  phase: PomodoroPhase;
  running: boolean;
  mmss: string;
  onSetPhase: (p: PomodoroPhase) => void;
  onToggleStart: () => void;
};
