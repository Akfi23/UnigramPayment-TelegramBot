const express = require('express');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
const logger = require('./utils/logger');

const startAttachController = require('./controllers/startAttachController');
const paymentController = require('./controllers/paymentCallbacksController');

require('dotenv').config();

const server = express();
const port = process.env.PORT || 3000;
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

// Эндпоинт для вебхуков
server.post(`/bot`, (req, res) => {
    bot.processUpdate(req.body);
    res.status(200).send('OK');
});

// Статические файлы (если нужны)
server.use(express.static(path.join(__dirname, 'TelegramBot-UnigramPayment')));
server.use(express.json());

// === Новый маршрут: /set-webhook (для ручной установки webhook) ===
server.get('/set-webhook', async (req, res) => {
    const webhookUrl = `${process.env.WEBHOOK_URL}/bot`;
    try {
        await bot.setWebHook(webhookUrl);
        logger.message(`✅ Webhook установлен вручную: ${webhookUrl}`);
        res.send(`✅ Webhook установлен: ${webhookUrl}`);
    } catch (err) {
        logger.error(`❌ Ошибка установки webhook: ${err.message}`);
        res.status(500).send(`❌ Не удалось установить webhook: ${err.message}`);
    }
});

// Обработчики событий
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

// Запуск сервера
server.listen(port, async () => {
    logger.message(`Unigram Payment Bot Template started at port: ${port}`);

    const webhookUrl = `${process.env.WEBHOOK_URL}/bot`;

    try {
        await bot.setWebHook(webhookUrl);
        logger.message(`✅ Webhook установлен автоматически: ${webhookUrl}`);
    } catch (err) {
        logger.error(`❌ Не удалось автоматически установить webhook: ${err.message}`);
        logger.message(`👉 Откройте https://ваш-url/set-webhook для установки вручную`);
    }
});
