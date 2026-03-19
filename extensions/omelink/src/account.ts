import { normalizeAccountId } from "openclaw/plugin-sdk";
import type { OpenClawConfig } from "openclaw/plugin-sdk/core";
import type {
  OmelinkChannelConfig,
  OmelinkResolvedAccount,
  OpenClawConfigWithOmelink,
} from "./types.ts";

export const DEFAULT_ACCOUNT_ID = "default";

export const getChannelConfig = (cfg: OpenClawConfig): OmelinkChannelConfig => {
  const typedCfg = cfg as OpenClawConfig & OpenClawConfigWithOmelink;

  return typedCfg.channels?.omelink ?? {};
};

export const listAccountIds = (cfg: OpenClawConfig): string[] => {
  const channelCfg = getChannelConfig(cfg);

  if (!channelCfg) {
    return [DEFAULT_ACCOUNT_ID];
  }

  return [DEFAULT_ACCOUNT_ID];
};

export const resolveAccount = (
  cfg: OpenClawConfig,
  accountId?: string | null,
): OmelinkResolvedAccount => {
  const currentAccountId = normalizeAccountId(accountId);

  const channelCfg = getChannelConfig(cfg);

  const accountCfg = currentAccountId === DEFAULT_ACCOUNT_ID ? channelCfg : {};

  const enabled = (accountCfg.enabled ?? channelCfg.enabled ?? true) !== false;

  const callbackUrl = String(accountCfg.callbackUrl ?? channelCfg.callbackUrl ?? "").trim();
  const apiKey = String(accountCfg.apiKey ?? channelCfg.apiKey ?? "").trim();

  const webhookPath = "/omelink/events";
  const configApiPath = "/omelink/config/set";

  const webhookPortRaw = accountCfg.webhookPort ?? channelCfg.webhookPort;
  const webhookPort = Number.isFinite(Number(webhookPortRaw)) ? Number(webhookPortRaw) : 17321;
  return {
    accountId: currentAccountId,
    enabled,
    configured: Boolean(callbackUrl && apiKey),
    config: {
      callbackUrl,
      apiKey,
      webhookPort,
      webhookPath,
      configApiPath,
    },
  };
};

export const defaultAccountId = (cfg: OpenClawConfig): string => {
  return getChannelConfig(cfg).defaultAccountId ?? DEFAULT_ACCOUNT_ID;
};
