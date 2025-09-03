# Используем Node.js 18 LTS
FROM node:18-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Создаем директорию для логов
RUN mkdir -p /app/logs

# Устанавливаем переменную окружения для продакшена
ENV NODE_ENV=production
ENV USE_WEBHOOK=true

# Открываем порт для webhook сервера
EXPOSE 3000

# Запускаем webhook сервер
CMD ["npm", "run", "bot:webhook"]