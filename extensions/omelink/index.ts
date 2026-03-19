import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { omelinkChannel } from "./src/channel.ts";
import { setOmelinkRuntime } from "./src/runtime.ts";

const plugin = {
  id: "omelink",
  description: "Omelink channel plugin for OpenClaw",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    setOmelinkRuntime(api.runtime);

    api.registerChannel({ plugin: omelinkChannel });
  },
};

export default plugin;
