export interface Note {
  id: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

export const NOTES_KEY = "notes";

export async function loadNotes(): Promise<Note[]> {
  const raw = await chrome.storage.local.get(NOTES_KEY);
  const stored = raw[NOTES_KEY] as Note[] | undefined;
  return stored ?? [];
}

export async function saveNotes(notes: Note[]): Promise<void> {
  await chrome.storage.local.set({ [NOTES_KEY]: notes });
}

export async function addNote(text: string): Promise<Note> {
  const notes = await loadNotes();
  const now = Date.now();
  const note: Note = {
    id: crypto.randomUUID(),
    text,
    createdAt: now,
    updatedAt: now,
  };
  notes.unshift(note);
  await saveNotes(notes);
  return note;
}

export async function deleteNote(id: string): Promise<void> {
  const notes = await loadNotes();
  await saveNotes(notes.filter((n) => n.id !== id));
}

export async function updateNoteText(id: string, text: string): Promise<void> {
  const notes = await loadNotes();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx === -1) return;
  const existing = notes[idx];
  if (!existing) return;
  notes[idx] = { ...existing, text, updatedAt: Date.now() };
  await saveNotes(notes);
}
