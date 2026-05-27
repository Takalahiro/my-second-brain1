export type WorldCity = {
  id: string;
  name: string;
  code: string;
  tz: string;
  lat: number;
  lon: number;
  flag: string;
};

export type WorldSlot = WorldCity & { ready: boolean };

export type WorldClockBodyProps = {
  ui: Record<string, string>;
  slots: WorldSlot[];
  active: number;
  formatTime: (tz: string) => string;
  formatDate: (tz: string) => string;
  tzOffset: (tz: string) => string;
  onPick: (i: number) => void;
};
