# ⚡ Быстрое развертывание на Heroku

## 🚀 Краткая инструкция

### 1. Подготовка
```bash
# Установите Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

heroku login

# Клонируйте репозиторий (если нужно)
git clone https://github.com/dmihnenko/tesla-parts-bot-clean.git
cd tesla-parts-bot-clean
```

### 2. Развертывание

#### Вариант A: Через Heroku CLI (рекомендуется)
```bash
# Создайте приложение
heroku create tesla-parts-bot

# Добавьте переменные окружения
heroku config:set TELEGRAM_BOT_TOKEN=ваш_токен_бота
heroku config:set FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
heroku config:set IMGBB_API_KEY=ваш_imgbb_ключ

# Разверните
git push heroku master
```

#### Вариант B: Через Heroku Dashboard
1. Создайте приложение на [heroku.com](https://heroku.com)
2. Подключите GitHub репозиторий `dmihnenko/tesla-parts-bot-clean`
3. Добавьте переменные окружения в Settings → Config Vars
4. Разверните ветку master

### 3. Настройка Webhook
```bash
# Обновите webhook URL
heroku config:set TELEGRAM_WEBHOOK_URL=https://tesla-parts-bot.herokuapp.com/api/telegram/webhook
```

### 4. Проверка
```bash
# Проверьте статус
curl https://tesla-parts-bot.herokuapp.com/

# Посмотрите логи
heroku logs --tail -a tesla-parts-bot
```

## 📋 Что настроено

✅ **Webhook сервер** - для обработки сообщений Telegram
✅ **Procfile** - для запуска на Heroku
✅ **Health checks** - для мониторинга
✅ **Автоматический перезапуск** - при сбоях
✅ **Переменные окружения** - для безопасной конфигурации

## 🎯 Следующие шаги

1. **Получите токен бота** у [@BotFather](https://t.me/botfather)
2. **Создайте Firebase проект** и сервисный аккаунт
3. **Получите IMGBB API ключ** на [imgbb.com](https://imgbb.com)
4. **Разверните на Heroku** используя инструкцию выше
5. **Протестируйте бота** отправив `/start`

## 💰 Стоимость

- **Free Tier**: 550 часов/месяц
- **Hobby**: $7/месяц (без спящего режима)
- **Professional**: от $25/месяц

## 🔧 Локальное тестирование

```bash
# Тестирование webhook режима
npm run bot:test

# Обычный polling режим
npm run bot
```

## 📞 Поддержка

При проблемах:
1. Проверьте логи: `heroku logs -a tesla-parts-bot`
2. Проверьте статус: `heroku ps -a tesla-parts-bot`
3. Свяжитесь с поддержкой Heroku

---

**Бот готов к 24/7 работе на Heroku!** 🎉