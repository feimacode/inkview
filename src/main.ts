#!/usr/bin/env node
/**
 * Inkview entry point.
 *   node dist/main.js           streamable HTTP on PORT (default 3001), path /mcp
 *   node dist/main.js --stdio   stdio, for Claude Code, Codex, Cursor, VS Code
 */
import { createMcpExpressApp } from "@modelcontextprotocol/express";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import type { Request, Response } from "express";
import { createServer, VERSION } from "./server.js";

async function startHttp(): Promise<void> {
  const port = parseInt(process.env.PORT ?? "3001", 10);
  const host = process.env.HOST ?? "127.0.0.1";
  // Tunnels (cloudflared, ngrok) forward a public Host header, so allow any
  // host here; the server binds to localhost by default and holds no state.
  const app = createMcpExpressApp({ host: "0.0.0.0" });

  app.get("/", (_req: Request, res: Response) => {
    res.type("text/plain").send(`Inkview ${VERSION} MCP server. Endpoint: /mcp\n`);
  });
  app.get("/healthz", (_req: Request, res: Response) => {
    res.json({ ok: true, version: VERSION });
  });

  // Stateless: a fresh server and transport per request, no sessions.
  app.all("/mcp", async (req: Request, res: Response) => {
    const server = createServer();
    const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });
    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      // Log the error only, never the request body (it can hold personal data).
      console.error("MCP error:", error instanceof Error ? error.message : error);
      if (!res.headersSent) {
        res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
      }
    }
  });

  const httpServer = app.listen(port, host, () => {
    console.log(`Inkview ${VERSION} listening on http://${host === "0.0.0.0" ? "localhost" : host}:${port}/mcp`);
  });
  const shutdown = () => httpServer.close(() => process.exit(0));
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

async function main() {
  if (process.argv.includes("--stdio")) {
    await createServer().connect(new StdioServerTransport());
  } else {
    await startHttp();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
