import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { Server as SocketIOServer } from "socket.io";

const PORT = Number(process.env.PORT || 3000);
const ROOT = process.cwd();
const ALLOWED_ORIGINS = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

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
  ".webmanifest": "application/manifest+json; charset=utf-8",
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

function getStaticCacheControl(filePath) {
  const ext = extname(filePath).toLowerCase();
  return filePath.endsWith("service-worker.js") || ext === ".webmanifest"
    ? "no-cache"
    : "public, max-age=300";
}

function serveFile(res, filePath) {
  const ext = extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": getStaticCacheControl(filePath)
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

const socketSessionRef = new Map();

function toSocketLobbyView(lobby, viewerPlayerId = null) {
  const sanitized = sanitizeLobbyResponse(lobby);
  const hostId = (sanitized.players || []).find((player) => player.isHost)?.playerId || null;
  return {
    ...sanitized,
    viewerPlayerId,
    hostPlayerId: hostId,
    youAreHost: Boolean(viewerPlayerId && viewerPlayerId === hostId)
  };
}

function emitLobbyState(io, lobby, targetPlayerId = null) {
  const sockets = [...socketSessionRef.entries()].filter(([, ref]) => ref.lobbyId === lobby.lobbyId);
  const byPlayer = new Map();
  for (const [socketId, ref] of sockets) {
    if (!ref.playerId) continue;
    if (!byPlayer.has(ref.playerId)) {
      byPlayer.set(ref.playerId, socketId);
    }
  }
  for (const [playerId, socketId] of byPlayer.entries()) {
    if (targetPlayerId && targetPlayerId !== playerId) continue;
    io.to(socketId).emit("lobby:state", toSocketLobbyView(lobby, playerId));
  }
}

function emitMatchState(io, lobbyId) {
  const lobby = multiplayerService.getLobby(lobbyId);
  const sockets = [...socketSessionRef.entries()].filter(([, ref]) => ref.lobbyId === lobbyId);
  const byPlayer = new Map();
  for (const [socketId, ref] of sockets) {
    if (!ref.playerId || byPlayer.has(ref.playerId)) continue;
    byPlayer.set(ref.playerId, socketId);
  }

  for (const [playerId, socketId] of byPlayer.entries()) {
    const sessionToken = (lobby.players || []).find((player) => player.playerId === playerId)?.sessionToken || null;
    if (!sessionToken) continue;
    const view = multiplayerService.getPlayerView(lobbyId, playerId, sessionToken);
    io.to(socketId).emit("match:state", {
      lobbyId,
      joinCode: lobby.joinCode,
      status: lobby.status,
      viewerPlayerId: playerId,
      view
    });
  }
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
      preferredSeatId: body.preferredSeatId == null ? null : toInt(body.preferredSeatId, 0),
      clientId: body.clientId == null ? null : String(body.clientId)
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
      const joined = multiplayerService.joinLobbyByJoinCodeWithIdentity(joinCode, {
        playerName: String(body.playerName ?? "Admiral"),
        role: body.role === "bot" ? "bot" : "human",
        preferredSeatId: body.preferredSeatId == null ? null : toInt(body.preferredSeatId, 0),
        isLocalPlayer: Boolean(body.isLocalPlayer),
        clientId: body.clientId == null ? null : String(body.clientId)
      });
      sendJson(res, 200, {
        lobby: sanitizeLobbyResponse(joined.lobby),
        viewerPlayerId: joined.viewerPlayerId,
        sessionToken: joined.sessionToken,
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
    const joined = multiplayerService.joinLobbyWithIdentity(lobbyId, {
      playerName: String(body.playerName ?? "Admiral"),
      role: body.role === "bot" ? "bot" : "human",
      preferredSeatId: body.preferredSeatId == null ? null : toInt(body.preferredSeatId, 0),
      isLocalPlayer: Boolean(body.isLocalPlayer),
      clientId: body.clientId == null ? null : String(body.clientId)
    });
    sendJson(res, 200, {
      lobby: sanitizeLobbyResponse(joined.lobby),
      viewerPlayerId: joined.viewerPlayerId,
      sessionToken: joined.sessionToken,
    });
    return;
  }

  if (req.method === "POST" && pathname === `/api/lobbies/${encodeURIComponent(lobbyId)}/fill-bots`) {
    const body = await parseJsonBody(req);
    const lobby = multiplayerService.fillOpenSeatsWithBots(
      lobbyId,
      String(body.botNamePrefix ?? "Bot Admiral")
    );
    emitLobbyState(io, lobby);
    sendJson(res, 200, sanitizeLobbyResponse(lobby));
    return;
  }

  if (req.method === "POST" && pathname === `/api/lobbies/${encodeURIComponent(lobbyId)}/ready`) {
    const body = await parseJsonBody(req);
    const lobby = multiplayerService.setReady(
      lobbyId,
      String(body.sessionToken ?? ""),
      Boolean(body.ready)
    );
    emitLobbyState(io, lobby);
    sendJson(res, 200, sanitizeLobbyResponse(lobby));
    return;
  }

  if (req.method === "POST" && pathname === `/api/lobbies/${encodeURIComponent(lobbyId)}/start`) {
    const lobby = multiplayerService.startMatch(lobbyId);
    emitLobbyState(io, lobby);
    io.to(lobbyId).emit("match:ready", {
      lobbyId: lobby.lobbyId,
      joinCode: lobby.joinCode,
      status: lobby.status
    });
    emitMatchState(io, lobbyId);
    sendJson(res, 200, sanitizeLobbyResponse(lobby));
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
    const lobby = multiplayerService.submitCommand(lobbyId, body, body.sessionToken ?? null);
    emitLobbyState(io, lobby);
    emitMatchState(io, lobbyId);
    sendJson(res, 200, sanitizeLobbyResponse(lobby));
    return;
  }

  sendJson(res, 404, { error: "API route not found." });
}

const httpServer = createServer(async (req, res) => {
  try {
    const method = req.method ?? "GET";
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const pathname = url.pathname;

    if (pathname.startsWith("/api/")) {
      try {
        await handleApi(req, res, pathname, url.searchParams);
      } catch (error) {
        sendJson(res, 400, {
          error: "Request rejected",
          detail: error instanceof Error ? error.message : "Unknown API request failure."
        });
      }
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
        "Cache-Control": getStaticCacheControl(filePath)
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
});

const io = new SocketIOServer(httpServer, {
  cors: {
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS blocked origin"));
    },
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  socket.on("lobby:create", async (payload = {}, ack = () => {}) => {
    try {
      if (!multiplayerService) {
        ack({ ok: false, error: multiplayerBootError ?? "Multiplayer service unavailable." });
        return;
      }
      const lobby = multiplayerService.createLobby({
        hostName: String(payload.hostName ?? payload.playerName ?? "Host Admiral"),
        playerCount: Math.min(4, Math.max(1, toInt(payload.playerCount, 4))),
        matchMode: payload.matchMode === "campaign" ? "campaign" : "skirmish",
        campaignTargetScore: Math.max(25, toInt(payload.campaignTargetScore, 100)),
        preferredSeatId: payload.preferredSeatId == null ? null : toInt(payload.preferredSeatId, 0),
        clientId: payload.clientId == null ? null : String(payload.clientId)
      });
      const host = (lobby.players || []).find((player) => player.isHost) || lobby.players?.[0];
      if (!host) {
        ack({ ok: false, error: "Failed to initialize host player." });
        return;
      }
      socketSessionRef.set(socket.id, {
        lobbyId: lobby.lobbyId,
        playerId: host.playerId,
        sessionToken: host.sessionToken
      });
      socket.join(lobby.lobbyId);
      emitLobbyState(io, lobby);
      ack({
        ok: true,
        lobby: toSocketLobbyView(lobby, host.playerId),
        viewerPlayerId: host.playerId,
        sessionToken: host.sessionToken
      });
    } catch (error) {
      ack({ ok: false, error: error instanceof Error ? error.message : "Lobby create failed." });
    }
  });

  socket.on("lobby:join", async (payload = {}, ack = () => {}) => {
    try {
      if (!multiplayerService) {
        ack({ ok: false, error: multiplayerBootError ?? "Multiplayer service unavailable." });
        return;
      }
      const joinCode = String(payload.joinCode ?? payload.code ?? "").trim().toUpperCase();
      const joined = multiplayerService.joinLobbyByJoinCodeWithIdentity(joinCode, {
        playerName: String(payload.playerName ?? "Admiral"),
        role: payload.role === "bot" ? "bot" : "human",
        preferredSeatId: payload.preferredSeatId == null ? null : toInt(payload.preferredSeatId, 0),
        isLocalPlayer: Boolean(payload.isLocalPlayer),
        clientId: payload.clientId == null ? null : String(payload.clientId)
      });
      const lobby = joined.lobby;
      socketSessionRef.set(socket.id, {
        lobbyId: lobby.lobbyId,
        playerId: joined.viewerPlayerId,
        sessionToken: joined.sessionToken
      });
      socket.join(lobby.lobbyId);
      emitLobbyState(io, lobby);
      ack({
        ok: true,
        lobby: toSocketLobbyView(lobby, joined.viewerPlayerId),
        viewerPlayerId: joined.viewerPlayerId,
        sessionToken: joined.sessionToken
      });
    } catch (error) {
      ack({ ok: false, error: error instanceof Error ? error.message : "Lobby join failed." });
    }
  });

  socket.on("lobby:resume", async (payload = {}, ack = () => {}) => {
    try {
      if (!multiplayerService) {
        ack({ ok: false, error: multiplayerBootError ?? "Multiplayer service unavailable." });
        return;
      }
      const lobbyId = String(payload.lobbyId ?? "").trim();
      const sessionToken = String(payload.sessionToken ?? "").trim();
      if (!lobbyId || !sessionToken) {
        ack({ ok: false, error: "Missing lobbyId or sessionToken." });
        return;
      }
      const resumed = multiplayerService.resumeSession(lobbyId, sessionToken);
      socketSessionRef.set(socket.id, {
        lobbyId,
        playerId: resumed.viewerPlayerId,
        sessionToken: resumed.sessionToken
      });
      socket.join(lobbyId);
      const lobby = multiplayerService.getLobby(lobbyId);
      emitLobbyState(io, lobby, resumed.viewerPlayerId);
      ack({ ok: true, ...resumed });
    } catch (error) {
      ack({ ok: false, error: error instanceof Error ? error.message : "Lobby resume failed." });
    }
  });

  socket.on("lobby:ready", async (payload = {}, ack = () => {}) => {
    try {
      const ref = socketSessionRef.get(socket.id);
      if (!ref?.lobbyId || !ref?.sessionToken) {
        ack({ ok: false, error: "Not attached to a lobby session." });
        return;
      }
      const lobby = multiplayerService.setReady(ref.lobbyId, ref.sessionToken, Boolean(payload.ready));
      emitLobbyState(io, lobby);
      ack({ ok: true, lobby: toSocketLobbyView(lobby, ref.playerId) });
    } catch (error) {
      ack({ ok: false, error: error instanceof Error ? error.message : "Ready update failed." });
    }
  });

  socket.on("lobby:start", async (_payload = {}, ack = () => {}) => {
    try {
      const ref = socketSessionRef.get(socket.id);
      if (!ref?.lobbyId) {
        ack({ ok: false, error: "Not attached to a lobby session." });
        return;
      }
      const lobby = multiplayerService.startMatch(ref.lobbyId);
      emitLobbyState(io, lobby);
      io.to(ref.lobbyId).emit("match:ready", {
        lobbyId: lobby.lobbyId,
        joinCode: lobby.joinCode,
        status: lobby.status
      });
      emitMatchState(io, ref.lobbyId);
      ack({ ok: true, lobby: toSocketLobbyView(lobby, ref.playerId) });
    } catch (error) {
      ack({ ok: false, error: error instanceof Error ? error.message : "Lobby start failed." });
    }
  });

  socket.on("game:action", async (payload = {}, ack = () => {}) => {
    try {
      const ref = socketSessionRef.get(socket.id);
      if (!ref?.lobbyId || !ref?.sessionToken) {
        ack({ ok: false, error: "Not attached to a lobby session." });
        return;
      }
      const command = { ...(payload.command || payload) };
      if (!command || typeof command !== "object" || typeof command.type !== "string") {
        ack({ ok: false, error: "Invalid command payload." });
        return;
      }
      command.actorId = ref.playerId;
      multiplayerService.submitCommand(ref.lobbyId, command, ref.sessionToken);
      const lobby = multiplayerService.getLobby(ref.lobbyId);
      emitLobbyState(io, lobby);
      emitMatchState(io, ref.lobbyId);
      ack({ ok: true });
    } catch (error) {
      ack({ ok: false, error: error instanceof Error ? error.message : "Game action failed." });
    }
  });

  socket.on("disconnect", () => {
    socketSessionRef.delete(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Naval War server running on port ${PORT}`);
  if (!multiplayerService) {
    console.warn(`Multiplayer service unavailable: ${multiplayerBootError}`);
  }
});
