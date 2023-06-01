const qrcode = require('qrcode-terminal');
const fs = require('fs')

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { YoutubeMusicDownloader } = require('./YoutubeMusicDownloader.js');

const yt = new YoutubeMusicDownloader();
const prefix = "!";
const commands = [
    {"p": async (message) => {return await downloadAndSendYoutubeMp3(message)}},
    {"everyone": async (message) => {return await mentionEveryone(message)}}
]

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready! \n');
});

client.on('message_create', async (message) => {
	await handleMessage(message);
});
 
client.initialize();


async function handleMessage(message) {
    if(message.body.startsWith(prefix)){
        var messageCommand = message.body.split(" ")[0].split(prefix)[1];
        commands.forEach(async (command) => {
            var commandFunction = command[messageCommand];

            if(commandFunction) {
                commandFunction(message);
            }
        })
    }
}

async function downloadAndSendYoutubeMp3(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();

    console.log(`${contact.id.user} ${chat.name} ${message.body} \n`);

    var commandSplit = message.body.split(" ");
    commandSplit.shift();
    var videoNameOrUrl = commandSplit.join(" ");

    await chat.sendMessage(`@${contact.id.user} Espera aí, to procurando ${videoNameOrUrl}`, {mentions: [contact]});
    var videoData = null;

    if(videoNameOrUrl.startsWith("https")){
        videoData = await yt.downloadFromUrl(videoNameOrUrl);
    } else {
        videoData = await yt.download(videoNameOrUrl);
    }
    
    if(!videoData.error) {
        const media = MessageMedia.fromFilePath(videoData.path);
    
        await message.reply(media);
    
        try {
            fs.unlinkSync(videoData.path)
        } catch(err) {
            console.error(err)
        }
    } else {
        await chat.sendMessage(`@${contact.id.user} ${videoData.message}`, {mentions: [contact]});
    }
}

async function mentionEveryone(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();

    console.log(`${contact.id.user} ${chat.name} ${message.body} \n`);

    var text = "";
    var mentions = [];

    for(var participant of chat.participants) {
        const contact = await client.getContactById(participant.id._serialized);
        
        mentions.push(contact);
        text += `@${participant.id.user} `;
    }

    await chat.sendMessage(text, { mentions });
}