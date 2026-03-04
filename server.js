const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname));

const players = {};
const food = [];
const FOOD_COUNT = 500; // Увеличено с 100 до 500
const MAP_SIZE = 4000; // Увеличен размер карты

// Генерация еды
function generateFood() {
    for (let i = 0; i < FOOD_COUNT; i++) {
        food.push({
            x: Math.random() * MAP_SIZE,
            y: Math.random() * MAP_SIZE,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`,
            value: 1 // Обычная еда стоит 1 очко
        });
    }
}

generateFood();

io.on('connection', (socket) => {
    console.log('Новый игрок подключился:', socket.id);

    // Создание нового игрока
    players[socket.id] = {
        id: socket.id,
        x: Math.random() * MAP_SIZE,
        y: Math.random() * MAP_SIZE,
        segments: [],
        angle: 0,
        speed: 3,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        name: 'Игрок',
        score: 10
    };

    // Инициализация сегментов змейки
    const player = players[socket.id];
    for (let i = 0; i < 10; i++) {
        player.segments.push({
            x: player.x,
            y: player.y
        });
    }

    // Отправка начальных данных игроку
    socket.emit('init', {
        id: socket.id,
        players: players,
        food: food,
        mapSize: MAP_SIZE
    });

    // Получение имени игрока
    socket.on('setName', (name) => {
        if (players[socket.id]) {
            players[socket.id].name = name.substring(0, 20);
        }
    });

    // Обновление направления
    socket.on('updateAngle', (angle) => {
        if (players[socket.id]) {
            players[socket.id].angle = angle;
        }
    });

    // Ускорение
    socket.on('boost', (isBoosting) => {
        if (players[socket.id]) {
            players[socket.id].speed = isBoosting ? 1 : 1;
        }
    });

    // Отключение игрока
    socket.on('disconnect', () => {
        console.log('Игрок отключился:', socket.id);
        delete players[socket.id];
    });
});

// Игровой цикл
setInterval(() => {
    // Обновление позиций игроков
    Object.values(players).forEach(player => {
        // Движение головы
        player.x += Math.cos(player.angle) * player.speed;
        player.y += Math.sin(player.angle) * player.speed;

        // Проверка границ карты - бесконечная карта (wraparound)
        if (player.x < 0) player.x = MAP_SIZE;
        if (player.x > MAP_SIZE) player.x = 0;
        if (player.y < 0) player.y = MAP_SIZE;
        if (player.y > MAP_SIZE) player.y = 0;

        // Обновление сегментов
        player.segments.unshift({ x: player.x, y: player.y });
        
        // Поддержание нужной длины
        const targetLength = player.score;
        if (player.segments.length > targetLength) {
            player.segments.pop();
        }

        // Проверка столкновения с едой
        for (let i = food.length - 1; i >= 0; i--) {
            const f = food[i];
            const dx = player.x - f.x;
            const dy = player.y - f.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 15) {
                food.splice(i, 1);
                const foodValue = f.value || 1; // Используем значение еды или 1 по умолчанию
                player.score += foodValue;
                
                // Добавление новой обычной еды
                food.push({
                    x: Math.random() * MAP_SIZE,
                    y: Math.random() * MAP_SIZE,
                    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                    value: 1
                });
            }
        }

        // Проверка столкновений с другими игроками
        Object.values(players).forEach(otherPlayer => {
            if (otherPlayer.id === player.id) return;

            // Проверка столкновения головы с телом другого игрока
            otherPlayer.segments.forEach((segment, index) => {
                if (index < 10) return; // Игнорируем голову

                const dx = player.x - segment.x;
                const dy = player.y - segment.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 10) {
                    // Игрок умер - создаём красивое рассыпание на еду
                    player.segments.forEach((seg, idx) => {
                        // Создаём несколько частиц еды из каждого сегмента
                        const particlesPerSegment = idx === 0 ? 5 : 3; // Больше еды из головы
                        for (let p = 0; p < particlesPerSegment; p++) {
                            const angle = Math.random() * Math.PI * 2;
                            const spread = Math.random() * 20;
                            food.push({
                                x: seg.x + Math.cos(angle) * spread,
                                y: seg.y + Math.sin(angle) * spread,
                                color: player.color,
                                value: 2 // Стоит больше обычной еды
                            });
                        }
                    });

                    // Респавн игрока
                    player.x = Math.random() * (MAP_SIZE - 100) + 50;
                    player.y = Math.random() * (MAP_SIZE - 100) + 50;
                    player.segments = [];
                    player.score = 10;
                    
                    for (let i = 0; i < 10; i++) {
                        player.segments.push({
                            x: player.x,
                            y: player.y
                        });
                    }
                }
            });
        });
    });

    // Отправка обновлений всем клиентам
    io.emit('update', {
        players: players,
        food: food
    });
}, 1000 / 30); // 30 FPS

const PORT = process.env.PORT || 25565;
const DOMAIN = process.env.DOMAIN || 'staff-glucose.gl.joinmc.link';

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🎮 Сервер Slither.io запущен!`);
    console.log(`📍 Порт: ${PORT}`);
    console.log(`🌐 Домен: http://${DOMAIN}:${PORT}`);
    console.log(`🔗 Локально: http://localhost:${PORT}`);
    console.log(`\n✅ Отправьте друзьям ссылку: http://${DOMAIN}:${PORT}`);
});