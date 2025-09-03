# 🚀 Быстрое развертывание Tesla Parts Bot

## ⚡ Краткая инструкция

### 1. Подготовка
```bash
# Установите зависимости
npm install

# Протестируйте локально
npm run bot:test
```

### 2. Развертывание на Render

#### Вариант A: Через GitHub (автоматический)
1. Создайте репозиторий на GitHub
2. Загрузите код: `git add . && git commit -m "Initial commit" && git push`
3. Перейдите на [render.com](https://render.com)
4. Создайте Blueprint из вашего репозитория
5. Выберите `render.yaml` файл

#### Вариант B: Ручное создание
1. Перейдите на [render.com](https://render.com)
2. Нажмите "New" → "Web Service"
3. Выберите "Docker"
4. Настройте параметры:
   - **Name**: `tesla-parts-bot`
   - **Dockerfile Path**: `./Dockerfile`
   - **Branch**: `main`

### 3. Настройка переменных окружения

Добавьте в Render следующие переменные:

**Обязательные:**
```
TELEGRAM_BOT_TOKEN=ваш_токен_бота
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
IMGBB_API_KEY=ваш_imgbb_ключ
```

**Опциональные:**
```
FRONTEND_URL=https://ваш-сайт.netlify.app
```

### 4. Проверка работы

```bash
# Проверить статус после развертывания
npm run bot:status
```

## 📋 Что настроено

✅ **Webhook сервер** - для обработки сообщений Telegram
✅ **Docker контейнер** - для развертывания
✅ **Автоматический перезапуск** - при сбоях
✅ **Health checks** - для мониторинга
✅ **Переменные окружения** - для конфигурации
✅ **Мониторинг** - логи и статус

## 🎯 Следующие шаги

1. **Получите токен бота** у [@BotFather](https://t.me/botfather)
2. **Создайте Firebase проект** и сервисный аккаунт
3. **Получите IMGBB API ключ** на [imgbb.com](https://imgbb.com)
4. **Разверните на Render** используя инструкцию выше
5. **Протестируйте бота** отправив `/start`

## 🔧 Локальное тестирование

```bash
# Тестирование webhook режима
npm run bot:test

# Проверка статуса
npm run bot:status

# Обычный polling режим
npm run bot
```

## 📞 Поддержка

Если возникнут проблемы:
1. Проверьте логи в Render Dashboard
2. Используйте `npm run bot:status` для диагностики
3. Проверьте переменные окружения

---

**Бот будет работать 24/7 автоматически!** 🎉