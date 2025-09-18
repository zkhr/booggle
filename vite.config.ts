import "jsr:@std/dotenv/load";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const port = parseInt(Deno.env.get("DEV_FE_PORT") || "");
if (!port) {
  throw new Error("Missing DEV_FE_PORT flag.");
}

export default defineConfig({
  base: "./",
  server: { port },
  plugins: [react()],
});
