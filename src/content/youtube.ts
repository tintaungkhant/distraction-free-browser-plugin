import { bootContentScript } from "../shared/runtime.ts";

const ALLOWED_PATHS = /^\/(results|watch)$/;
const ROUTE_BLOCKED_CLASS = "dfb-route-blocked";

function applyRouteGuard(): void {
  const allowed = ALLOWED_PATHS.test(location.pathname);
  document.documentElement.classList.toggle(ROUTE_BLOCKED_CLASS, !allowed);
}

applyRouteGuard();
document.addEventListener("yt-navigate-finish", applyRouteGuard);

void bootContentScript("youtube");
