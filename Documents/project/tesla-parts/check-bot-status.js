#!/usr/bin/env node
// === BOT STATUS CHECKER ===
// Скрипт для проверки статуса развернутого бота

const https = require('https');

const BOT_URL = process.env.TELEGRAM_WEBHOOK_URL?.replace('/api/telegram/webhook', '') ||
                'https://your-app-name.onrender.com';

console.log('🤖 Проверка статуса Tesla Parts Bot...');
console.log(`📍 URL: ${BOT_URL}`);

// Проверка основного endpoint
function checkHealth() {
  return new Promise((resolve, reject) => {
    const url = new URL(BOT_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: '/',
      method: 'GET',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            response: response
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            response: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Проверка health endpoint
function checkDetailedHealth() {
  return new Promise((resolve, reject) => {
    const url = new URL(BOT_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: '/health',
      method: 'GET',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            status: res.statusCode,
            response: response
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            response: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Основная функция проверки
async function main() {
  try {
    console.log('\n🔍 Проверка основного endpoint...');
    const healthResult = await checkHealth();

    if (healthResult.status === 200) {
      console.log('✅ Сервер отвечает');
      console.log(`📊 Статус: ${healthResult.response.status}`);
      console.log(`🌍 Окружение: ${healthResult.response.environment}`);
      console.log(`🔗 Webhook URL: ${healthResult.response.webhook_url}`);
    } else {
      console.log(`❌ Ошибка сервера: ${healthResult.status}`);
      return;
    }

    console.log('\n🔍 Проверка детального health check...');
    const detailedResult = await checkDetailedHealth();

    if (detailedResult.status === 200) {
      console.log('✅ Детальная проверка пройдена');
      console.log(`⏱️  Время работы: ${Math.round(detailedResult.response.uptime)} сек`);
      console.log(`💾 Память: ${Math.round(detailedResult.response.memory.heapUsed / 1024 / 1024)} MB`);
      console.log(`🏷️  Версия: ${detailedResult.response.version}`);
    } else {
      console.log(`⚠️  Детальная проверка недоступна: ${detailedResult.status}`);
    }

    console.log('\n🎉 Бот работает корректно!');

  } catch (error) {
    console.log('\n❌ Ошибка при проверке статуса:');
    console.log(error.message);

    if (error.code === 'ENOTFOUND') {
      console.log('💡 Возможные причины:');
      console.log('   - Сервис не развернут');
      console.log('   - Неверный URL');
      console.log('   - Сервис спит (free tier Render)');
    } else if (error.message === 'Request timeout') {
      console.log('💡 Возможные причины:');
      console.log('   - Сервис спит (free tier Render)');
      console.log('   - Проблемы с сетью');
    }
  }
}

// Запуск проверки
main().catch(console.error);