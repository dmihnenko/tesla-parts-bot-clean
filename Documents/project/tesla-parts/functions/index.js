// Загрузка переменных окружения
require('dotenv').config();

const functions = require('firebase-functions');
const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

// Инициализация Firebase Admin SDK
admin.initializeApp();

// Получение токена бота из переменных окружения
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN not configured');
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

// Создание экземпляра бота с polling
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// Получение Firestore
const db = admin.firestore();

// Простой обработчик команд
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '🤖 Привет! Я работаю на Firebase Functions!\n\nИспользуйте /help для справки.');
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '📋 *Доступные команды:*\n/start - Запуск бота\n/help - Справка\n/status - Статус системы', { parse_mode: 'Markdown' });
});

bot.onText(/\/status/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Проверка подключения к Firestore
    const testDoc = await db.collection('test').doc('status').get();
    const timestamp = new Date().toISOString();

    bot.sendMessage(chatId, `✅ *Система работает*\n\n🕒 Время: ${timestamp}\n🔗 Firestore: Подключен\n🤖 Бот: Активен`, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Status check error:', error);
    bot.sendMessage(chatId, '❌ Ошибка при проверке статуса системы');
  }
});

// Обработчик всех сообщений
bot.on('message', (msg) => {
  console.log('📨 Новое сообщение:', msg.text, 'от', msg.from?.first_name);
});

// Экспорт функции для Firebase
exports.telegramBot = functions
  .runWith({
    timeoutSeconds: 540, // 9 минут (максимум для Firebase Functions)
    memory: '1GB'
  })
  .https.onRequest(async (req, res) => {
    // Эта функция будет вызываться для поддержания работы бота
    // В Firebase Functions polling работает в рамках HTTP запроса

    try {
      // Проверяем, что бот инициализирован
      if (bot.isPolling()) {
        res.status(200).send('Bot is running and polling');
      } else {
        // Если polling не работает, пытаемся перезапустить
        await bot.startPolling();
        res.status(200).send('Bot polling restarted');
      }
    } catch (error) {
      console.error('Bot initialization error:', error);
      res.status(500).send('Bot initialization failed');
    }
  });

// Функция для периодического поддержания работы бота
exports.keepAlive = functions
  .runWith({
    timeoutSeconds: 60,
    memory: '256MB'
  })
  .pubsub.schedule('every 5 minutes')
  .onRun(async (context) => {
    console.log('🔄 Keep-alive check at', new Date().toISOString());

    try {
      // Проверяем статус бота
      if (!bot.isPolling()) {
        console.log('🤖 Restarting bot polling...');
        await bot.startPolling();
      }

      // Проверяем подключение к Firestore
      const testRef = db.collection('system').doc('health');
      await testRef.set({
        lastCheck: admin.firestore.FieldValue.serverTimestamp(),
        status: 'healthy'
      });

      console.log('✅ Bot and Firestore are healthy');
      return null;
    } catch (error) {
      console.error('❌ Keep-alive error:', error);
      throw new Error('Keep-alive check failed');
    }
  });