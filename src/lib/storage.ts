import { Expression, HistoryEntry } from './types';

const EXPR_KEY = 'expressions_v1';
const HIST_KEY = 'history_v1';

function safeParse<T>(s: string | null, fallback: T): T {
  try {
    return s ? (JSON.parse(s) as T) : fallback;
  } catch (e) {
    return fallback;
  }
}

export function getExpressionsLocal(): Expression[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(EXPR_KEY);
  return safeParse<Expression[]>(raw, []);
}

export function saveExpressionsLocal(list: Expression[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EXPR_KEY, JSON.stringify(list));
}

export function saveExpressionLocal(expr: { text: string }) {
  const cur = getExpressionsLocal();
  const id = `e_${Date.now()}`;
  cur.push({ id, text: expr.text, selected: false, count: 0 });
  saveExpressionsLocal(cur);
}

export function toggleSelectLocal(id: string) {
  const cur = getExpressionsLocal();
  const found = cur.find((c) => c.id === id);
  if (found) found.selected = !found.selected;
  saveExpressionsLocal(cur);
}

export function incrementUsageCountLocal(id: string) {
  const cur = getExpressionsLocal();
  const found = cur.find((c) => c.id === id);
  if (found) found.count = (found.count || 0) + 1;
  saveExpressionsLocal(cur);
}

export function getHistoryLocal(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(HIST_KEY);
  return safeParse<HistoryEntry[]>(raw, []);
}

export function saveHistoryLocal(list: HistoryEntry[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HIST_KEY, JSON.stringify(list));
}

export function initializeSeedLocal(seed: Expression[]) {
  if (typeof window === 'undefined') return;
  const cur = getExpressionsLocal();
  if (cur.length === 0) {
    saveExpressionsLocal(seed);
  }
}
