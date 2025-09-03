#!/usr/bin/env node
// === TESLA PARTS WEBHOOK SERVER ===
// Сервер для обработки webhook запросов от Telegram
// Используется для продакшена вместо polling режима

import express from 'express';
import 'dotenv/config';
import telegramBotService from './src/services/telegramBotService.ts';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для обработки JSON
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Tesla Parts Bot Webhook Server',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    webhook_url: process.env.TELEGRAM_WEBHOOK_URL || 'not configured'
  });
});

// Detailed health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Webhook endpoint для Telegram
app.post('/api/telegram/webhook', (req, res) => {
  try {
    // Передаем обновление в telegramBotService
    telegramBotService.handleWebhookUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

// Обработка 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🤖 Webhook server shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🤖 Webhook server shutting down gracefully');
  process.exit(0);
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
  console.log(`📱 Webhook URL: ${process.env.TELEGRAM_WEBHOOK_URL || 'Not configured'}`);
  console.log('🤖 Telegram bot initialized with webhook mode');
});

export default app;