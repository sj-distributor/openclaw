import type { OmelinkOutboundMessageParams } from "./types.ts";

const parseJsonResponse = async (response: Response): Promise<Record<string, unknown> | null> => {
  const body = await response.text().catch(() => "");
  if (!body) {
    return null;
  }

  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return null;
  }
};

export const sendOutboundMessage = async (
  params: OmelinkOutboundMessageParams,
): Promise<{ messageId: string }> => {
  if (!params.account.config.callbackUrl) {
    throw new Error("omelink.callbackUrl 未配置");
  }

  if (!params.account.config.apiKey) {
    throw new Error("omelink.apiKey 未配置");
  }

  const payload: Record<string, unknown> = {
    userId: params.to,
    text: params.text,
    provider: "omelink",
  };

  if (params.messageId) {
    payload.messageId = params.messageId;
  }

  if (params.conversationId) {
    payload.conversationId = params.conversationId;
  }

  const response = await fetch(params.account.config.callbackUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": params.account.config.apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Omelink HTTP ${response.status}${body ? `: ${body}` : ""}`);
  }

  const data = await parseJsonResponse(response);

  const messageId =
    typeof data?.messageId === "string" && data.messageId.trim()
      ? data.messageId.trim()
      : `omelink-${Date.now()}`;

  return { messageId };
};
