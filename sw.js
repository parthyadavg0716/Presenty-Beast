const CACHE = "presenty-v2"

const files = [
  "index.html",
  "app.js",
  "manifest.json",
  "face-api.min.js",
  "icon-192.png",
  "icon-512.png",
  "models/face_landmark_68_model-shard1",
  "models/face_landmark_68_model-weights_manifest.json",
  "models/face_recognition_model-shard1",
  "models/face_recognition_model-shard2",
  "models/face_recognition_model-weights_manifest.json",
  "models/tiny_face_detector_model-shard1",
  "models/tiny_face_detector_model-weights_manifest.json"
]

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(files)
    })
  )
})

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => {
      return res || fetch(e.request)
    })
  )
})