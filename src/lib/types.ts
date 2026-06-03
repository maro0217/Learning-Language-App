export type Expression = {
  id: string;
  text: string;
  selected?: boolean;
  count?: number;
};

export type HistoryEntry = {
  expression: string;
  usedAt: string; // ISO
};
