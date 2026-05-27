export type TodoItemView = {
  id: string;
  text: string;
  done: boolean;
};

export type TodoBodyProps = {
  items: TodoItemView[];
  draft: string;
  doneCount: number;
  total: number;
  deletingIds: ReadonlySet<string>;
  lastAddedId: string | null;
  saveFlash: boolean;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onDraftChange: (v: string) => void;
  onAdd: () => void;
};
