import { readFile, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function normalizeBasePath(basePath) {
  const leadingSlash = basePath.startsWith("/") ? basePath : `/${basePath}`;
  return leadingSlash.endsWith("/") ? leadingSlash : `${leadingSlash}/`;
}

export function createStaticServer({ root, basePath = "/", fallbackToIndex = false }) {
  const resolvedRoot = path.resolve(root);
  const mountPath = normalizeBasePath(basePath);

  return http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
      if (!requestUrl.pathname.startsWith(mountPath)) {
        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        response.end("Not found");
        return;
      }

      const relativeUrl = decodeURIComponent(requestUrl.pathname.slice(mountPath.length));
      const relativePath = relativeUrl.endsWith("/") || relativeUrl === ""
        ? path.join(relativeUrl, "index.html")
        : relativeUrl;
      let filePath = path.resolve(resolvedRoot, relativePath);
      if (!filePath.startsWith(`${resolvedRoot}${path.sep}`)) {
        response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
        response.end("Forbidden");
        return;
      }

      try {
        const details = await stat(filePath);
        if (details.isDirectory()) filePath = path.join(filePath, "index.html");
      } catch (error) {
        if (!fallbackToIndex || error.code !== "ENOENT") throw error;
        filePath = path.join(resolvedRoot, "index.html");
      }

      const body = await readFile(filePath);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream"
      });
      response.end(body);
    } catch (error) {
      const status = error.code === "ENOENT" ? 404 : 500;
      response.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
      response.end(status === 404 ? "Not found" : "Server error");
    }
  });
}
