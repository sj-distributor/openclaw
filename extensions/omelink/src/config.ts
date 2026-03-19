import type { OpenClawConfig } from "openclaw/plugin-sdk/core";
import { getOmelinkRuntime } from "./runtime.ts";
import type {
  OmelinkChannelConfig,
  OmelinkConfigPatch,
  OpenClawConfigWithOmelink,
} from "./types.ts";

const parsePatchBody = (rawBody: string): OmelinkConfigPatch => {
  const parsed = JSON.parse(rawBody || "{}");

  const source =
    parsed && typeof parsed === "object" && "config" in parsed
      ? (parsed as { config?: unknown }).config
      : parsed;

  if (!source || typeof source !== "object") {
    throw new Error("invalid payload");
  }

  const input = source as Record<string, unknown>;

  const patch: OmelinkConfigPatch = {};

  if ("enabled" in input) {
    if (typeof input.enabled !== "boolean") throw new Error("enabled must be boolean");
    patch.enabled = input.enabled;
  }

  if ("callbackUrl" in input) {
    const value = String(input.callbackUrl ?? "").trim();
    if (!value) {
      throw new Error("callbackUrl cannot be empty");
    }

    try {
      new URL(value);
    } catch {
      throw new Error("callbackUrl must be valid URL");
    }

    patch.callbackUrl = value;
  }

  if ("apiKey" in input) {
    const value = String(input.apiKey ?? "").trim();

    if (!value) {
      throw new Error("apiKey cannot be empty");
    }

    patch.apiKey = value;
  }

  if ("webhookPort" in input) {
    const port = Number(input.webhookPort);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error("webhookPort must be integer between 1 and 65535");
    }

    patch.webhookPort = port;
  }

  if (Object.keys(patch).length === 0) {
    throw new Error("no supported fields");
  }

  return patch;
};

export const applyConfigPatch = async (rawBody: string): Promise<string[]> => {
  const runtime = getOmelinkRuntime();
  if (!runtime) {
    throw new Error("runtime unavailable");
  }

  const patch = parsePatchBody(rawBody);
  const currentConfig = runtime.config.loadConfig() as OpenClawConfig & OpenClawConfigWithOmelink;
  const currentChannels = currentConfig.channels ?? {};
  const currentOmelink = currentChannels.omelink ?? {};
  const nextOmelink: OmelinkChannelConfig = {
    ...currentOmelink,
    ...patch,
  };

  const nextConfig: OpenClawConfig & OpenClawConfigWithOmelink = {
    ...currentConfig,
    channels: {
      ...currentChannels,
      omelink: nextOmelink,
    },
  };

  await runtime.config.writeConfigFile(nextConfig as OpenClawConfig);

  return Object.keys(patch);
};
