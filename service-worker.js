const CACHE_VERSION = "naval-war-assets-v5";
const SHELL_ASSETS = [
  "/",
  "/prototype/index.html",
  "/prototype/styles.css",
  "/prototype/app.js",
  "/prototype/rules.html",
  "/manifest.webmanifest",
  "/pwa-assets.json",
  "/assets/navalWarLogo-Transparent.png",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png",
  "/assets/icons/apple-touch-icon.png",
  "/assets/War-Table.png"
];
const INSTALL_ASSET_MAX_BYTES = 2_000_000;
const INSTALL_ASSET_PREFIXES = [
  "/assets/sound/",
  "/assets/optimized/cards/play/table/",
  "/assets/optimized/cards/ships/table/"
];
const INSTALL_ASSET_URLS = [
  "/prototype/rules-art/pages/PlayDeckCardback.png",
  "/prototype/rules-art/pages/ShipExampleCard.png"
];
const NETWORK_FIRST_ASSETS = new Set(SHELL_ASSETS);

async function cacheAsset(cache, assetUrl) {
  try {
    const response = await fetch(new Request(assetUrl, { cache: "reload" }));
    if (!response || response.status !== 200) {
      return false;
    }
    await cache.put(assetUrl, response);
    return true;
  } catch {
    return false;
  }
}

async function cacheAssets(cache, assetUrls) {
  await Promise.all(assetUrls.map((assetUrl) => cacheAsset(cache, assetUrl)));
}

async function loadRuntimeAssetList(cache) {
  try {
    const response = await fetch(new Request("/pwa-assets.json", { cache: "reload" }));
    if (!response || response.status !== 200) {
      return [];
    }
    const responseCopy = response.clone();
    await cache.put("/pwa-assets.json", responseCopy);
    const payload = await response.json();
    if (!Array.isArray(payload.assets)) {
      return [];
    }
    return payload.assets
      .map((asset) => (typeof asset === "string" ? asset : asset.url))
      .filter((assetUrl) => typeof assetUrl === "string" && assetUrl.startsWith("/"));
  } catch {
    return [];
  }
}

function shouldCacheAtInstall(asset) {
  const assetUrl = typeof asset === "string" ? asset : asset.url;
  const bytes = typeof asset === "string" ? 0 : asset.bytes ?? 0;
  if (typeof assetUrl !== "string") {
    return false;
  }
  return (
    INSTALL_ASSET_URLS.includes(assetUrl) ||
    (bytes <= INSTALL_ASSET_MAX_BYTES &&
      INSTALL_ASSET_PREFIXES.some((prefix) => assetUrl.startsWith(prefix)))
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      await cacheAssets(cache, SHELL_ASSETS);
      const runtimeAssets = (await loadRuntimeAssetList(cache)).filter(shouldCacheAtInstall);
      await cacheAssets(cache, runtimeAssets);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const responseCopy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put("/prototype/index.html", responseCopy);
          });
        }
        return response;
      }).catch(() => caches.match("/prototype/index.html"))
    );
    return;
  }

  if (NETWORK_FIRST_ASSETS.has(url.pathname)) {
    event.respondWith(
      fetch(new Request(request, { cache: "reload" })).then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const responseCopy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, responseCopy);
          });
        }
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }
        const responseCopy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => {
          cache.put(request, responseCopy);
        });
        return response;
      });
    })
  );
});
