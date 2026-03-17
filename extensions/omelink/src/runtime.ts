import type { PluginRuntime } from "openclaw/plugin-sdk/omelink";

let runtime: PluginRuntime | null = null;

export function setOmelinkRuntime(apiRuntime: PluginRuntime) {
  runtime = apiRuntime;
}

export function requireOmelinkRuntime(): PluginRuntime {
  if (!runtime) {
    throw new Error("Omelink plugin runtime is not initialized");
  }
  return runtime;
}

export function isOmelinkRuntimeInitialized(): boolean {
  return runtime !== null;
}
