const fs = require('fs')
const qrcode = require('qrcode-terminal');
const { Client , LocalAuth, MessageMedia } = require('whatsapp-web.js');

const YoutubeMusicDownloader = require('./src/Modules/youtube-music-downloader.js');

class WhatsappWebClient {
    constructor() {
        this.prefixes = ["!", "-"];
        this.commands = [
            {"p": async (message) => { return await this.youtubeMusicDownloader(message) }},
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
                    const contact = await message.getContact();
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
}

module.exports = WhatsappWebClient