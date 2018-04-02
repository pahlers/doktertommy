(function () {
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


    let timeoutId;

    /**
     * Whitelist of sources to cache at network fetch
     *
     * @type {string[]}
     */
    const cacheWhitelist = [
        '/muicss/*',
        '/weather-icons/*',
        '/images/*',
        ...cacheList
    ];

    self.addEventListener('install', onInstall.bind({cacheList, cacheKey}));
    self.addEventListener('fetch', onFetch.bind({cacheWhitelist, cacheKey}));
    self.addEventListener('message', onMessage);
    self.addEventListener('notificationclick', onNotificationClick);

    function onMessage(event) {
        const {type, data} = event.data;

        console.log(`[doktertommy sw] got message from type ${type}`);

        if (type === 'updateSettings') {
            setNotificationTimeout(data.notification);
        }
    }

    /**
     * Triggers on install
     *
     * @param event
     */
    function onInstall(event) {
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
    function onFetch(event) {
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

    function onNotificationClick(event) {
        console.log('[doktertommy sw] on notification click', event.notification.tag);
        event.notification.close();

        // This looks to see if the current is already open and
        // focuses if it is
        event.waitUntil(clients.matchAll({
            type: 'window'
        }).then(function (clientList) {
            const client = clientList.find(client => (client.url === '/' && 'focus' in client));

            if (client !== undefined) {
                return client.focus();
            }

            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        }));
    }

    function setNotificationTimeout(settings) {
        const {enabled, time: {hours, minutes}} = settings;
        const currentTime = Date.now();

        let notificationTime = new Date();
        notificationTime.setHours(hours);
        notificationTime.setMinutes(minutes);


        if(notificationTime < currentTime){
            notificationTime.setDate(notificationTime.getDate() + 1);

            console.log(`[doktertommy sw] date was in the past. Add one day. ${notificationTime}`);
        }

        const delay = notificationTime - currentTime;

        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
        }

        if (enabled === true) {
            console.log(`[doktertommy sw] set timer for notification over ${delay}ms`);

            timeoutId = setTimeout(    function sendNotification() {
                console.log('[doktertommy sw] show notification');


                self.registration.showNotification('Dokter Tommy', {
                    body: 'Hoe is je dag?',
                    icon: './images/192x192.png',
                    tag: 'how-is-your-day',
                });
            }, delay);
        }
    }


})();
