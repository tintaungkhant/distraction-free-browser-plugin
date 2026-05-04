import type { BlockingState, SiteKey } from "./types.ts";
import { DEFAULT_STATE, STORAGE_KEY } from "./types.ts";

export const DISABLED_CLASS = "dfb-disabled";

export async function loadState(): Promise<BlockingState> {
  const raw = await chrome.storage.local.get(STORAGE_KEY);
  const stored = raw[STORAGE_KEY] as Partial<BlockingState> | undefined;
  return { ...DEFAULT_STATE, ...stored };
}

export async function saveState(state: BlockingState): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: state });
}

export function applyEnabled(enabled: boolean): void {
  document.documentElement.classList.toggle(DISABLED_CLASS, !enabled);
}

export function watchSiteChanges(
  site: SiteKey,
  onChange: (enabled: boolean) => void,
): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    const change = changes[STORAGE_KEY];
    if (!change) return;
    const next = change.newValue as Partial<BlockingState> | undefined;
    const merged = { ...DEFAULT_STATE, ...next };
    onChange(merged[site]);
  });
}

export async function bootContentScript(site: SiteKey): Promise<void> {
  const state = await loadState();
  applyEnabled(state[site]);
  watchSiteChanges(site, applyEnabled);
}
