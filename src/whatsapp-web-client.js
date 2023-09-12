const fs = require('fs');
const qrcode = require('qrcode-terminal');
const { Client , LocalAuth, MessageMedia } = require('whatsapp-web.js');

const YoutubeMusicDownloader = require('./Modules/youtube-music-downloader.js');
const DiceRoller = require('./Modules/dice-roller.js');
const Waifu = require('./Modules/waifu.js');

class WhatsappWebClient {
    constructor() {
        this.prefixes = ["!", "-"];
        this.commands = [
            {"p": async (message) => { return await this.youtubeMusicDownloader(message) }},
            {"everyone": async (message) => { return await this.mentionEveryone(message) }},
            {"roll": async (message) => { return await this.rollDice(message) }},
            {"sticker": async (message) => { return this.imageToGif(message) }},
            {"waifu": async (message) => { return this.waifu(message) }},
            {"notequest": async (message) => { return this.notequest(message) }}
        ];

        this.wwebClient = new Client({ authStrategy: new LocalAuth(), ffmpegPath: '../ffmpeg/ffmpeg-master-latest-win64-gpl/bin/ffmpeg.exe' });
        this.wwebClient.on('qr', qr => { qrcode.generate(qr, {small: true}); });
        this.wwebClient.on('ready', () => { console.log('Whatsapp web client is ready! \n'); });
        this.wwebClient.on('message_create', async (message) => { await this.handleMessage(message); });
        this.wwebClient.initialize();
    }

    async handleMessage(message) {
        var prefix = message.body.startsWith(this.prefixes[0]) ? this.prefixes[0] : (message.body.startsWith(this.prefixes[1]) ? this.prefixes[1] : null);
    
        if(prefix){
            var messageCommand = message.body.split(" ")[0].split(prefix)[1];
    
            this.commands.forEach(async (command) => {
                var commandFunction = command[messageCommand];
    
                if(commandFunction) {
                    await commandFunction(message);
                }
            })
        }
    }

    async youtubeMusicDownloader(message) {
        const chat = await message.getChat();
        const contact = await message.getContact();

        console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

        var commandSplit = message.body.split(" ");
        commandSplit.shift();
        var videoNameOrUrl = commandSplit.join(" ");

        const youtubeMusicDownloader = new YoutubeMusicDownloader(__dirname + '/Files');
        const songData = await youtubeMusicDownloader.downloadSong(videoNameOrUrl);

        try {
            if(!songData.error) {
                const media = MessageMedia.fromFilePath(songData.path);
                await message.reply(media);
                fs.unlinkSync(songData.path);
            } else {
                await chat.sendMessage(`@${contact.id.user} ${songData.message}`, {mentions: [contact]});
            }
        } catch (e) {
            console.error(e.message);
            fs.unlinkSync(songData.path);
            await chat.sendMessage(`@${contact.id.user} ${e.message}`, {mentions: [contact]});
        }
    }

    async mentionEveryone(message) {
        const chat = await message.getChat();
        const contact = await message.getContact();
    
        console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);
    
        var text = "";
        var mentions = [];
    
        for(var participant of chat.participants) {
            const contact = await this.wwebClient.getContactById(participant.id._serialized);
            
            mentions.push(contact);
            text += `@${participant.id.user} `;
        }
    
        await chat.sendMessage(text, { mentions });
    }

    async rollDice(message) {
        const chat = await message.getChat();
        const contact = await message.getContact();
        const diceRoller = new DiceRoller();
    
        console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);
    
        var commandSplit = message.body.split(" ");
        commandSplit.shift();
    
        var dices = commandSplit[0];
        var result = await diceRoller.roll(dices);

        await message.reply(result);
    }

    async imageToGif(message) {
        const chat = await message.getChat();
        const contact = await message.getContact();
    
        console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);
    
        if(message.hasQuotedMsg) {
            message = await message.getQuotedMessage();
        }
        
        if(message.hasMedia) {
            const media = await message.downloadMedia();
            await chat.sendMessage(media, {sendMediaAsSticker: true, stickerAuthor: "Sticker", stickerName: "Sticker", stickerCategories: []});
        } else {
            message.reply("Tem que mandar uma imagem junto com a mensagem");
        }
    }

    async waifu(message) {
        const chat = await message.getChat();
        const contact = await message.getContact();
    
        console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);
    
        var commandSplit = message.body.split(" ");
        commandSplit.shift();
        var nsfw = commandSplit.join(" ");

        const waifu = new Waifu();
        const media = await MessageMedia.fromUrl(await waifu.getWaifu(nsfw));
    
        await chat.sendMessage(media, {sendMediaAsSticker: true, stickerAuthor: "Sticker", stickerName: "Sticker", stickerCategories: []});
    }
}

module.exports = WhatsappWebClient