console.log('[doktertommy sw] run');

/**
 * Key of cache used cache
 *
 * @type {string}
 */
const cacheKey = 'doktertommy-static-v1';

/**
 * Cache sources at install
 *
 * @type {string[]}
 */
const cacheList = [
    '/',
    '/main.css',
    '/main.js',
    '/manifest.json'
];

/**
 * Whitelist of sources to cache at network fetch
 *
 * @type {string[]}
 */
const cacheWhitelist = [
    '/muicss/*',
    '/weather-icons/*',
    ...cacheList
];

self.addEventListener('install', oninstall.bind({cacheList, cacheKey}));
self.addEventListener('fetch', onfetch.bind({cacheWhitelist, cacheKey}));

/**
 * Triggers on install
 *
 * @param event
 */
function oninstall(event) {
    const {cacheList, cacheKey} = this;
    console.log('[doktertommy sw] install');

    event.waitUntil(
        caches.open(cacheKey).then(function (cache) {
            return cache.addAll(cacheList)
                .then(() => console.debug('[doktertommy sw] all cached', cacheList))
                .catch(error => console.warn('[doktertommy sw] cache failed', error));
        })
    );
}

/**
 * Triggers on fetch
 *
 * @param event
 */
function onfetch(event) {
    const {cacheWhitelist, cacheKey} = this;
    const request = event.request;

    console.log(`[doktertommy sw] fetch ${request.url}`);

    event.respondWith(
        caches.open(cacheKey)
            .then(function (cache) {
                return cache.match(request)
                    .then(function (response) {
                        console.debug(`[doktertommy sw] fetched cache ${request.url}`);

                        const updatePromise = getFromNetwork(request, cacheWhitelist, cache);

                        return response || updatePromise;  // return from cache, otherwise get from network
                    })
            })
    );
}

/**
 * Gets source from network and caches if needed.
 *
 * @param {Request} request
 * @param {array} cacheWhitelist
 * @param {Cache} cache
 * @return {Promise<Response>}
 */
function getFromNetwork(request, cacheWhitelist, cache) {
    return fetch(request)
        .then(function (networkResponse) {
            console.debug(`[doktertommy sw] fetched network ${request.url}`);

            if (needToBeCached(request.url, cacheWhitelist)) {
                console.debug(`[doktertommy sw] add to cache ${request.url}`);

                cache.put(request, networkResponse.clone());
            }

            return networkResponse;
        })
        .catch(function (error) {
            console.error(`[doktertommy sw] fetch from network failed ${request.url} error ${error}`);
        });
}

/**
 * Returns true source needs to be cached.
 *
 * @param {string} url
 * @param {array} cacheWhitelist
 * @return {boolean}
 */
function needToBeCached(url, cacheWhitelist) {
    const path = new URL(url).pathname;

    return cacheWhitelist.some(function (cacheRule) {
        if (cacheRule.endsWith('*')) {
            return path.startsWith(cacheRule.slice(0, -1));

        } else {
            return path === cacheRule;
        }
    });
}
