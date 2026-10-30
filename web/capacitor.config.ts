import type { CapacitorConfig } from "@capacitor/cli";
const config: CapacitorConfig = {
  appId: "com.shaigoldman.commandlinedungeon.test",
  appName: "Dungeon Test",
  webDir: "dist/android",
  android: {
    backgroundColor: "#101923",
    allowMixedContent: false,
    adjustMarginsForEdgeToEdge: "auto",
  },
  server: { androidScheme: "https" },
};
export default config;
