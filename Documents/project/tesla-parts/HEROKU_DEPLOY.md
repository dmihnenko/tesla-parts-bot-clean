# 🚀 Развертывание Tesla Parts Bot на Heroku

Это руководство поможет вам развернуть Telegram бота на платформе Heroku для 24/7 работы.

## 📋 Предварительные требования

1. **Аккаунт на Heroku** - [heroku.com](https://heroku.com)
2. **Heroku CLI** - [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **Telegram Bot Token** - получить у [@BotFather](https://t.me/botfather)
4. **Firebase проект** с настроенным Firestore
5. **IMGBB API ключ** - [imgbb.com](https://imgbb.com)

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

## 🚀 Развертывание на Heroku

### Вариант 1: Через Heroku CLI (рекомендуется)

1. **Установите Heroku CLI и войдите:**
```bash
heroku login
```

2. **Создайте приложение:**
```bash
heroku create tesla-parts-bot
```

3. **Добавьте переменные окружения:**
```bash
heroku config:set TELEGRAM_BOT_TOKEN=ваш_токен_бота
heroku config:set FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
heroku config:set IMGBB_API_KEY=ваш_imgbb_ключ
heroku config:set FRONTEND_URL=https://ваш-сайт.herokuapp.com
```

4. **Разверните приложение:**
```bash
git push heroku master
```

### Вариант 2: Через Heroku Dashboard

1. **Создайте приложение:**
   - Перейдите в [Heroku Dashboard](https://dashboard.heroku.com)
   - Нажмите "New" → "Create new app"
   - Название: `tesla-parts-bot`
   - Регион: Europe (или ближайший к вам)

2. **Подключите GitHub:**
   - В разделе "Deploy" выберите "GitHub"
   - Подключите ваш репозиторий `dmihnenko/tesla-parts-bot-clean`
   - Включите "Automatic deploys" для ветки `master`

3. **Настройте переменные окружения:**
   - Перейдите в "Settings" → "Config Vars"
   - Добавьте все переменные из `.env.production`

4. **Разверните:**
   - Нажмите "Deploy Branch" в разделе "Manual deploy"

## 🔗 Настройка Webhook URL

После развертывания Heroku предоставит URL вашего приложения. Обновите переменную:

```bash
heroku config:set TELEGRAM_WEBHOOK_URL=https://tesla-parts-bot.herokuapp.com/api/telegram/webhook
```

Или через Dashboard в Config Vars.

## 📊 Мониторинг и поддержка

### Health Check
Бот имеет встроенный health check endpoint:
```
GET https://tesla-parts-bot.herokuapp.com/
```

### Логи
Просматривайте логи через Heroku CLI:
```bash
heroku logs --tail -a tesla-parts-bot
```

Или через Dashboard → "More" → "View logs"

### Автоматический перезапуск
Heroku автоматически перезапускает dyno при:
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
1. Проверьте логи: `heroku logs -a tesla-parts-bot`
2. Убедитесь, что `TELEGRAM_BOT_TOKEN` корректный
3. Проверьте `TELEGRAM_WEBHOOK_URL`

### Ошибки Firebase
1. Проверьте `FIREBASE_SERVICE_ACCOUNT_KEY`
2. Убедитесь, что Firestore включен в проекте

### Проблемы с изображениями
1. Проверьте `IMGBB_API_KEY`
2. Убедитесь, что ключ активный

### Dyno crashes
1. Проверьте логи на ошибки
2. Убедитесь, что все зависимости установлены
3. Проверьте лимиты Heroku (free tier имеет ограничения)

## 💰 Тарифы Heroku

- **Free Tier**: 550 часов/месяц, спящий режим после 30 мин бездействия
- **Hobby Tier**: $7/месяц, без спящего режима
- **Professional**: от $25/месяц, с дополнительными ресурсами

## 🔄 Обновление бота

При изменениях в коде:
1. Сделайте commit и push в GitHub
2. Heroku автоматически переразвернет (если включено auto-deploy)
3. Или вручную переразверните через Dashboard

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи приложения
2. Проверьте статус Heroku сервисов
3. Свяжитесь с поддержкой Heroku

---

*Бот будет работать 24/7 на Heroku с автоматическим перезапуском и мониторингом!* 🚀