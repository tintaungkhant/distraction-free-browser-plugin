import type { BlockingState } from "./types.ts";
import { DEFAULT_STATE } from "./types.ts";
import { loadState, saveState } from "./runtime.ts";

interface AlpineInstance {
  data: (name: string, factory: () => unknown) => void;
}

interface TogglesData {
  state: BlockingState;
  $watch: (key: string, cb: (next: BlockingState) => void) => void;
}

export function registerTogglesComponent(alpine: AlpineInstance): void {
  alpine.data("toggles", () => ({
    state: { ...DEFAULT_STATE },
    async init(this: TogglesData) {
      this.state = await loadState();
      this.$watch("state", (next) => {
        void saveState({
          youtube: next.youtube,
          facebook: next.facebook,
          tiktok: next.tiktok,
        });
      });
    },
  }));
}
