const CACHE = "presenty-v1"

const files = [

"index.html",
"app.js",
"manifest.json",
"face-api.min.js"

]

self.addEventListener("install", e=>{

e.waitUntil(

caches.open(CACHE).then(cache=>{
return cache.addAll(files)
})

)

})

self.addEventListener("fetch", e=>{

e.respondWith(

caches.match(e.request).then(res=>{
return res || fetch(e.request)
})

)

})