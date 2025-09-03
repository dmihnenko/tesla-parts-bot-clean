#!/usr/bin/env node

import 'dotenv/config';
import telegramBotService from './src/services/telegramBotService.ts';

console.log('🤖 Starting Tesla Parts Telegram Bot...');

// Бот инициализируется автоматически при импорте
// Здесь можно добавить дополнительную логику инициализации

// Обработка graceful shutdown
process.on('SIGINT', () => {
  console.log('🤖 Telegram bot stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🤖 Telegram bot stopped');
  process.exit(0);
});

console.log('🤖 Tesla Parts Telegram Bot is running!');