#!/bin/bash

echo "================================"
echo "  SLITHER.IO - Запуск сервера"
echo "================================"
echo ""

echo "Проверка Node.js..."
if ! command -v node &> /dev/null
then
    echo "ОШИБКА: Node.js не установлен!"
    echo "Скачайте его с https://nodejs.org/"
    exit 1
fi

echo "Node.js найден!"
echo ""

if [ ! -d "node_modules" ]; then
    echo "Установка зависимостей..."
    npm install
    echo ""
fi

echo "Запуск сервера..."
echo ""
echo "================================"
echo "  Сервер запущен!"
echo "  Откройте: http://localhost:3000"
echo "================================"
echo ""

node server.js
