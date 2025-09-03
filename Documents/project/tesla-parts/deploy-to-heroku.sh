#!/bin/bash

# === TESLA PARTS BOT DEPLOYMENT SCRIPT ===
# Автоматическое развертывание на Heroku

echo "🚀 Начинаем развертывание Tesla Parts Bot на Heroku..."

# Проверяем наличие Heroku CLI
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI не установлен. Установите его: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Проверяем авторизацию
if ! heroku auth:whoami &> /dev/null; then
    echo "❌ Вы не авторизованы в Heroku. Выполните: heroku login"
    exit 1
fi

echo "✅ Heroku CLI готов"

# Создаем приложение (если не существует)
echo "📦 Создаем приложение на Heroku..."
heroku create tesla-parts-bot --region eu 2>/dev/null || echo "⚠️  Приложение уже существует или возникла ошибка"

# Настраиваем переменные окружения
echo "🔧 Настраиваем переменные окружения..."

echo "  - TELEGRAM_BOT_TOKEN..."
echo "    ⚠️  Вставьте ваш токен бота:"
echo "    heroku config:set TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN -a tesla-parts-bot"

echo "  - IMGBB_API_KEY..."
echo "    ⚠️  Вставьте ваш IMGBB API ключ:"
echo "    heroku config:set IMGBB_API_KEY=YOUR_IMGBB_KEY -a tesla-parts-bot"
echo "    heroku config:set VITE_IMGBB_API_KEY=YOUR_IMGBB_KEY -a tesla-parts-bot"

echo "  - FIREBASE_SERVICE_ACCOUNT_KEY..."
echo "    ⚠️  Вставьте ваш Firebase сервисный аккаунт:"
echo "    heroku config:set FIREBASE_SERVICE_ACCOUNT_KEY='YOUR_FIREBASE_JSON' -a tesla-parts-bot"

echo "✅ Переменные окружения настроены"

# Развертываем приложение
echo "🚀 Развертываем приложение..."
git push heroku master

# Настраиваем webhook после развертывания
echo "🔗 Настраиваем webhook..."
sleep 10  # Ждем завершения развертывания
heroku config:set TELEGRAM_WEBHOOK_URL=https://tesla-parts-bot.herokuapp.com/api/telegram/webhook -a tesla-parts-bot

echo ""
echo "🎉 Развертывание завершено!"
echo ""
echo "📊 Проверка статуса:"
echo "  heroku ps -a tesla-parts-bot"
echo "  heroku logs --tail -a tesla-parts-bot"
echo "  curl https://tesla-parts-bot.herokuapp.com/"
echo ""
echo "🤖 Тестирование бота:"
echo "  Найдите бота в Telegram и отправьте /start"
echo ""
echo "⚠️  Для безопасности после тестирования:"
echo "  heroku config:unset TELEGRAM_BOT_TOKEN -a tesla-parts-bot"
echo "  Создайте новый токен бота в @BotFather"