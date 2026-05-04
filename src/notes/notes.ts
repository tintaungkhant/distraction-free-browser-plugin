import { loadNote, saveNote } from "../shared/notes.ts";

const editor = document.querySelector<HTMLDivElement>("#editor");
const toolbar = document.querySelector<HTMLDivElement>("#toolbar");
const status = document.querySelector<HTMLSpanElement>("#status");

if (!editor || !toolbar || !status) {
  throw new Error("Notes page DOM not ready");
}

let saveTimer: number | undefined;

void init();

editor.addEventListener("input", scheduleSave);
editor.addEventListener("paste", handlePaste);
editor.addEventListener("drop", handleDrop);

toolbar.addEventListener("mousedown", (e) => e.preventDefault());
toolbar.addEventListener("click", handleToolbarClick);

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    flushSave();
  }
});

async function init(): Promise<void> {
  const data = await loadNote();
  setNoteHTML(data.html);
  if (data.updatedAt) {
    setStatus(`Last saved ${formatTime(data.updatedAt)}`);
  } else {
    setStatus("");
  }
}

function setNoteHTML(html: string): void {
  const doc = new DOMParser().parseFromString(html, "text/html");
  sanitize(doc.body);
  editor!.replaceChildren(...Array.from(doc.body.childNodes));
}

function sanitize(root: ParentNode): void {
  const dangerous = root.querySelectorAll(
    "script, iframe, object, embed, form, link, meta, style",
  );
  dangerous.forEach((el) => el.remove());

  root.querySelectorAll("*").forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith("on")) {
        el.removeAttribute(attr.name);
        return;
      }
      if (
        (attr.name === "href" || attr.name === "src") &&
        /^\s*javascript:/i.test(attr.value)
      ) {
        el.removeAttribute(attr.name);
      }
    });
  });
}

function scheduleSave(): void {
  setStatus("Saving…");
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(flushSave, 400);
}

function flushSave(): void {
  window.clearTimeout(saveTimer);
  void saveNote(editor!.innerHTML).then((data) => {
    setStatus(`Saved ${formatTime(data.updatedAt)}`);
  });
}

function handleToolbarClick(e: MouseEvent): void {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
    "button[data-cmd]",
  );
  if (!btn) return;
  const cmd = btn.dataset.cmd;
  if (!cmd) return;

  editor!.focus();

  if (cmd === "image") {
    promptImage();
    return;
  }
  if (cmd === "clock") {
    document.execCommand(
      "insertText",
      false,
      `\u{1F552} ${formatStamp(Date.now())} \u{1F552} `,
    );
    editor!.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  document.execCommand(cmd, false);
  editor!.dispatchEvent(new Event("input", { bubbles: true }));
}

function handlePaste(e: ClipboardEvent): void {
  const items = Array.from(e.clipboardData?.items ?? []);
  for (const item of items) {
    if (!item.type.startsWith("image/")) continue;
    e.preventDefault();
    const blob = item.getAsFile();
    if (!blob) continue;
    void readAsDataURL(blob).then(insertImage);
  }
}

function handleDrop(e: DragEvent): void {
  const files = Array.from(e.dataTransfer?.files ?? []);
  const images = files.filter((f) => f.type.startsWith("image/"));
  if (images.length === 0) return;
  e.preventDefault();
  for (const file of images) {
    void readAsDataURL(file).then(insertImage);
  }
}

function insertImage(dataURL: string): void {
  editor!.focus();
  const img = document.createElement("img");
  img.src = dataURL;

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !editor!.contains(sel.anchorNode)) {
    editor!.appendChild(img);
  } else {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(img);
    range.setStartAfter(img);
    range.setEndAfter(img);
    sel.removeAllRanges();
    sel.addRange(range);
  }
  editor!.dispatchEvent(new Event("input", { bubbles: true }));
}

function promptImage(): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    void readAsDataURL(file).then(insertImage);
  });
  input.click();
}

function readAsDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function setStatus(text: string): void {
  status!.textContent = text;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString();
}

function formatStamp(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number): string => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
