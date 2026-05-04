import { loadState } from "../shared/runtime.ts";

async function init(): Promise<void> {
  const state = await loadState();
  console.debug("[DFB] popup state", state);
}

void init();
