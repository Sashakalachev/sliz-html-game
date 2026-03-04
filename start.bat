@echo off
echo ================================
echo   SLITHER.IO - Запуск сервера
echo ================================
echo.

echo Проверка Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ОШИБКА: Node.js не установлен!
    echo Скачайте его с https://nodejs.org/
    pause
    exit
)

echo Node.js найден!
echo.

if not exist "node_modules" (
    echo Установка зависимостей...
    call npm install
    echo.
)

echo Запуск сервера...
echo.
echo ================================
echo   Сервер запущен!
echo   Откройте: http://localhost:3000
echo ================================
echo.

node server.js

pause
