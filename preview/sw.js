const OFFLINE_MESSAGES={"es":"Sin conexión y sin copia guardada todavía. Abre Comidadle una vez con internet para poder jugar sin conexión después.","en":"You are offline and no saved copy is available yet. Open Comidadle once with an internet connection to play offline later.","fr":"Vous êtes hors connexion et aucune copie n’a encore été enregistrée. Ouvrez Comidadle une fois avec une connexion Internet pour pouvoir jouer hors connexion ensuite.","de":"Du bist offline und es ist noch keine Kopie gespeichert. Öffne Comidadle einmal mit Internetverbindung, damit du später offline spielen kannst.","pt-BR":"Você está sem conexão e ainda não há uma cópia salva. Abra o Comidadle uma vez com internet para poder jogar offline depois.","pt-PT":"Estás sem ligação e ainda não há uma cópia guardada. Abre o Comidadle uma vez com internet para poderes jogar offline depois."};
function offlineMessage(request){const requested=(request.headers.get("Accept-Language")||self.navigator.language||"es").split(",")[0].toLowerCase();const locale=requested.startsWith("pt-pt")?"pt-PT":requested.startsWith("pt")?"pt-BR":requested.split("-")[0];return OFFLINE_MESSAGES[locale]||OFFLINE_MESSAGES.es;}
// Comidadle service worker — offline play support
// Bump CACHE_VERSION whenever you release a new version of index.html so
// clients pick up the fresh copy instead of serving a stale cached one.
const CACHE_VERSION = "v3.3.0";
const CACHE_NAME = "comidadle-preview-" + CACHE_VERSION + "-preview-f721d25fbf65";

// The app shell: index.html is a single self-contained file with ALL game
// data embedded inline (dish list, hints, everything). Today's dish is
// computed 100% client-side from the device clock, so caching just this
// one file is enough to let the daily game, Infinito and Memoria all work
// fully offline — no separate data file to worry about.
const APP_SHELL = [
  "./app.js?v=f721d25fbf65",
  "../i18n/runtime.js?v=f721d25fbf65",
  "../i18n/geography.js?v=f721d25fbf65",
  "../i18n/passport.js?v=f721d25fbf65",
  "../i18n/game-boot.js?v=f721d25fbf65",
  "../locales/catalogs/es.json?v=f721d25fbf65",
  "../locales/catalogs/en.json?v=f721d25fbf65",
  "../locales/catalogs/fr.json?v=f721d25fbf65",
  "../locales/catalogs/de.json?v=f721d25fbf65",
  "../locales/catalogs/pt-BR.json?v=f721d25fbf65",
  "../locales/catalogs/pt-PT.json?v=f721d25fbf65",
  "./",
  "./index.html",
  "./manifest.json",
];

// CDN libraries the app depends on. Cached opportunistically on first use
// too (see fetch handler), but pre-caching them here means the very first
// offline visit after install already has them available.
const CDN_ASSETS = [
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js",
  "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js",
  "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js",
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,800;9..144,900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Cache each entry individually so one failing (e.g. offline install,
      // or manifest.json not existing yet on some deployments) doesn't
      // abort caching the rest.
      await Promise.all(
        [...APP_SHELL, ...CDN_ASSETS].map((url) =>
          cache.add(url).catch(() => {})
        )
      );
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith("comidadle-preview-") && n !== CACHE_NAME)
          .map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

const SUPABASE_HOST = "dacgheuzlhybesnqjqzn.supabase.co";

function isSupabaseRequest(url) {
  return url.hostname === SUPABASE_HOST;
}

function isCdnAsset(url) {
  return (
    url.hostname === "cdn.jsdelivr.net" ||
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  );
}

// Stale-while-revalidate: serve the cached copy immediately for instant
// load + offline support, and update the cache in the background whenever
// the network is available so the next load gets fresh content.
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await networkPromise) || new Response(
    offlineMessage(request),
    { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}

// Cache-first: good for pinned/versioned library files and font assets that
// essentially never change once fetched.
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (e) {
    return cached || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // never intercept POST/PATCH/DELETE etc.

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }

  // Never touch Supabase API calls (auth, ranking, duels, shop, notifications...).
  // These must always hit the network live; if offline they should fail
  // naturally so the app's own existing error handling takes over, rather
  // than silently serving stale/cached data for something like a login or
  // a ranking sync.
  if (isSupabaseRequest(url)) return;

  if (isCdnAsset(url)) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Same-origin navigations and the app shell files themselves.
  const isSameOrigin = url.origin === self.location.origin;
  const isNavigation = req.mode === "navigate";
  if (isSameOrigin || isNavigation) {
    event.respondWith(staleWhileRevalidate(req));
  }
  // Anything else (e.g. other third-party requests) is left to the browser's
  // default network handling.
});
