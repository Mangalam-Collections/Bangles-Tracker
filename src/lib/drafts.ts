// Draft auto-save utilities using localStorage

const DRAFT_PREFIX = 'draft_';

export function saveDraft<T>(key: string, data: T): void {
  try {
    localStorage.setItem(DRAFT_PREFIX + key, JSON.stringify(data));
  } catch {}
}

export function loadDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(DRAFT_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDraft(key: string): void {
  localStorage.removeItem(DRAFT_PREFIX + key);
}
