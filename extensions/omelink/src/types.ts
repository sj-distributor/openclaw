import type { PluginRuntime } from "openclaw/plugin-sdk";

export type OmelinkAccountConfig = {
  enabled?: boolean;
  callbackUrl?: string;
  apiKey?: string;
  webhookPort?: number;
};

export type OmelinkChannelConfig = OmelinkAccountConfig & {
  defaultAccountId?: string;
};

export type OmelinkConfigPatch = Partial<
  Pick<OmelinkChannelConfig, "enabled" | "callbackUrl" | "apiKey" | "webhookPort">
>;

export type OpenClawConfigWithOmelink = {
  channels?: {
    omelink?: OmelinkChannelConfig;
  };
};

export type OmelinkResolvedAccount = {
  accountId: string;
  enabled: boolean;
  configured: boolean;
  config: {
    callbackUrl: string;
    apiKey: string;
    webhookPort: number;
    webhookPath: string;
    configApiPath: string;
  };
};

export type OmelinkInboundPayload = {
  text?: unknown;
  userId?: unknown;
  messageId?: unknown;
  conversationId?: unknown;
};

export type OmelinkOutboundMessageParams = {
  account: OmelinkResolvedAccount;
  to: string;
  text: string;
  messageId?: string;
  conversationId?: string;
};

export type ReplyDispatcher = NonNullable<
  PluginRuntime["channel"]
>["reply"]["dispatchReplyWithBufferedBlockDispatcher"];
