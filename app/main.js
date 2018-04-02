(function () {
    console.log('[doktertommy] run');

    const settingsStorageKey = `dokterTommySettings`;
    const historyStorageKey = `dokterTommyHistoryList`;

    enableEvents();
    enableServiceWorker();

    const defaultSettings = {
        notification: {
            enabled: false,
            time: {
                hours: 18,
                minutes: 0
            }
        }
    };

    renderSettings(getSettingsFromStorage());
    renderHistory(getHistoryFromStorage());

    function enableEvents() {
        console.log('[doktertommy] enable events');

        Array.from(document.querySelectorAll('.how-button'))
            .map(element => element.addEventListener('click', selectHow));

        document.querySelector('.save-button')
            .addEventListener('click', saveThisDay);

        document.querySelector('.settings-button')
            .addEventListener('click', toggleQuestionsAndSettings);

        document.querySelector('.leave-settings-button')
            .addEventListener('click', leaveSettings);

        Array.from(document.querySelectorAll('.notification-status input'))
            .map(element => element.addEventListener('click', requestNotificationPermission));
    }

    function enableServiceWorker() {
        console.log('[doktertommy] enable service worker');

        if ('serviceWorker' in navigator) {
            console.log('[doktertommy] service worker is supported');

            navigator.serviceWorker.register('service-worker.js', {
                scope: './'
            })
                .then(function (data) {
                    console.log(`[doktertommy] server worker started`, data);

                })
                .catch(function (error) {
                    console.error(`[doktertommy] server worker didn't work`, error);
                });

        } else {
            console.warn(`[doktertommy] server worker isn't supported by browser`);
        }
    }

    function leaveSettings() {
        storeSettings();
        toggleQuestionsAndSettings();
    }

    function storeSettings() {
        const enabled = document.querySelector('.settings .notification-status input[value="on"]').checked;
        const hours = parseInt(document.querySelector('.settings .notification-time-hours').value, 10) || 0;
        const minutes = parseInt(document.querySelector('.settings .notification-time-minutes').value, 10) || 0;

        const settings = Object.assign({}, getSettingsFromStorage(), {
            notification: {
                enabled,
                time: {
                    hours,
                    minutes
                }
            }
        });

        if ('serviceWorker' in navigator) {
            console.log('[doktertommy] send to serviceworker');

            navigator.serviceWorker.controller.postMessage({
                type: 'updateSettings',
                data: settings
            });
        }

        console.log('[doktertommy] store settings', JSON.stringify(settings, null, 2));

        localStorage.setItem(settingsStorageKey, JSON.stringify(settings));
    }

    function toggleQuestionsAndSettings() {
        console.log('[doktertommy] toggle questions and settings');

        document.querySelector('.questions').classList.toggle('hidden');
        document.querySelector('.settings').classList.toggle('hidden');
    }

    function generateDateTimeString() {
        const date = new Date();
        const dateNumber = ('' + date.getDate()).padStart(2, '0');
        const month = ('' + (date.getMonth() + 1)).padStart(2, '0');
        const hours = ('' + date.getHours()).padStart(2, '0');
        const minutes = ('' + date.getMinutes()).padStart(2, '0');

        return `${dateNumber}-${month}-${date.getFullYear()} ${hours}:${minutes}`;
    }

    function selectHow(event) {
        let {target} = event;

        if (target.classList.contains('wi')) {
            target = target.parentElement;
        }

        removeHowSelected();
        target.classList.add('how-button--selected');
    }

    function removeHowSelected() {
        const selectedElement = document.querySelector('.how-button--selected');

        if (selectedElement !== null) {
            selectedElement.classList.remove('how-button--selected');
        }
    }

    function saveThisDay() {
        const day = getDayData();

        console.log('[doktertommy] save day', day);

        cleanForm();
        addToHistoryList(day);

        setHistoryInStorage(day);
    }

    function getSettingsFromStorage() {
        return localStorage[settingsStorageKey] !== undefined ? JSON.parse(localStorage.getItem(settingsStorageKey)) : defaultSettings;
    }

    function getHistoryFromStorage() {
        return JSON.parse(localStorage.getItem(historyStorageKey));
    }

    function setHistoryInStorage(day) {
        let list = JSON.parse(localStorage.getItem(historyStorageKey));

        if (list === null) {
            list = [];
        }

        list.push(day);

        localStorage.setItem(historyStorageKey, JSON.stringify(list));
    }

    function renderHistory(history) {
        console.log('[doktertommy] fill history from storage');

        if (history !== null) {
            history.forEach(addToHistoryList);
        }
    }

    function getDayData() {
        const date = generateDateTimeString();
        const selectedElement = document.querySelector('.how-button--selected');

        let number;

        if (selectedElement) {
            [number] = Array.from(selectedElement.classList)
                .filter(item => item.startsWith('how-button--number-'))
                .map(item => parseInt(item.slice(-1), 10));

        }

        const description = document.querySelector('.why textarea').value;

        return {
            date,
            number,
            description
        };
    }

    function cleanForm() {
        removeHowSelected();
        document.querySelector('.why textarea').value = '';
    }

    function addToHistoryList({date, number, description}) {
        const list = document.querySelector('.history-list');
        const template = document.querySelector('.history-item--template').content;
        const clone = document.importNode(template, true);

        const howIconNames = [
            'wi-sprinkle',
            'wi-day-fog',
            'wi-day-sunny-overcast',
            'wi-day-windy',
            'wi-day-sunny'
        ];

        clone.querySelector('.date').textContent = date;
        clone.querySelector('.why').textContent = description;

        if (number !== undefined) {
            clone.querySelector('.how').classList.add(howIconNames[number - 1]);
        }

        list.insertBefore(clone, list.firstChild);
    }

    function renderSettings(settings) {
        console.log('[doktertommy] render settings');

        if ('serviceWorker' in navigator) {
            document.querySelector('.settings .notification').classList.remove('hidden');

            if (settings !== null && settings.notification !== undefined) {
                console.log('[doktertommy] render notification settings');
                const {notification: {enabled, time}} = settings;

                if (enabled === true) {
                    document.querySelector('.settings .notification-status input[value="on"]').setAttribute('checked', 'true');
                    document.querySelector('.settings .notification-status input[value="off"]').removeAttribute('checked');
                } else {
                    document.querySelector('.settings .notification-status input[value="on"]').removeAttribute('checked');
                    document.querySelector('.settings .notification-status input[value="off"]').setAttribute('checked', 'true');
                }

                if (time !== undefined) {
                    document.querySelector('.settings .notification-time-hours').value = ('' + time.hours).padStart(2, '0');
                    document.querySelector('.settings .notification-time-minutes').value = ('' + time.minutes).padStart(2, '0');
                }
            }
        }

        const dataElement = document.querySelector('.settings .data');
        const data = getHistoryFromStorage();
        dataElement.value = JSON.stringify(data, null, 2);
    }

    function requestNotificationPermission(event) {
        if (event.target.value === 'on') {
            // Enable notifications
            if (Notification.permission === 'default') {
                console.log('[doktertommy] request for notification');

                Notification.requestPermission(function (result) {
                    if (result === 'granted') {
                        console.log('[doktertommy] allow notification');

                        triggerTestNotification();

                    } else if (result === 'denied') {
                        console.log('[doktertommy] block notification');

                        toggleNotificationPermissionError();

                    } else {
                        console.log('[doktertommy] ignore message notification');

                        toggleNotificationPermissionError();
                    }
                });
            } else if (Notification.permission === 'granted') {
                triggerTestNotification();

            } else {
                // Notification permission is denied

                toggleNotificationPermissionError();
            }

        } else {
            // Disable notifications
            document.querySelector('.notification-permission-failed').classList.add('hidden');
        }
    }

    function toggleNotificationPermissionError() {
        document.querySelector('.notification-permission-failed').classList.toggle('hidden');
    }

    function triggerTestNotification() {
        navigator.serviceWorker.ready.then(function (registration) {
            registration.showNotification('Dokter Tommy', {
                body: 'Hoe is je dag?',
                icon: './images/192x192.png',
                tag: 'how-is-your-day',
            });
        });
    }
})();