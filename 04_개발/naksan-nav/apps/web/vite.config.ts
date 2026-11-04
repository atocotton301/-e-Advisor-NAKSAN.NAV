import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // 상상부기 이미지를 한 파일 데모에 넣기 위해 작은 이미지는 data URI로 묶는다.
  build: { assetsInlineLimit: 100_000 },
});
