export type CalEvent = { id: string; title: string; start: number; end: number; allDay: boolean };

export type CalCell = { date: Date; inMonth: boolean; events: CalEvent[]; today: boolean; day: number };

export type CalendarSettingsProps = {
  ui: Record<string, string>;
  urlInput: string;
  loading: boolean;
  syncError: string | null;
  lastSync: number | null;
  eventCount: number;
  fmtSync: (ts: number | null) => string;
  onUrlInputChange: (v: string) => void;
  onSaveUrl: () => void;
  onClearUrl: () => void;
  onSync: () => void;
  hasUrl: boolean;
};

export type CalendarBodyProps = {
  ui: Record<string, string>;
  monthLabel: string;
  cells: CalCell[];
  selectedDay: number | null;
  selectedEvents: CalEvent[];
  weekdayNames: string[];
  fmtEvent: (e: CalEvent) => string;
  cursorMonth: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectDay: (day: number) => void;
};
