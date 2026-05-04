import type { Note } from "../shared/notes.ts";
import {
  NOTES_KEY,
  addNote,
  deleteNote,
  loadNotes,
  updateNoteText,
} from "../shared/notes.ts";

const composer = document.querySelector<HTMLDivElement>("#draft");
const addBtn = document.querySelector<HTMLButtonElement>("#add-btn");
const list = document.querySelector<HTMLUListElement>("#notes-list");
const empty = document.querySelector<HTMLParagraphElement>("#empty");
const toolbar = document.querySelector<HTMLDivElement>("#toolbar");

if (!composer || !addBtn || !list || !empty || !toolbar) {
  throw new Error("Notes page DOM not ready");
}

let notes: Note[] = [];
let activeEditor: HTMLElement = composer;

attachEditorBehaviors(composer);
wireGlobalToolbar(toolbar);

composer.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    addBtn.click();
  }
});

addBtn.addEventListener("click", () => {
  const html = composer.innerHTML.trim();
  if (!html) return;
  void (async () => {
    await addNote(html);
    composer.innerHTML = "";
    await refresh();
  })();
});

void refresh();

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && NOTES_KEY in changes) {
    void refresh();
  }
});

async function refresh(): Promise<void> {
  notes = await loadNotes();
  render();
}

function render(): void {
  list!.innerHTML = "";
  for (const note of notes) {
    list!.append(createNoteCard(note));
  }
  empty!.hidden = notes.length > 0;

  const id = location.hash.slice(1);
  if (id) {
    const target = list!.querySelector<HTMLLIElement>(`[data-id="${id}"]`);
    if (target) {
      target.scrollIntoView({ block: "center" });
      target.querySelector<HTMLDivElement>(".editor")?.focus();
    }
  }
}

function createNoteCard(note: Note): HTMLLIElement {
  const li = document.createElement("li");
  li.className = "note";
  li.dataset.id = note.id;

  const editor = document.createElement("div");
  editor.className = "editor";
  editor.contentEditable = "true";
  editor.innerHTML = note.text || "";
  let timer: number | undefined;
  editor.addEventListener("input", () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      void updateNoteText(note.id, editor.innerHTML);
    }, 500);
  });
  attachEditorBehaviors(editor);

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

  li.append(editor, footer);
  return li;
}

function attachEditorBehaviors(editor: HTMLElement): void {
  editor.addEventListener("focus", () => {
    activeEditor = editor;
  });

  editor.addEventListener("paste", (e) => {
    const items = Array.from(e.clipboardData?.items ?? []);
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (!blob) continue;
        readAsDataURL(blob).then((url) => {
          insertImageInto(editor, url);
        });
      }
    }
  });

  editor.addEventListener("drop", (e) => {
    const files = Array.from(e.dataTransfer?.files ?? []);
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    e.preventDefault();
    for (const file of images) {
      readAsDataURL(file).then((url) => {
        insertImageInto(editor, url);
      });
    }
  });
}

function wireGlobalToolbar(tb: HTMLDivElement): void {
  tb.addEventListener("mousedown", (e) => {
    e.preventDefault();
  });
  tb.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
      "button[data-cmd]",
    );
    if (!btn) return;
    const cmd = btn.dataset.cmd;
    if (!cmd) return;
    activeEditor.focus();
    if (cmd === "image") {
      promptImage(activeEditor);
      return;
    }
    document.execCommand(cmd, false);
    activeEditor.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function promptImage(editor: HTMLElement): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    void readAsDataURL(file).then((url) => {
      insertImageInto(editor, url);
    });
  });
  input.click();
}

function insertImageInto(editor: HTMLElement, dataURL: string): void {
  editor.focus();
  document.execCommand("insertHTML", false, `<img src="${dataURL}" />`);
  editor.dispatchEvent(new Event("input", { bubbles: true }));
}

function readAsDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString();
}
