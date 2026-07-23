// service-worker.js
//
// Tujuan: bikin app ini bisa di-install (PWA) dan tetap kebuka walau koneksi jelek/offline.
//
// PENTING - filosofi caching di sini SENGAJA konservatif:
// - Yang di-cache HANYA file app sendiri (HTML/JS/manifest/icon) yang sama-origin dengan
//   halaman ini (GitHub Pages kita). Request ke domain LAIN (Supabase, Cloudinary, Google
//   Fonts, CDN Tailwind, dst) SAMA SEKALI TIDAK disentuh service worker ini - selalu
//   langsung ke network seperti biasa. Ini penting supaya data produksi/delivery yang
//   ditampilkan SELALU data terbaru dari database, bukan data basi dari cache.
// - Untuk file app sendiri: strategi "network dulu, cache cuma buat fallback offline".
//   Jadi kalau online, selalu ambil versi terbaru dari server (gak nyangkut versi lama
//   kayak masalah caching yang dulu bikin ribet develop KitchenLog). Cache cuma dipakai
//   kalau network gagal (offline / sinyal jelek).
//
// KALAU NANTI UPDATE KODE DAN BROWSER TERASA "NYANGKUT" DI VERSI LAMA:
// naikkan angka versi di CACHE_NAME di bawah ini (misal jadi 'smc-shell-v2'), lalu
// deploy ulang. Service worker otomatis buang cache versi lama dan pakai yang baru.

const CACHE_NAME = 'smc-shell-v1';

// Daftar file app-shell yang di-precache waktu install, biar app bisa kebuka offline
// dari percobaan pertama. Sesuaikan daftar ini kalau ada file HTML baru ditambahkan.
const APP_SHELL = [
  './',
  './index.html',
  './produksi.html',
  './delivery.html',
  './admin.html',
  './profil.html',
  './ganti-pin.html',
  './mitra-monitoring.html',
  './auth-guard.js',
  './supabase-client.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((err) => console.warn('SW precache gagal (gak fatal):', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Cuma method GET yang boleh di-cache/di-intercept.
  if (event.request.method !== 'GET') return;

  // Request ke domain lain (Supabase, Cloudinary, Google Fonts, dll) dibiarkan lewat
  // apa adanya - TIDAK di-handle service worker ini sama sekali.
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
