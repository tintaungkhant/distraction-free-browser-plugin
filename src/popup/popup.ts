import type { BlockingState } from "../shared/types.ts";
import { DEFAULT_STATE, STORAGE_KEY } from "../shared/types.ts";

async function loadState(): Promise<BlockingState> {
  const raw = await chrome.storage.local.get(STORAGE_KEY);
  const stored = raw[STORAGE_KEY] as Partial<BlockingState> | undefined;
  return { ...DEFAULT_STATE, ...stored };
}

async function init(): Promise<void> {
  const state = await loadState();
  console.debug("[DFB] popup loaded", state);
}

void init();
