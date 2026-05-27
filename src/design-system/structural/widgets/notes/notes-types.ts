export type NoteItem = { slug: string; title: string; description?: string };

export type NotesBodyProps = {
  ui: Record<string, string>;
  notes: NoteItem[];
  index: number;
  contentText: string;
  onPick: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
};
