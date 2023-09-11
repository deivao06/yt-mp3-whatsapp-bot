const fs = require('fs')
const qrcode = require('qrcode-terminal');
const { Client , LocalAuth, MessageMedia } = require('whatsapp-web.js');

const YoutubeMusicDownloader = require('./youtube-music-downloader.js');
const DiceRoller = require('./dice-roller.js');

class WhatsappWebClient {
    constructor() {
        this.prefixes = ["!", "-"];
        this.commands = [
            // {"p": async (message) => { return await this.youtubeMusicDownloader(message) }},
            {"everyone": async (message) => { return await this.mentionEveryone(message)} },
            {"roll": async (message) => {return await this.rollDice(message)}},
            {"sticker": async (message) => {return this.imageToGif(message)}},
            {"waifu": async (message) => {return this.waifu(message)}},
            //TODO CRIAR CLASSE PARA WAIFU E CRIAR ROTA PARA ACESSAR VIA API DE TESTES
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

        var commandSplit = message.body.split(" ").shift();
        var videoNameOrUrl = commandSplit.join(" ");

        const youtubeMusicDownloader = new YoutubeMusicDownloader();

        if(videoNameOrUrl.startsWith("https")){
            videoData = await youtubeMusicDownloader.downloadFromUrl(videoNameOrUrl);
        } else {
            videoData = await youtubeMusicDownloader.download(videoNameOrUrl);
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
        var url = "https://api.waifu.im/search";
        
        if(nsfw == 'nsfw') url = "https://api.waifu.im/search/?is_nsfw=true";
    
        var response = await axios.get(url);
        var waifu = response.data.images[0].url;
    
        const media = await MessageMedia.fromUrl(waifu);
    
        await chat.sendMessage(media, {sendMediaAsSticker: true, stickerAuthor: "Sticker", stickerName: "Sticker", stickerCategories: []});
    }
}

module.exports = WhatsappWebClient