// bot.js

const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const logger = require('./utils/logger');

const startAttachController = require('./controllers/startAttachController');
const paymentController = require('./controllers/paymentCallbacksController');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

// === Middleware ===
app.use(express.json());
app.use(express.static(path.join(__dirname, 'TelegramBot-UnigramPayment')));

// === Webhook для Telegram ===
app.post('/bot', (req, res) => {
    bot.processUpdate(req.body);
    res.status(200).send('OK');
});

// === Роут для ручной установки webhook (для тестов) ===
app.get('/set-webhook', async (req, res) => {
    const webhookUrl = `${process.env.WEBHOOK_URL}/bot`;
    try {
        await bot.setWebHook(webhookUrl);
        logger.message(`✅ Webhook установлен вручную: ${webhookUrl}`);
        res.send(`✅ Webhook установлен: ${webhookUrl}`);
    } catch (err) {
        logger.error(`❌ Ошибка установки webhook: ${err.message}`);
        res.status(500).send(`❌ Ошибка: ${err.message}`);
    }
});

// === API Роуты (пример) ===
app.get('/api/test', (req, res) => {
    res.json({ status: 'API работает' });
});

// === Обработчики событий Telegram ===
bot.onText(/^\/start$/, (message) => {
    startAttachController.sendStartMessage(bot, message);
});

bot.on('successful_payment', (message) => {
    paymentController.validateSuccessPurchase(bot, message);
});

bot.on('pre_checkout_query', async (query) => {
    await paymentController.validateInvoiceProcess(bot, query);
});

bot.on('polling_error', (error) => {
    logger.error(`Polling error: ${error.message}`);
});

// === Запуск сервера ===
app.listen(port, async () => {
    logger.message(`Unigram Payment Bot Template started at port: ${port}`);

    const webhookUrl = `${process.env.WEBHOOK_URL}/bot`;

    try {
        await bot.setWebHook(webhookUrl);
        logger.message(`✅ Webhook установлен автоматически: ${webhookUrl}`);
    } catch (err) {
        logger.error(`❌ Не удалось установить webhook: ${err.message}`);
        logger.message(`👉 Откройте /set-webhook для установки вручную`);
    }
});
