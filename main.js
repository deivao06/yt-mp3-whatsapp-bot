const express = require('express');
const router = require('./routes.js');
const WhatsappWebClient = require('./whatsapp-web-client.js');

const expressApp = express();
expressApp.use('/api', router);
expressApp.listen(9090, () => { console.log('Express server listening on port 9090') });

const whatsappWebClient = new WhatsappWebClient();