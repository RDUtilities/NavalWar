import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";

const PORT = Number(process.env.PORT || 3000);
const ROOT = process.cwd();

let multiplayerService = null;
let multiplayerBootError = null;

try {
  const sessionModule = await import("./dist/session.js");
  multiplayerService = new sessionModule.InMemoryMultiplayerService();
} catch (error) {
  multiplayerBootError =
    error instanceof Error ? error.message : "Unknown multiplayer bootstrap error.";
}

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
  ".svg": "image/svg+xml"
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, {
    "Content-Type": "text/plain; charset=utf-8"
  });
  res.end(text);
}

function safeResolve(urlPath) {
  const decodedPath = decodeURIComponent(urlPath);
  const cleaned = normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  return join(ROOT, cleaned);
}

function serveFile(res, filePath) {
  const ext = extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=300"
  });
  createReadStream(filePath).pipe(res);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => {
      chunks.push(chunk);
      const size = chunks.reduce((sum, entry) => sum + entry.length, 0);
      if (size > 1_000_000) {
        reject(new Error("Request body too large."));
      }
    });
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("Invalid JSON request body."));
      }
    });
    req.on("error", () => reject(new Error("Failed reading request body.")));
  });
}

function requireMultiplayerReady(res) {
  if (multiplayerService) {
    return true;
  }
  sendJson(res, 503, {
    error: "Multiplayer service unavailable.",
    detail: multiplayerBootError ?? "Run npm run build before starting the server."
  });
  return false;
}

function toInt(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function sanitizeLobbyResponse(lobby) {
  return {
    ...lobby,
    players: (lobby.players || []).map(({ sessionToken, ...rest }) => ({ ...rest })),
  };
}

function parseLobbyId(pathname) {
  const match = pathname.match(/^\/api\/lobbies\/([^/]+)(?:\/|$)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function handleApi(req, res, pathname, searchParams) {
  if (!requireMultiplayerReady(res)) {
    return;
  }

  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, { ok: true, multiplayer: true });
    return;
  }

  if (req.method === "POST" && pathname === "/api/lobbies") {
    const body = await parseJsonBody(req);
    const lobby = multiplayerService.createLobby({
      hostName: String(body.hostName ?? "Host Admiral"),
      playerCount: Math.min(4, Math.max(1, toInt(body.playerCount, 4))),
      matchMode: body.matchMode === "campaign" ? "campaign" : "skirmish",
      campaignTargetScore: Math.max(25, toInt(body.campaignTargetScore, 100)),
      preferredSeatId: body.preferredSeatId == null ? null : toInt(body.preferredSeatId, 0)
    });
    const host = (lobby.players || []).find((player) => player.isHost) || lobby.players?.[0];
    sendJson(res, 201, {
      lobby: sanitizeLobbyResponse(lobby),
      viewerPlayerId: host?.playerId ?? null,
      sessionToken: host?.sessionToken ?? null,
    });
    return;
  }

  const byCodeMatch = pathname.match(/^\/api\/lobbies\/by-code\/([^/]+)(?:\/(join|reconnect))?$/);
  if (byCodeMatch) {
    const joinCode = decodeURIComponent(byCodeMatch[1] || "").trim().toUpperCase();
    const action = byCodeMatch[2] || "";
    if (!action && req.method === "GET") {
      sendJson(res, 200, sanitizeLobbyResponse(multiplayerService.getLobbyByJoinCode(joinCode)));
      return;
    }
    if (action === "join" && req.method === "POST") {
      const body = await parseJsonBody(req);
      const lobby = multiplayerService.joinLobbyByJoinCode(joinCode, {
        playerName: String(body.playerName ?? "Admiral"),
        role: body.role === "bot" ? "bot" : "human",
        preferredSeatId: body.preferredSeatId == null ? null : toInt(body.preferredSeatId, 0),
        isLocalPlayer: Boolean(body.isLocalPlayer),
        clientId: body.clientId == null ? null : String(body.clientId)
      });
      const clientId = body.clientId == null ? null : String(body.clientId);
      const viewer = clientId
        ? (lobby.players || []).find((player) => player.clientId === clientId)
        : lobby.players?.at(-1);
      sendJson(res, 200, {
        lobby: sanitizeLobbyResponse(lobby),
        viewerPlayerId: viewer?.playerId ?? null,
        sessionToken: viewer?.sessionToken ?? null,
      });
      return;
    }
    if (action === "reconnect" && req.method === "POST") {
      const body = await parseJsonBody(req);
      const session = multiplayerService.reconnectLobbyByJoinCode(
        joinCode,
        String(body.clientId ?? "")
      );
      sendJson(res, 200, session);
      return;
    }
  }

  const lobbyId = parseLobbyId(pathname);
  if (!lobbyId) {
    sendJson(res, 404, { error: "API route not found." });
    return;
  }

  if (req.method === "GET" && pathname === `/api/lobbies/${encodeURIComponent(lobbyId)}`) {
    sendJson(res, 200, sanitizeLobbyResponse(multiplayerService.getLobby(lobbyId)));
    return;
  }

  if (req.method === "POST" && pathname === `/api/lobbies/${encodeURIComponent(lobbyId)}/join`) {
    const body = await parseJsonBody(req);
    const lobby = multiplayerService.joinLobby(lobbyId, {
      playerName: String(body.playerName ?? "Admiral"),
      role: body.role === "bot" ? "bot" : "human",
      preferredSeatId: body.preferredSeatId == null ? null : toInt(body.preferredSeatId, 0),
      isLocalPlayer: Boolean(body.isLocalPlayer),
      clientId: body.clientId == null ? null : String(body.clientId)
    });
    const clientId = body.clientId == null ? null : String(body.clientId);
    const viewer = clientId
      ? (lobby.players || []).find((player) => player.clientId === clientId)
      : lobby.players?.at(-1);
    sendJson(res, 200, {
      lobby: sanitizeLobbyResponse(lobby),
      viewerPlayerId: viewer?.playerId ?? null,
      sessionToken: viewer?.sessionToken ?? null,
    });
    return;
  }

  if (req.method === "POST" && pathname === `/api/lobbies/${encodeURIComponent(lobbyId)}/fill-bots`) {
    const body = await parseJsonBody(req);
    const lobby = multiplayerService.fillOpenSeatsWithBots(
      lobbyId,
      String(body.botNamePrefix ?? "Bot Admiral")
    );
    sendJson(res, 200, sanitizeLobbyResponse(lobby));
    return;
  }

  if (req.method === "POST" && pathname === `/api/lobbies/${encodeURIComponent(lobbyId)}/start`) {
    sendJson(res, 200, sanitizeLobbyResponse(multiplayerService.startMatch(lobbyId)));
    return;
  }

  if (req.method === "POST" && pathname === `/api/lobbies/${encodeURIComponent(lobbyId)}/resume`) {
    const body = await parseJsonBody(req);
    sendJson(res, 200, multiplayerService.resumeSession(lobbyId, String(body.sessionToken ?? "")));
    return;
  }

  if (req.method === "GET" && pathname === `/api/lobbies/${encodeURIComponent(lobbyId)}/view`) {
    const viewerPlayerId = searchParams.get("playerId");
    const sessionToken = searchParams.get("sessionToken");
    if (!viewerPlayerId && !sessionToken) {
      sendJson(res, 400, { error: "Missing required query parameter: playerId or sessionToken" });
      return;
    }
    sendJson(res, 200, multiplayerService.getPlayerView(lobbyId, viewerPlayerId, sessionToken));
    return;
  }

  if (req.method === "POST" && pathname === `/api/lobbies/${encodeURIComponent(lobbyId)}/commands`) {
    const body = await parseJsonBody(req);
    if (!body || typeof body !== "object" || typeof body.type !== "string") {
      sendJson(res, 400, { error: "Command payload is missing required fields." });
      return;
    }
    sendJson(res, 200, sanitizeLobbyResponse(multiplayerService.submitCommand(lobbyId, body, body.sessionToken ?? null)));
    return;
  }

  sendJson(res, 404, { error: "API route not found." });
}

createServer(async (req, res) => {
  try {
    const method = req.method ?? "GET";
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const pathname = url.pathname;

    if (pathname.startsWith("/api/")) {
      await handleApi(req, res, pathname, url.searchParams);
      return;
    }

    if (method !== "GET" && method !== "HEAD") {
      sendText(res, 405, "Method not allowed.");
      return;
    }

    if (pathname === "/" || pathname === "") {
      res.writeHead(302, { Location: "/prototype/index.html" });
      res.end();
      return;
    }

    const filePath = safeResolve(pathname.startsWith("/") ? pathname.slice(1) : pathname);
    if (!filePath.startsWith(ROOT)) {
      sendText(res, 403, "Forbidden");
      return;
    }

    if (!existsSync(filePath)) {
      sendText(res, 404, "Not found");
      return;
    }

    const stat = statSync(filePath);
    if (!stat.isFile()) {
      sendText(res, 404, "Not found");
      return;
    }

    if (method === "HEAD") {
      const ext = extname(filePath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=300"
      });
      res.end();
      return;
    }

    serveFile(res, filePath);
  } catch (error) {
    sendJson(res, 500, {
      error: "Server error",
      detail: error instanceof Error ? error.message : "Unknown server failure."
    });
  }
}).listen(PORT, () => {
  console.log(`Naval War server running on port ${PORT}`);
  if (!multiplayerService) {
    console.warn(`Multiplayer service unavailable: ${multiplayerBootError}`);
  }
});
