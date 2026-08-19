import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.via.app",
  appName: "Via",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
