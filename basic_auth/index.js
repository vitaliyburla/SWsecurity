const express = require('express');
const app = express();
const port = 3000;

app.use((req, res, next) => {
    console.log('\n=======================================================\n');

    // Отримуємо header Authorization
    const authorizationHeader = req.get('Authorization');
    console.log('authorizationHeader', authorizationHeader);

    // Перевіряємо header Authorization, якщо він пустий - сетимо його і відправляємо response 401
    if (!authorizationHeader) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Ukraine"');
        res.status(401);
        res.send('Unauthorized');
        return;
    }
    // Розділяємо header формату Basic [hash] по пробілу на масив з двох частин та беремо з нього [hash]
    const authorizationBase64Part = authorizationHeader.split(' ')[1];
    // Декодуємо hash формату base64 та отримаємо string формату login:password
    const decodedAuthorizationHeader = Buffer.from(
        authorizationBase64Part,
        'base64'
    ).toString('utf-8');
    console.log('decodedAuthorizationHeader', decodedAuthorizationHeader);
    // Дістаємо login та password з string формату login:password, розділяючи її по :
    const login = decodedAuthorizationHeader.split(':')[0];
    const password = decodedAuthorizationHeader.split(':')[1];
    console.log('Login/Password', login, password);

    // Якщо логін та пароль введені правильно - сервер переходить до наступного middleware
    if (login == 'SomeLogin' && password == 'SomePassword') {
        req.login = login;
        return next();
    }

    // У випадку, якщо дані авторизації були введені неправильно, відправляємо response 401
    res.setHeader('WWW-Authenticate', 'Basic realm="Ukraine"');
    res.status(401);
    res.send('Unauthorized');
});

// Після успішної авторизації Middleware відправляє нас на endpoint /, де надходить response Hello [login]
app.get('/', (req, res) => {
    res.send(`Hello ${req.login}`);
});

// Запуск серверу на вказаному порті
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
