// Narrow plugin-sdk surface for the bundled omelink plugin.
// Keep this list additive and scoped to symbols used under extensions/omelink.

export type { OpenClawPluginApi } from "../plugins/types.js";
export { emptyPluginConfigSchema } from "../plugins/config-schema.js";
export type { PluginRuntime } from "../plugins/runtime/types.js";
export type { ChannelPlugin } from "../channels/plugins/types.plugin.js";
