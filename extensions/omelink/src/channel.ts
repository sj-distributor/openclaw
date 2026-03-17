import type { ChannelPlugin } from "openclaw/plugin-sdk/omelink";

// Placeholder account type
export type ResolvedOmelinkAccount = {
  accountId: string;
  enabled: boolean;
  configured: boolean;
  name: string;
};

export const omelinkPlugin: ChannelPlugin<ResolvedOmelinkAccount> = {
  id: "omelink",
  meta: {
    id: "omelink",
    label: "Omelink",
    selectionLabel: "Omelink",
    detailLabel: "Omelink",
    docsPath: "/channels/omelink",
    docsLabel: "omelink",
    blurb: "Omelink messaging channel.",
    aliases: ["ome"],
  },
  capabilities: {
    chatTypes: ["direct", "group"],
    polls: false,
    threads: true,
    media: true,
    reactions: false,
    edit: false,
    reply: true,
  },
  config: {
    listAccountIds: () => ["default"],
    resolveAccount: () => ({
      accountId: "default",
      enabled: true,
      configured: true,
      name: "Default",
    }),
    defaultAccountId: () => "default",
    setAccountEnabled: ({ cfg }) => cfg,
    deleteAccount: ({ cfg }) => cfg,
    isConfigured: () => true,
    describeAccount: (acc) => acc,
    resolveAllowFrom: () => [],
    formatAllowFrom: () => [],
  },
  status: {
    buildChannelSummary: () => ({ diagnostics: [] }),
    probeAccount: async () => {
      // Assume network is always available
      return {
        ok: true,
        summary: "Omelink is ready",
      };
    },
    buildAccountSnapshot: (req) => ({
      accountId: req.account.accountId,
      enabled: req.account.enabled,
      configured: req.account.configured,
      name: req.account.name,
      ok: true,
    }),
  },
  messaging: {
    normalizeTarget: (raw) => {
      const trimmed = raw.trim();
      if (!trimmed) return undefined;
      return `user:${trimmed}`;
    },
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async (ctx) => {
      console.log(`[Omelink] Sending message: ${ctx.text}`);
      return { channel: "omelink", messageId: "sent-" + Date.now() };
    },
  },
};
