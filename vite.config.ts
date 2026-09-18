import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { mafftDevPlugin } from "./src/server/mafftDevPlugin.ts";

export default defineConfig({
  plugins: [react(), mafftDevPlugin()],
});
