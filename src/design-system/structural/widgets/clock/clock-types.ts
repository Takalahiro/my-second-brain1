export type ClockBodyProps = {
  ui: Record<string, string>;
  timeStr: string;
  pinned?: boolean;
  onClose?: () => void;
};
