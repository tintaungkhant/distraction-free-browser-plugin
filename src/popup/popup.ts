import Alpine from "@alpinejs/csp";
import type { BlockingState } from "../shared/types.ts";
import { DEFAULT_STATE } from "../shared/types.ts";
import { loadState, saveState } from "../shared/runtime.ts";

interface PopupComponent {
  state: BlockingState;
  init(): Promise<void>;
}

document.addEventListener("alpine:init", () => {
  Alpine.data("popup", () => ({
    state: { ...DEFAULT_STATE },
    async init(this: PopupComponent & {
      $watch: (key: string, cb: (next: BlockingState) => void) => void;
    }) {
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
});

Alpine.start();
