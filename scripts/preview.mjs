// npm run preview: builds the gallery and serves it on http://localhost:5174
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

execSync("npm run build:ui && DEV_PAGE=gallery vite build -c dev/vite.config.ts", { stdio: "inherit", shell: true });
const html = readFileSync("dist-dev/gallery/index.html");
const port = Number(process.env.PORT ?? 5174);
createServer((_req, res) => res.writeHead(200, { "content-type": "text/html" }).end(html)).listen(port, "127.0.0.1", () =>
  console.log(`Inkview gallery: http://localhost:${port}`),
);
