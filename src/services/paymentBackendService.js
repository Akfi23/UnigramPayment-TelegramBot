const logger = require('../utils/logger');

const crypto = require('crypto-js');
const axios = require('axios');

require('dotenv').config();

const backendUrl = process.env.SERVER_DOMAIN;
const botToken = process.env.BOT_TOKEN;
const authSecret = process.env.AUTHORIZATION_SECRET_KEY;

const addNewPurchaseUrl = `${backendUrl}/api/payment/update-order-receipt`;

function addNewPurchase(paymentInfo)
{
    const encryptedAuthToken = getEncryptedAuthToken();
    
    axios.post(addNewPurchaseUrl, paymentInfo,
    {
        headers:
        {
            'Content-Type': `application/json`,
            'Authorization': `Bearer ${encryptedAuthToken}`
        }
    })
    .then(result =>
    {
        logger.message(`Purchase invoice successfully send `+
            `to backend, result: ${result.data}`);
    })
    .catch(error =>
    {
        logger.error(`Failed to send purchase invoice `+
            `to backend, reason: ${error.message}`);
    });
}

// function addNewPurchase(paymentInfo)
// {
//     const encryptedAuthToken = getEncryptedAuthToken();

//     // Логируем тело корректно
//     logger.message(`[Bot] Sending purchase payload to backend: ${JSON.stringify(paymentInfo)}`);

//     axios.post(addNewPurchaseUrl, paymentInfo, {
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${encryptedAuthToken}`
//         },
//         timeout: 10000 // 10s timeout
//     })
//     .then(result => {
//         logger.message(`Purchase invoice successfully sent to backend, result: ${JSON.stringify(result.data)}`);
//     })
//     .catch(error => {
//         // Логируем подробно — это важно, чтобы видеть тело ответа сервера
//         logger.error(
//             `Failed to send purchase invoice to backend, reason: ${error.message}, ` +
//             `status: ${error.response && error.response.status}, ` +
//             `data: ${error.response && JSON.stringify(error.response.data)}`
//         );
//     });
// }

function getEncryptedAuthToken()
{
    return crypto.AES.encrypt(botToken, authSecret);
    //return crypto.AES.encrypt(botToken, authSecret).toString();
}

module.exports =
{
    addNewPurchase,
}
