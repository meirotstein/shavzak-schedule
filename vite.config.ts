import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import fs from "fs";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: "/shavzak-schedule",
  server: {
    port: 3000,
    host: "127.0.0.1",
    https: {
      key: fs.readFileSync(path.resolve(`${__dirname}/certs`, "127.0.0.1+1-key.pem")),
      cert: fs.readFileSync(path.resolve(`${__dirname}/certs`, "127.0.0.1+1.pem")),
    },
  },
});

