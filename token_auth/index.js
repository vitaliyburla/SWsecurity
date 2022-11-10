const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const port = 3000;
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

dotenv.config();
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const secretKey = process.env.JWT_SECRET_KEY;

app.get('/', (req, res) => {
    // Дістаємо токен з хедера
    const token = req.headers.authorization?.split(' ')[1];
    // Якщо токен існує
    if (token) {
        try {
            // Перевіряєо цей токен та отримуємо дані з нього
            const user = jwt.verify(token, secretKey);
            console.log(user);
            // Відправляємо дані на клієнт
            return res.json({
                username: user.username,
                logout: 'http://localhost:3000/logout',
            });
        } catch {
            console.log(`Token expired`);
        }
    }
    res.sendFile(path.join(__dirname + '/index.html'));
});

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
    const { login, password } = req.body;

    const user = users.find((user) => {
        if (user.login == login && user.password == password) {
            return true;
        }
        return false;
    });

    if (user) {
        // Створюємо новий токен, який буде зберігати в собі username, з часом життя 10 секунд (для тесту)
        const token = jwt.sign({ username: user.username }, secretKey, {
            expiresIn: '10s',
        });
        res.json({ token });
    }

    res.status(401).send();
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
