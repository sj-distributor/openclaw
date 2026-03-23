import fs from "node:fs/promises";
import JSON5 from "json5";
import { DEFAULT_AGENT_WORKSPACE_DIR, ensureAgentWorkspace } from "../agents/workspace.js";
import { type OpenClawConfig, createConfigIO, writeConfigFile } from "../config/config.js";
import { formatConfigPath, logConfigUpdated } from "../config/logging.js";
import { resolveSessionTranscriptsDir } from "../config/sessions.js";
import type { RuntimeEnv } from "../runtime.js";
import { defaultRuntime } from "../runtime.js";
import { shortenHomePath } from "../utils.js";

async function readConfigFileRaw(configPath: string): Promise<{
  exists: boolean;
  parsed: OpenClawConfig;
}> {
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    const parsed = JSON5.parse(raw);
    if (parsed && typeof parsed === "object") {
      return { exists: true, parsed: parsed as OpenClawConfig };
    }
    return { exists: true, parsed: {} };
  } catch {
    return { exists: false, parsed: {} };
  }
}

export async function setupCommand(
  opts?: { workspace?: string },
  runtime: RuntimeEnv = defaultRuntime,
) {
  const desiredWorkspace =
    typeof opts?.workspace === "string" && opts.workspace.trim()
      ? opts.workspace.trim()
      : undefined;

  const io = createConfigIO();
  const configPath = io.configPath;
  const existingRaw = await readConfigFileRaw(configPath);
  const cfg = existingRaw.parsed;
  const defaults = cfg.agents?.defaults ?? {};

  const workspace = desiredWorkspace ?? defaults.workspace ?? DEFAULT_AGENT_WORKSPACE_DIR;

  const existingList = cfg.agents?.list;
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
            workspace: workspace,
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
            id: "accounting-kid",
            name: "Accounting Kid",
            identity: {
              name: "Accounting Kid",
              emoji: "💰",
            },
            workspace: `${workspace}/agents/accounting_kid`,
          },
          {
            id: "purchasing-kid",
            name: "Purchasing Kid",
            identity: {
              name: "Purchasing Kid",
              emoji: "📦",
            },
            workspace: `${workspace}/agents/purchasing_kid`,
          },
          {
            id: "security-kid",
            name: "Security Kid",
            identity: {
              name: "Security Kid",
              emoji: "🛡️",
            },
            workspace: `${workspace}/agents/security_kid`,
          },
        ];

  const next: OpenClawConfig = {
    ...cfg,
    agents: {
      ...cfg.agents,
      defaults: {
        ...defaults,
        workspace,
      },
      list,
    },
  };

  if (!existingRaw.exists || defaults.workspace !== workspace) {
    await writeConfigFile(next);
    if (!existingRaw.exists) {
      runtime.log(`Wrote ${formatConfigPath(configPath)}`);
    } else {
      logConfigUpdated(runtime, { path: configPath, suffix: "(set agents.defaults.workspace)" });
    }
  } else {
    runtime.log(`Config OK: ${formatConfigPath(configPath)}`);
  }

  const ws = await ensureAgentWorkspace({
    dir: workspace,
    ensureBootstrapFiles: !next.agents?.defaults?.skipBootstrap,
  });
  runtime.log(`Workspace OK: ${shortenHomePath(ws.dir)}`);

  const sessionsDir = resolveSessionTranscriptsDir();
  await fs.mkdir(sessionsDir, { recursive: true });
  runtime.log(`Sessions OK: ${shortenHomePath(sessionsDir)}`);
}
