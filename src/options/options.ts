import Alpine from "@alpinejs/csp";
import { registerTogglesComponent } from "../shared/togglesComponent.ts";

document.addEventListener("alpine:init", () => {
  registerTogglesComponent(Alpine);
});

Alpine.start();
