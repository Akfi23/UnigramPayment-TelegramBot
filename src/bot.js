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

// Установка webhook
const webhookUrl = `${process.env.WEBHOOK_URL}/bot`;
bot.setWebHook(webhookUrl).then(() => {
    logger.message(`Webhook установлен: ${webhookUrl}`);
});

// Запуск сервера
server.listen(port, () => {
    logger.message(`Unigram Payment Bot Template started at port: ${port}`);
});

// Обработчики событий
bot.onText('/start', (message) => {
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
