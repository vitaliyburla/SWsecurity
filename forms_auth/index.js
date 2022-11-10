const uuid = require('uuid');
const express = require('express');
const cookieParser = require('cookie-parser');
const onFinished = require('on-finished');
const bodyParser = require('body-parser');
const path = require('path');
const port = 3000;
const fs = require('fs');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Задаємо певний ключ для cookie
const SESSION_KEY = 'session';

class Session {
    #sessions = {};

    constructor() {
        try {
            // Отримуємо всі сесії з файлу session.json
            this.#sessions = fs.readFileSync('./sessions.json', 'utf8');
            this.#sessions = JSON.parse(this.#sessions.trim());

            console.log(this.#sessions);
        } catch (e) {
            this.#sessions = {};
        }
    }

    #storeSessions() {
        // Записуємо всі сесії в файл session.json
        fs.writeFileSync(
            './sessions.json',
            JSON.stringify(this.#sessions),
            'utf-8'
        );
    }

    set(key, value) {
        // Якщо немає даних для сесії, створюємо пусті
        if (!value) {
            value = {};
        }
        // Додаємо session id для поточної сесії як ключ
        this.#sessions[key] = value;
        // Записуємо всі сесії в файл session.json
        this.#storeSessions();
    }

    get(key) {
        // Отримуємо дані для поточної сесії
        return this.#sessions[key];
    }

    init(res) {
        // Генеруємо рандомний id
        const sessionId = uuid.v4();
        // Сетимо cookie для response, яку не можна редагувати з браузера
        res.set('Set-Cookie', `${SESSION_KEY}=${sessionId}; HttpOnly`);
        // Сетимо session id для поточної сесії
        this.set(sessionId);

        return sessionId;
    }

    destroy(req, res) {
        // Видаляємо сесію
        const sessionId = req.sessionId;
        delete this.#sessions[sessionId];
        this.#storeSessions();
        res.set('Set-Cookie', `${SESSION_KEY}=; HttpOnly`);
    }
}

const sessions = new Session();

app.use((req, res, next) => {
    let currentSession = {};
    let sessionId;

    // Якщо session існує в cookie, то отримуємо дані для поточної сесії, якщо ні, створюємо нову сесію
    if (req.cookies[SESSION_KEY]) {
        sessionId = req.cookies[SESSION_KEY];
        currentSession = sessions.get(sessionId);
        if (!currentSession) {
            currentSession = {};
            sessionId = sessions.init(res);
        }
    } else {
        sessionId = sessions.init(res);
    }

    req.session = currentSession;
    req.sessionId = sessionId;

    onFinished(req, () => {
        const currentSession = req.session;
        const sessionId = req.sessionId;
        sessions.set(sessionId, currentSession);
    });

    next();
});

app.get('/', (req, res) => {
    console.log(req.session);
    // Якщо юзер авторизований, відправляє контент з username та посиланням на logout
    if (req.session.username) {
        return res.json({
            username: req.session.username,
            logout: 'http://localhost:3000/logout',
        });
    }
    res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/logout', (req, res) => {
    // Видаляємо сесію та перенаправляємо юзера на сторінку /
    sessions.destroy(req, res);
    res.redirect('/');
});

// Існуючі юзери
const users = [
    {
        login: 'user',
        password: 'user',
        username: 'Bill',
    },
    {
        login: 'admin',
        password: 'admin',
        username: 'Admin Rob',
    },
];

app.post('/api/login', (req, res) => {
    // Отримуємо логін та пароль з форми надісланої юзером
    const { login, password } = req.body;
    // Перевіряємо чи є така звʼязка логіну та паролю
    const user = users.find((user) => {
        if (user.login == login && user.password == password) {
            return true;
        }
        return false;
    });
    // Якщо звʼязка уснує то додаємо в сесію інформацію про юзера
    if (user) {
        req.session.username = user.username;
        req.session.login = user.login;
        // Відправляємо дані про юзера
        res.json({ username: login });
    }
    // Якщо юзера не існує то відправляємо помилку 401
    res.status(401).send();
});

// Запускаємо сервер на вказаному порті
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
