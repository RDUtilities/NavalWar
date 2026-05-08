import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createServer } from "node:http";

const PORT = Number(process.env.PORT || 3000);
const ROOT = process.cwd();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".wav": "audio/wav",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
};

function safeResolve(urlPath) {
  const cleaned = normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
  return join(ROOT, cleaned);
}

function serveFile(res, filePath) {
  const ext = extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=300",
  });
  createReadStream(filePath).pipe(res);
}

createServer((req, res) => {
  const rawUrl = req.url || "/";
  const pathOnly = rawUrl.split("?")[0];

  if (pathOnly === "/" || pathOnly === "") {
    res.writeHead(302, { Location: "/prototype/index.html" });
    res.end();
    return;
  }

  const filePath = safeResolve(pathOnly.startsWith("/") ? pathOnly.slice(1) : pathOnly);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  if (!existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const stat = statSync(filePath);
  if (!stat.isFile()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  serveFile(res, filePath);
}).listen(PORT, () => {
  console.log(`Naval War server running on port ${PORT}`);
});
