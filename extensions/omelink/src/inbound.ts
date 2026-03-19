import type { ChannelGatewayContext } from "openclaw/plugin-sdk";
import { sendOutboundMessage } from "./outbound.ts";
import { getOmelinkRuntime } from "./runtime.ts";
import type { OmelinkInboundPayload, OmelinkResolvedAccount, ReplyDispatcher } from "./types.ts";

const resolveDispatcher = (
  ctx: ChannelGatewayContext<OmelinkResolvedAccount>,
): ReplyDispatcher | null => {
  const dispatcherFromContext = ctx.channelRuntime?.reply?.dispatchReplyWithBufferedBlockDispatcher;
  if (typeof dispatcherFromContext === "function") {
    return dispatcherFromContext;
  }

  const dispatcherFromRuntime =
    getOmelinkRuntime()?.channel?.reply?.dispatchReplyWithBufferedBlockDispatcher;
  if (typeof dispatcherFromRuntime === "function") {
    return dispatcherFromRuntime;
  }

  return null;
};

const toErrorMessage = (err: unknown): string => {
  return err instanceof Error ? err.message : String(err);
};

export const parseInboundPayload = (raw: string): OmelinkInboundPayload => {
  const parsed = JSON.parse(raw || "{}");
  if (!parsed || typeof parsed !== "object") {
    throw new Error("invalid payload");
  }

  return parsed as OmelinkInboundPayload;
};

export const handleInbound = async (params: {
  ctx: ChannelGatewayContext<OmelinkResolvedAccount>;
  account: OmelinkResolvedAccount;
  payload: OmelinkInboundPayload;
}) => {
  const dispatcher = resolveDispatcher(params.ctx);
  if (!dispatcher) {
    throw new Error("OpenClaw reply dispatcher 不可用");
  }

  const text = String(params.payload.text ?? "").trim();
  if (!text) {
    throw new Error("text required");
  }

  const userId = String(params.payload.userId ?? "").trim();
  if (!userId) {
    throw new Error("userId required");
  }

  const conversationId = String(params.payload.conversationId ?? "default").trim() || "default";

  const messageId = String(params.payload.messageId ?? "").trim();
  if (!messageId) {
    throw new Error("messageId required");
  }

  const from = userId;
  const to = userId;

  // 简单判断是不是图片 URL
  const isImageUrl = /^https?:.*\.(png|jpg|jpeg|webp|gif)$/i.test(text);

  const inboundCtx = {
    Body: isImageUrl ? "[image]" : text,
    MediaUrl: isImageUrl ? text : undefined,
    RawBody: text,
    CommandBody: text,
    From: from,
    To: to,
    SessionKey: `omelink:${userId}:${conversationId}`,
    AccountId: params.account.accountId,
    MessageSid: messageId,
    ChatType: "direct",
    ConversationLabel: conversationId,
    SenderId: from,
    CommandAuthorized: true,
    Provider: "omelink",
    Surface: "omelink",
    OriginatingChannel: "omelink",
    OriginatingTo: to,
    DeliveryContext: {
      channel: "omelink",
      to,
      accountId: params.account.accountId,
    },
  };

  await dispatcher({
    ctx: inboundCtx,
    cfg: params.ctx.cfg,
    replyResolver: undefined,
    dispatcherOptions: {
      deliver: async (replyPayload: unknown) => {
        const textPayload =
          typeof replyPayload === "string"
            ? replyPayload
            : String(
                (replyPayload as Record<string, unknown>)?.text ??
                  (replyPayload as Record<string, unknown>)?.body ??
                  "",
              );

        const replyText = textPayload.trim();
        if (!replyText || replyText === "NO_REPLY" || replyText.endsWith("NO_REPLY")) {
          return;
        }

        await sendOutboundMessage({
          account: params.account,
          to,
          text: replyText,
          messageId,
          conversationId,
        });
      },
      onError: (err: unknown) => {
        params.ctx.log?.error?.(`[omelink:${params.account.accountId}] ${toErrorMessage(err)}`);
      },
    },
  });
};
