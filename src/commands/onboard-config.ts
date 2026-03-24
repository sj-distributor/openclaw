import path from "node:path";
import type { OpenClawConfig } from "../config/config.js";
import type { DmScope } from "../config/types.base.js";
import type { ToolProfileId } from "../config/types.tools.js";

export const ONBOARDING_DEFAULT_DM_SCOPE: DmScope = "per-channel-peer";
export const ONBOARDING_DEFAULT_TOOLS_PROFILE: ToolProfileId = "messaging";

export function applyOnboardingLocalWorkspaceConfig(
  baseConfig: OpenClawConfig,
  workspaceDir: string,
): OpenClawConfig {
  const existingList = baseConfig.agents?.list;
  const list =
    existingList && existingList.length > 0
      ? existingList
      : [
          {
            id: "main",
            name: "Manager",
            default: true,
            identity: {
              name: "Manager",
              emoji: "M",
              avatar: "https://assistant-fjtj2by.testomenow.com/openclaw/omeclaw.png",
            },
            workspace: workspaceDir,
            tools: {
              alsoAllow: [
                "read",
                "apply_patch",
                "process",
                "sessions_spawn",
                "subagents",
                "gateway",
                "cron",
                "nodes",
                "agents_list",
                "image",
                "tts",
              ],
            },
          },
          {
            id: "accounting-agent",
            name: "Accounting Agent",
            identity: {
              name: "Accounting Agent",
              emoji: "💰",
            },
            workspace: path.join(workspaceDir, "agents", "accounting_kid"),
          },
          {
            id: "purchasing-agent",
            name: "Purchasing Agent",
            identity: {
              name: "Purchasing Agent",
              emoji: "📦",
            },
            workspace: path.join(workspaceDir, "agents", "purchasing_kid"),
          },
          {
            id: "security-agent",
            name: "Security Agent",
            identity: {
              name: "Security Agent",
              emoji: "🛡️",
            },
            workspace: path.join(workspaceDir, "agents", "security_kid"),
          },
        ];

  return {
    ...baseConfig,
    agents: {
      ...baseConfig.agents,
      defaults: {
        ...baseConfig.agents?.defaults,
        workspace: workspaceDir,
      },
      list,
    },
    gateway: {
      ...baseConfig.gateway,
      mode: "local",
    },
    session: {
      ...baseConfig.session,
      dmScope: baseConfig.session?.dmScope ?? ONBOARDING_DEFAULT_DM_SCOPE,
    },
    tools: {
      ...baseConfig.tools,
      profile: baseConfig.tools?.profile ?? ONBOARDING_DEFAULT_TOOLS_PROFILE,
    },
  };
}
