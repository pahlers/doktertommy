(function () {
    console.log('[doktertommy] run');

    init();

    function init() {
        const date = createDateString();

        addEvents(date);
        addDate(date);
    }

    function addEvents(date) {
        Array.from(document.querySelectorAll('.how-button'))
            .map(element => element.addEventListener('click', selectHow));

        document.querySelector('.save-button')
            .addEventListener('click', saveThisDay.bind({date}));

    }

    function createDateString() {
        const date = new Date();
        const day = date.getDay();
        const month = date.getMonth() + 1;

        return `${day > 9 ? day : '0' + day}-${month > 9 ? month : '0' + month}-${date.getFullYear()}`;
    }

    function addDate(date) {
        document.querySelector('.today').textContent = date;
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
        const {date} = this;
        const list = document.querySelector('.history-list');
        const selectedElement = document.querySelector('.how-button--selected');

        const howIconNames = [
            'wi-sprinkle',
            'wi-day-fog',
            'wi-day-sunny-overcast',
            'wi-day-windy',
            'wi-day-sunny'
        ];
        let howIconName = '';

        if (selectedElement) {
            const [howNumber] = Array.from(selectedElement.classList)
                .filter(item => item.startsWith('how-button--number-'))
                .map(item => item.slice(-1));

            howIconName = howIconNames[howNumber - 1];
        }

        const template = document.querySelector('.history-item--template').content;
        const dateElement = template.querySelector('.date');
        const howElement = template.querySelector('.how');
        const whyElement = template.querySelector('.why');

        dateElement.textContent = date;

        howElement.classList.add(howIconName);

        whyElement.textContent = document.querySelector('.why textarea').value;

        const clone = document.importNode(template, true);

        list.insertBefore(clone, list.firstChild);
    }
})();