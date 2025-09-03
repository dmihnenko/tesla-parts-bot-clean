# 🚀 Развертывание Tesla Parts Bot на Render

Это руководство поможет вам развернуть Telegram бота на платформе Render для 24/7 работы.

## 📋 Предварительные требования

1. **Аккаунт на Render** - [render.com](https://render.com)
2. **Telegram Bot Token** - получить у [@BotFather](https://t.me/botfather)
3. **Firebase проект** с настроенным Firestore
4. **IMGBB API ключ** - [imgbb.com](https://imgbb.com)
5. **Google Custom Search API** (опционально)

## 🔧 Настройка переменных окружения

### 1. Скопируйте пример файла окружения
```bash
cp .env.example .env.production
```

### 2. Заполните переменные в `.env.production`

**Обязательные переменные:**
- `TELEGRAM_BOT_TOKEN` - токен вашего бота от BotFather
- `FIREBASE_SERVICE_ACCOUNT_KEY` - JSON ключ сервисного аккаунта Firebase
- `IMGBB_API_KEY` - API ключ для загрузки изображений

**Опциональные переменные:**
- `FRONTEND_URL` - URL вашего сайта (если есть)
- Google API ключи для поиска изображений

## 🚀 Развертывание на Render

### Вариант 1: Автоматическое развертывание (рекомендуется)

1. **Подключите GitHub репозиторий к Render**
   - Зайдите в [dashboard.render.com](https://dashboard.render.com)
   - Нажмите "New" → "Blueprint"
   - Подключите ваш GitHub репозиторий
   - Выберите `render.yaml` файл

2. **Настройте переменные окружения**
   - Перейдите в настройки сервиса
   - Добавьте все переменные из `.env.production`

3. **Разверните сервис**
   - Нажмите "Create Web Service"
   - Render автоматически соберет Docker образ и запустит бота

### Вариант 2: Ручное развертывание

1. **Создайте новый Web Service**
   - Нажмите "New" → "Web Service"
   - Выберите "Docker" как runtime

2. **Настройте параметры**
   - **Name**: `tesla-parts-bot`
   - **Branch**: `main` (или ваша основная ветка)
   - **Build Command**: `docker build -t tesla-parts-bot .`
   - **Start Command**: `npm run bot:webhook`

3. **Добавьте переменные окружения**
   - Все переменные из `.env.production`
   - Добавьте `PORT=10000` (стандартный порт Render)

## 🔗 Настройка Webhook URL

После развертывания Render предоставит URL вашего приложения. Обновите переменную:

```bash
TELEGRAM_WEBHOOK_URL=https://your-app-name.onrender.com/api/telegram/webhook
```

## 📊 Мониторинг и поддержка

### Health Check
Бот имеет встроенный health check endpoint:
```
GET https://your-app-name.onrender.com/
```

### Логи
- Просматривайте логи в Render Dashboard
- Настраивайте alerts для ошибок

### Автоматический перезапуск
Render автоматически перезапускает сервис при:
- Сбоях приложения
- Развертывании новых версий
- Технических работах на платформе

## 🛠️ Локальное тестирование продакшена

Перед развертыванием протестируйте webhook режим локально:

```bash
# Установите переменные окружения
export NODE_ENV=production
export USE_WEBHOOK=true
export TELEGRAM_WEBHOOK_URL=http://localhost:3000/api/telegram/webhook

# Запустите webhook сервер
npm run bot:webhook
```

## 🚨 Устранение неполадок

### Бот не отвечает
1. Проверьте логи в Render Dashboard
2. Убедитесь, что `TELEGRAM_BOT_TOKEN` корректный
3. Проверьте `TELEGRAM_WEBHOOK_URL`

### Ошибки Firebase
1. Проверьте `FIREBASE_SERVICE_ACCOUNT_KEY`
2. Убедитесь, что Firestore включен в проекте

### Проблемы с изображениями
1. Проверьте `IMGBB_API_KEY`
2. Убедитесь, что ключ активный

## 💰 Тарифы Render

- **Free Tier**: 750 часов/месяц, спящий режим после 15 мин бездействия
- **Paid Plans**: от $7/месяц без ограничений

## 🔄 Обновление бота

1. Внесите изменения в код
2. Закоммитьте и запушьте в GitHub
3. Render автоматически переразвернет сервис

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи приложения
2. Проверьте статус Render сервисов
3. Свяжитесь с поддержкой Render

---

*Создано для удобного управления товарами Tesla Parts через Telegram* 🚗⚡