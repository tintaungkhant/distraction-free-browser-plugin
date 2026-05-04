export const NOTE_KEY = "note";

export interface NoteData {
  html: string;
  updatedAt: number;
}

const EMPTY: NoteData = { html: "", updatedAt: 0 };

export async function loadNote(): Promise<NoteData> {
  const raw = await chrome.storage.local.get(NOTE_KEY);
  const stored = raw[NOTE_KEY] as NoteData | undefined;
  return stored ?? EMPTY;
}

export async function saveNote(html: string): Promise<NoteData> {
  const data: NoteData = { html, updatedAt: Date.now() };
  await chrome.storage.local.set({ [NOTE_KEY]: data });
  return data;
}
