import type { Note } from "../shared/notes.ts";
import {
  NOTES_KEY,
  addNote,
  deleteNote,
  loadNotes,
  updateNoteText,
} from "../shared/notes.ts";

const draft = document.querySelector<HTMLTextAreaElement>("#draft");
const addBtn = document.querySelector<HTMLButtonElement>("#add-btn");
const list = document.querySelector<HTMLUListElement>("#notes-list");
const empty = document.querySelector<HTMLParagraphElement>("#empty");

if (!draft || !addBtn || !list || !empty) {
  throw new Error("Notes page DOM not ready");
}

let notes: Note[] = [];

async function refresh(): Promise<void> {
  notes = await loadNotes();
  render();
}

function render(): void {
  list!.innerHTML = "";
  for (const note of notes) {
    const li = document.createElement("li");
    li.className = "note";
    li.dataset.id = note.id;

    const ta = document.createElement("textarea");
    ta.value = note.text;
    ta.rows = 3;
    let timer: number | undefined;
    ta.addEventListener("input", () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void updateNoteText(note.id, ta.value);
      }, 400);
    });

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = formatDate(note.updatedAt);

    const del = document.createElement("button");
    del.className = "del";
    del.textContent = "Delete";
    del.addEventListener("click", () => {
      void (async () => {
        await deleteNote(note.id);
        await refresh();
      })();
    });

    const footer = document.createElement("div");
    footer.className = "note-footer";
    footer.append(meta, del);

    li.append(ta, footer);
    list!.append(li);
  }
  empty!.hidden = notes.length > 0;

  const id = location.hash.slice(1);
  if (id) {
    const target = list!.querySelector<HTMLLIElement>(`[data-id="${id}"]`);
    if (target) {
      target.scrollIntoView({ block: "center" });
      target.querySelector("textarea")?.focus();
    }
  }
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString();
}

addBtn.addEventListener("click", () => {
  const text = draft!.value.trim();
  if (!text) return;
  void (async () => {
    await addNote(text);
    draft!.value = "";
    await refresh();
  })();
});

draft.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    addBtn!.click();
  }
});

void refresh();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && NOTES_KEY in changes) {
    void refresh();
  }
});
