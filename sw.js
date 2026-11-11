// シュガービートのサービスワーカー（build_public.py が書き出す・手で直さない）。版 4b0029d56fbae738
const VER = "4b0029d56fbae738", CORE = "sb-core-" + VER, MEDIA = "sb-media";
const CORE_FILES = ["./", "index.html", "manifest.webmanifest", "voice.json", "static/DelaGothicOne-Regular.ttf", "static/HachiMaruPop-Regular.ttf", "static/aichan_sugarhigh.webp"];
const KEEP = new Set(["chart/160c4c8121104cdea09a2a499aff0778.json?v=ba79e9f6c1c4d849", "chart/3aa4fb21df274307be1f1bd3a77d13e4.json?v=be4418edc4398607", "chart/bd7917bc03e34cbbb0f8379c59e26b25.json?v=c63499bbefe3f1ff", "chart/c3ae59aa5e60475397f04057519783ee.json?v=f7ec79e7de6d84dd", "chart/deb0868ab4e348ddb52799d8f9e8f07f.json?v=7aa69e07bbfc9e6f", "chart/e4f0ed6f86b445d1a74f8a264cb12b62.json?v=774464995146d2b9", "cover/160c4c8121104cdea09a2a499aff0778.jpg?v=32e6cdd89ee936a7", "cover/3aa4fb21df274307be1f1bd3a77d13e4.jpg?v=ca87b8ed3b069192", "cover/bd7917bc03e34cbbb0f8379c59e26b25.jpg?v=469220912e919933", "cover/c3ae59aa5e60475397f04057519783ee.jpg?v=4f9a9e86d8a47bfd", "cover/deb0868ab4e348ddb52799d8f9e8f07f.jpg?v=72112e42cbc319f4", "cover/e4f0ed6f86b445d1a74f8a264cb12b62.jpg?v=14148adb794dbf9a", "media/160c4c8121104cdea09a2a499aff0778.m4a?v=a466ffcc5fa45fc7", "media/160c4c8121104cdea09a2a499aff0778_mv.mp4?v=740005ba28cf7f60", "media/3aa4fb21df274307be1f1bd3a77d13e4.m4a?v=c258ff54dde8abb2", "media/bd7917bc03e34cbbb0f8379c59e26b25.m4a?v=e9c865ba99e9dc0c", "media/bd7917bc03e34cbbb0f8379c59e26b25_mv.mp4?v=4912dcf8607c1f3a", "media/c3ae59aa5e60475397f04057519783ee.m4a?v=af46a0745a7187c0", "media/c3ae59aa5e60475397f04057519783ee_mv.mp4?v=bbf662812d4c8f96", "media/deb0868ab4e348ddb52799d8f9e8f07f.m4a?v=27a2b0c8d5fed03b", "media/e4f0ed6f86b445d1a74f8a264cb12b62.m4a?v=919546d6e688abc8", "media/e4f0ed6f86b445d1a74f8a264cb12b62_mv.mp4?v=2812cf2fc40e22a6"]);
// 受け取る時はブラウザの残り物を使わずサーバーから取り直す（GitHub Pages は10分の再利用を許すので、載せた直後だと古い voice.json をつかみうる）
self.addEventListener("install", e => e.waitUntil(caches.open(CORE).then(c => c.addAll(CORE_FILES.map(u => new Request(u, {cache: "reload"})))).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("sb-core-") && k !== CORE) await caches.delete(k);
  const m = await caches.open(MEDIA);   // いまの曲の一覧に無い物・中身の変わった古い物を消す
  for (const r of await m.keys()) { const u = new URL(r.url); if (!KEEP.has(u.pathname.split("/").slice(-2).join("/") + u.search)) await m.delete(r) }
  await self.clients.claim();
})()));
// ページからの「これを残して」（初めて開いた時、sw.js が動き出す前に受け取った物）。曲の一覧にある物だけ
self.addEventListener("message", e => {
  const k = e.data && e.data.keep; if (!Array.isArray(k)) return;
  e.waitUntil(caches.open(MEDIA).then(async m => {
    for (const x of k) { const u = new URL(x, self.registration.scope);
      if (!KEEP.has(u.pathname.split("/").slice(-2).join("/") + u.search) || await m.match(u.href)) continue;
      try { await m.add(u.href) } catch (err) {} }
  }));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;
  if (u.searchParams.has("v")) {
    e.respondWith(caches.open(MEDIA).then(async m => {
      const hit = await m.match(r); if (hit) return hit;
      const res = await fetch(r); if (res.ok && res.status === 200) await m.put(r, res.clone()); return res;
    }));
  } else if (r.mode === "navigate") {
    e.respondWith(fetch(r).then(res => { if (res.ok) caches.open(CORE).then(c => c.put("index.html", res.clone())); return res })
      .catch(async () => (await caches.match("index.html")) || Response.error()));
  } else {
    e.respondWith(caches.match(r).then(hit => hit || fetch(r)));
  }
});
