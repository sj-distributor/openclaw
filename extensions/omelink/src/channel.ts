import type { ChannelPlugin } from "openclaw/plugin-sdk";
import { defaultAccountId, listAccountIds, resolveAccount } from "./account.ts";
import { applyConfigPatch } from "./config.ts";
import { handleInbound, parseInboundPayload } from "./inbound.ts";
import { sendOutboundMessage } from "./outbound.ts";
import { omelinkServer } from "./server.ts";
import type { OmelinkResolvedAccount } from "./types.ts";

const meta = {
  id: "omelink",
  label: "Omelink",
  selectionLabel: "Omelink",
  docsPath: "/channels/omelink",
  docsLabel: "omelink",
  blurb: "Omelink messaging channel.",
  aliases: ["oml"],
  order: 70,
};

export const omelinkChannel: ChannelPlugin<OmelinkResolvedAccount> = {
  id: "omelink",
  meta: {
    ...meta,
  },
  capabilities: {
    chatTypes: ["direct"],
    polls: false,
    threads: false,
    media: true,
    reactions: false,
    edit: false,
    reply: true,
    blockStreaming: true,
  },
  reload: { configPrefixes: ["channels.omelink"] },
  config: {
    listAccountIds,
    resolveAccount,
    defaultAccountId,
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async ({ to, text, accountId, cfg }) => {
      const account = resolveAccount(cfg, accountId);
      if (!account.enabled) {
        throw new Error(`omelink account "${account.accountId}" is disabled`);
      }

      const result = await sendOutboundMessage({
        account,
        to: String(to),
        text: String(text ?? ""),
        type: "text",
      });

      return {
        channel: "omelink",
        messageId: result.messageId,
        conversationId: String(to),
      };
    },
    sendMedia: async ({ to, text, mediaUrl, accountId, cfg }) => {
      const account = resolveAccount(cfg, accountId);
      if (!account.enabled) {
        throw new Error(`omelink account "${account.accountId}" is disabled`);
      }

      const result = await sendOutboundMessage({
        account,
        to: String(to),
        text: String(text ?? ""),
        type: "image",
        mediaUrl: mediaUrl ? String(mediaUrl) : undefined,
      });

      return {
        channel: "omelink",
        messageId: result.messageId,
        conversationId: String(to),
      };
    },
  },
  gateway: {
    startAccount: async (ctx) => {
      const account = ctx.account;
      const webhookPath = account.config.webhookPath;
      const configApiPath = account.config.configApiPath;
      const webhookPort = account.config.webhookPort;

      await omelinkServer.start(webhookPort);

      omelinkServer.addRoute(webhookPath, async (_req, body) => {
        const payload = parseInboundPayload(body);
        await handleInbound({ ctx, account, payload });
        return { ok: true };
      });

      omelinkServer.addRoute(configApiPath, async (_req, body) => {
        const updatedFields = await applyConfigPatch(body);

        ctx.log?.info?.(
          `[omelink:${account.accountId}] config updated via API: ${updatedFields.join(",")}`,
        );

        return { ok: true, updatedFields };
      });

      ctx.log?.info?.(
        `[omelink:${account.accountId}] webhook listening on http://127.0.0.1:${webhookPort}${webhookPath}`,
      );

      ctx.log?.info?.(
        `[omelink:${account.accountId}] config API listening on http://127.0.0.1:${webhookPort}${configApiPath}`,
      );

      ctx.setStatus({
        ...ctx.getStatus(),
        running: true,
        mode: "webhook",
        port: webhookPort,
        webhookPath,
        lastStartAt: Date.now(),
      });

      return {
        stop: () => {
          ctx.setStatus({
            ...ctx.getStatus(),
            running: false,
            lastStopAt: Date.now(),
          });
        },
      };
    },
  },
};
