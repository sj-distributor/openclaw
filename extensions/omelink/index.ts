import type { OpenClawPluginApi } from "openclaw/plugin-sdk/omelink";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk/omelink";
import { omelinkPlugin } from "./src/channel.js";
import { setOmelinkRuntime } from "./src/runtime.js";

const plugin = {
  id: "omelink",
  name: "Omelink",
  description: "Omelink channel plugin",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    setOmelinkRuntime(api.runtime);
    api.registerChannel({ plugin: omelinkPlugin });
  },
};

export default plugin;
