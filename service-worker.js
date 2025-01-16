// Names of the two caches used in this version of the service worker.
// Change to v2, etc. when you update any of the local resources, which will
// in turn trigger the install event again.
// const PRECACHE = 'precache-v1';
// const RUNTIME = 'runtime';

// A list of local resources we always want to be cached.
// const PRECACHE_URLS = [
//     'index.html',
//     './', // Alias for index.html
//     'styles.css',
//     '../../styles/main.css',
//     'demo.js'
// ];

// The install handler takes care of precaching the resources we always need.
self.addEventListener('install', event => {
    // event.waitUntil(
    //     caches.open(PRECACHE)
    //         .then(cache => cache.addAll(PRECACHE_URLS))
    //         .then(self.skipWaiting())
    // );
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener('activate', event => {
    // const currentCaches = [PRECACHE, RUNTIME];
    // event.waitUntil(
    //     caches.keys().then(cacheNames => {
    //         return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    //     }).then(cachesToDelete => {
    //         return Promise.all(cachesToDelete.map(cacheToDelete => {
    //             return caches.delete(cacheToDelete);
    //         }));
    //     }).then(() => self.clients.claim())
    // );
});

// The fetch handler serves responses for same-origin resources from a cache.
// If no response is found, it populates the runtime cache with the response
// from the network before returning it to the page.
self.addEventListener('fetch', event => {
    // Skip cross-origin requests, like those for Google Analytics.
    // if (event.request.url.startsWith(self.location.origin)) {
    //     event.respondWith(
    //         caches.match(event.request).then(cachedResponse => {
    //             if (cachedResponse) {
    //                 return cachedResponse;
    //             }

    //             return caches.open(RUNTIME).then(cache => {
    //                 return fetch(event.request).then(response => {
    //                     // Put a copy of the response in the runtime cache.
    //                     return cache.put(event.request, response.clone()).then(() => {
    //                         return response;
    //                     });
    //                 });
    //             });
    //         })
    //     );
    // }
});

self.addEventListener('push', function (event) {
    console.log(`[sw] push event`);
    const text = event.data.text() || 'no payload';
    // const payload = event.data ? JSON.parse(event.data.text()) : { msg: 'no payload' };
    const title = 'sw push title';
    event.waitUntil(
        self.registration.showNotification(title, {
            body: text,
            // url: payload.url,
            // icon: payload.icon
        })
    );
});

self.addEventListener('notificationclick', function (event) {
    // const { id, url } = event.notification.data;
    console.log(`[sw] notificationclick event`, `tag=${event.notification.tag}`, `action=${event.action}`);

    event.notification.close();

    event.waitUntil(
        clients
            .matchAll({
                includeUncontrolled: true,
                type: "window",
            })
            .then((clientList) => {
                console.log('[sw] clientList', clientList.length, clientList[0]?.url)
                let postMessage = '';

                if (event.notification.tag === 'custom') {
                    switch (event.action) {
                        case 'alert':
                            postMessage = 'notification:alert';
                            break;
                        case 'redirect-to-demo-page':
                        default:
                            postMessage = 'notification:redirect-to-demo-page';
                            break;
                    }
                }

                for (const client of clientList) {
                    if (/* client.url === "/" && */ "focus" in client) {
                        postMessage && client.postMessage(postMessage);
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    const client = clients.openWindow("/");
                    postMessage && client.postMessage(postMessage);
                    return client;
                }
            }),
    );
});

console.log(`[sw] init`);
