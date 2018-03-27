(function () {
    console.log('[doktertommy] run');

    const storageKey = 'dokterTommyHistoryList';

    init();

    function init() {
        enableEvents();
        enableServiceWorker();
        fillHistoryFromStorage();
    }

    function enableEvents() {
        console.log('[doktertommy] enable events');

        Array.from(document.querySelectorAll('.how-button'))
            .map(element => element.addEventListener('click', selectHow));

        document.querySelector('.save-button')
            .addEventListener('click', saveThisDay);
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

    function generateDateString() {
        const date = new Date();
        const day = date.getDay();
        const month = date.getMonth() + 1;

        return `${day > 9 ? day : '0' + day}-${month > 9 ? month : '0' + month}-${date.getFullYear()}`;
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

        saveInStorage(day);
    }

    function saveInStorage(day) {
        let list = JSON.parse(localStorage.getItem(storageKey));

        if (list === null) {
            list = [];
        }

        list.push(day);

        localStorage.setItem(storageKey, JSON.stringify(list));
    }

    function fillHistoryFromStorage() {
        console.log('[doktertommy] fill history from storage');

        let list = JSON.parse(localStorage.getItem(storageKey));

        if (list !== null) {
            list.forEach(addToHistoryList);
        }
    }

    function getDayData() {
        const date = generateDateString();
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
})();