const qrcode = require('qrcode-terminal');
const fs = require('fs')

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { YoutubeMusicDownloader } = require('./YoutubeMusicDownloader.js');

const yt = new YoutubeMusicDownloader();
const prefix = "!";
const commands = [
    {"p": async (videoName) => {return await downloadAndSendYoutubeMp3(videoName)}}
]

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async (message) => {
	await treatMessage(message);
});

client.on('message_create', async (message) => {
    await treatMessage(message);
});
 
client.initialize();

async function downloadAndSendYoutubeMp3(videoName) {
    const path = await yt.download(videoName);
    return path;
}

async function treatMessage(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();

    if(message.body.startsWith(prefix)){
        commands.forEach(async (command) => {
            var commandSplit = message.body.split(" ");
            commandSplit.shift();
            commandParameter = commandSplit.join(" ");

            var commandFunction = command[message.body.charAt(1)];

            if(commandFunction) {
                await chat.sendMessage(`@${contact.id.user} Espera aí mano, to procurando ${commandParameter}...`, {mentions: [contact]});

                try {
                    var response = await commandFunction(commandParameter);
                    const media = MessageMedia.fromFilePath(response);
                    message.reply(media);

                    try {
                        fs.unlinkSync(response)
                        //file removed
                    } catch(err) {
                        console.error(err)
                    }
                } catch (e) {
                    console.log(e);
                    await chat.sendMessage(`@${contact.id.user} Não achei nada não mano...`, {mentions: [contact]});
                }
            }
        })
    }
}