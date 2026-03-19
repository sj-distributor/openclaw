import type { PluginRuntime } from "openclaw/plugin-sdk";

let omelinkRuntime: PluginRuntime | null = null;

export function setOmelinkRuntime(runtime: PluginRuntime): void {
  omelinkRuntime = runtime;
}

export function getOmelinkRuntime(): PluginRuntime | null {
  return omelinkRuntime;
}

export function clearOmelinkRuntime(): void {
  omelinkRuntime = null;
}
