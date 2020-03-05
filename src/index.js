console.log('Работает!');

function ToDo(formLogin, formTask, targetTask, taskItemPattern) {
    this.formLogin = formLogin;
    this.formTask = formTask;
    this.targetTask = targetTask;
    this.taskItemPattern = taskItemPattern;
}

ToDo.prototype.authUrl = 'https://todo.hillel.it/auth/login';
ToDo.prototype.todoUrl = 'https://todo.hillel.it/todo';

ToDo.prototype.renderList = function() {
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${this.token}`,
        },
    };

    fetch(this.todoUrl, options)
        .then(result => result.json())
        .then(result => {
            // eslint-disable-next-line no-magic-numbers
            if (result.length > 0) {
                if (this.targetTask.classList.contains('hidden'))
                    this.targetTask.classList.remove('hidden');

                this.targetTask.innerHTML = result.sort((firstEl, secondEl) => {
                    // eslint-disable-next-line no-magic-numbers
                    if (firstEl.checked > secondEl.checked) return -1;
                    // eslint-disable-next-line no-magic-numbers
                    if (firstEl.checked < secondEl.checked) return 1;
                    return firstEl.priority - secondEl.priority;
                }).reduce((acc, value) => this.taskItemPattern(value) + acc, '');
            }
        });
};

ToDo.prototype.addNewTask = function() {
    const formData = {
        value: this.formTask.querySelector('[name="value"]').value,
        priority: this.formTask.querySelector('[name="priority"]').valueAsNumber,
    };
    const option = {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    };

    fetch(this.todoUrl, option)
        .then(() => {
            this.renderList();
        });
};

ToDo.prototype.toggleTask = function(taskId) {
    const options = {
        method: 'PUT',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${this.token}`,
        },
    };

    fetch(`${this.todoUrl}/${taskId}/toggle`, options)
        .then(() => {
            this.renderList();
        });
};

ToDo.prototype.deleteTask = function(taskId) {
    const option = {
        method: 'DELETE',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${this.token}`,
        },
    };

    fetch(`${this.todoUrl}/${taskId}`, option)
        .then(() => {
            this.renderList();
        });
};

ToDo.prototype.listenEvent = function() {
    this.formLogin.addEventListener('submit', event => {
        event.preventDefault();

        const formData = new FormData(this.formLogin);
        const userData = {
            value: '',
        };
        formData.forEach(item => userData.value += item);
        this.formLogin.classList.add('hidden');
        if (this.formTask.classList.contains('hidden')) {
            this.formTask.classList.remove('hidden');
        }
        this.formLogin.reset();
        this.token = localStorage.getItem(userData.value);

        if (!this.token) {
            const options = {
                method: 'POST',
                headers: {
                    'accept': '*/*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            };

            fetch(this.authUrl, options)
                .then(result => result.json())
                .then(result => {
                    this.token = result['access_token'];
                    localStorage.setItem(userData.value, this.token);
                });
        } else {
            this.renderList();
        }
    });

    this.formTask.addEventListener('submit', event => {
        event.preventDefault();

        this.addNewTask();
        this.formTask.reset();
    });

    this.targetTask.addEventListener('click', event => {
        if (event.target.nodeName !== 'BUTTON') return;

        const $btn = event.target;
        const $li = $btn.closest('.taskList__item');

        if ($btn.dataset.method === 'done') {
            this.toggleTask($li.dataset.id);
        } else if ($btn.dataset.method === 'delete') {
            this.deleteTask($li.dataset.id);
        }
    });
};

const loginForm = document.querySelector('#login');
const taskForm = document.querySelector('#taskForm');
const taskList = document.querySelector('#taskList');
const taskItemPattern = pattern => `
        <li data-id="${pattern._id}" class="taskList__item ${pattern.checked ? 'taskList__item--done' : ''}">
            <p class="row1-2">${pattern.priority}</p>
            <p class="row1-2 taskList_item taskList_item--leftMiddle">${pattern.value}</p>
            <button data-method="done" ${pattern.checked ? 'disabled' : ''}>Done</button>
            <button data-method="delete">Delete</button>
        </li>
    `;

const toDoObj = new ToDo(loginForm, taskForm, taskList, taskItemPattern);
toDoObj.listenEvent();