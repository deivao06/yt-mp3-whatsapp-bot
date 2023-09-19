const fs = require('fs');
const qrcode = require('qrcode-terminal');
const { Client , LocalAuth, MessageMedia } = require('whatsapp-web.js');

const YoutubeMusicDownloader = require('./Modules/youtube-music-downloader.js');
const DiceRoller = require('./Modules/dice-roller.js');
const Waifu = require('./Modules/waifu.js');
const Notequest = require('./Modules/notequest.js');
const SteamGames = require('./Modules/steam-games.js');

class WhatsappWebClient {
    constructor() {
        this.prefixes = ["!", "-"];
        this.commands = [
            {"p": async (message) => { return await this.youtubeMusicDownloader(message) }},
            // {"youtube": async (message) => { return await this.youtubeVideoDownloader(message) }},
            {"everyone": async (message) => { return await this.mentionEveryone(message) }},
            {"roll": async (message) => { return await this.rollDice(message) }},
            {"sticker": async (message) => { return this.imageToGif(message) }},
            {"waifu": async (message) => { return this.waifu(message) }},
            {"notequest": async (message) => { return this.notequest(message) }},
            {"steam": async (message) => { return this.getSteamGameInfo(message) }}
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
        
        console.log(`Downloading: ${videoNameOrUrl}`);
        const songData = await youtubeMusicDownloader.downloadSong(videoNameOrUrl);

        if(!songData.error) {
            console.log(`Success! ` + songData.path);

            try {
                console.log('Sending media on message: ' + songData.path);

                const media = MessageMedia.fromFilePath(songData.path);

                var text = "";

                text += `@${contact.id.user}\n\n`;
                text += `*Nome:* ${songData.name}\n`;
                text += `*Url:* ${songData.url}`;

                var infoMessage = await chat.sendMessage(text, {mentions: [contact]});
                await infoMessage.reply(media);

                fs.unlinkSync(songData.path);
            } catch (e) {
                console.log('Error when sending media on message: ' + e.message);

                await chat.sendMessage(`@${contact.id.user} ${'Error when sending media on message: ' + e.message}`, {mentions: [contact]});

                fs.unlinkSync(songData.path);
            }
        } else {
            await chat.sendMessage(`@${contact.id.user} ${songData.message}`, {mentions: [contact]});
        }
    }

    async youtubeVideoDownloader(message) {
        const chat = await message.getChat();
        const contact = await message.getContact();

        console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

        var commandSplit = message.body.split(" ");
        commandSplit.shift();
        var videoNameOrUrl = commandSplit.join(" ");

        const youtubeMusicDownloader = new YoutubeMusicDownloader(__dirname + '/Files');
        
        console.log(`Downloading: ${videoNameOrUrl}`);
        const videoData = await youtubeMusicDownloader.downloadVideo(videoNameOrUrl);

        if(!videoData.error) {
            console.log(`Success! ` + videoData.path);

            try {
                console.log('Sending media on message: ' + videoData.path);

                const media = MessageMedia.fromFilePath(videoData.path);

                var text = "";

                text += `@${contact.id.user}\n\n`;
                text += `*Nome:* ${videoData.name}\n`;
                text += `*Url:* ${videoData.url}`;

                var infoMessage = await chat.sendMessage(text, {mentions: [contact]});
                await infoMessage.reply(media);

                fs.unlinkSync(videoData.path);
            } catch (e) {
                console.log(e);

                await chat.sendMessage(`@${contact.id.user} ${'Error when sending media on message: ' + e.message}`, {mentions: [contact]});

                fs.unlinkSync(videoData.path);
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

        const waifu = new Waifu();
        const media = await MessageMedia.fromUrl(await waifu.getWaifu(nsfw));
    
        await chat.sendMessage(media, {sendMediaAsSticker: true, stickerAuthor: "Sticker", stickerName: "Sticker", stickerCategories: []});
    }

    async notequest(message) {
        const chat = await message.getChat();
        const contact = await message.getContact();

        console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

        var commandSplit = message.body.split(" ");
        commandSplit.shift();
        var name = commandSplit.join(" ");

        const notequest = new Notequest();
        const adventurerData = await notequest.adventurer(name);
        
        var text = "";

        text += `*Nome:* ${adventurerData.name}\n`;
        text += `*PV:* ${adventurerData.pv}\n\n`;

        text += `*RAÇA*\n`;
        text += `*-Nome:* ${adventurerData.race.name}\n`;
        text += `*-Vantagem:* ${adventurerData.race.advantage}\n\n`;

        text += `*CLASSE*\n`;
        text += `*-Nome:* ${adventurerData.class.name}\n`;
        text += `*-Vantagem:* ${adventurerData.class.advantage}\n`;
        text += `*-Arma:* ${adventurerData.class.weapon}\n\n`;

        text += `*MAGIAS*\n`;
        if(Object.keys(adventurerData.basic_spells).length > 0) {
            for(const key in adventurerData.basic_spells) {
                var spell = adventurerData.basic_spells[key];

                text += `*-Nome:* ${spell.name}\n`;
                text += `*-Efeito:* ${spell.effect}\n`;
                text += `*-Quantidade:* ${spell.qtd}\n`;
                text += `*---------------------------------*\n`;
            }
        } else {
            text += "-Nenhuma\n";
        }

        await message.reply(text);
    }

    async getSteamGameInfo(message) {
        const chat = await message.getChat();
        const contact = await message.getContact();

        console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

        var commandSplit = message.body.split(" ");
        commandSplit.shift();
        var gameName = commandSplit.join(" ");

        if(!gameName) {
            await message.reply("Nome do jogo é obrigatório.");
            return;
        }

        const steamGames = new SteamGames();
        const game = await steamGames.getGameInfoByName(gameName);

        if(!game.error) {
            const media = await MessageMedia.fromUrl(game.data.image);
            const price = game.data.free ? 'Gratuito' : game.data.price.final_formatted;
    
            var text = "";
    
            text += `*Nome:* ${game.data.name}\n\n`;
            text += `*Jogadores Online:* ${game.data.player_count}\n\n`;
            text += `*Preço:* ${price}\n`;
            text += `*Descrição:* ${game.data.description}\n`;
            text += `*---------------------------------*\n`;
            text += `*Desenvolvedores:*\n`;
            if(Object.keys(game.data.developers).length > 0) {
                for(const key in game.data.developers) {
                    var developer = game.data.developers[key];
                    text += `-${developer}\n`;
                }
            } else {
                text += "-Nenhum\n";
            }
            text += `*---------------------------------*\n`;
            text += `*Publicadoras:*\n`;
            if(Object.keys(game.data.publishers).length > 0) {
                for(const key in game.data.publishers) {
                    var publisher = game.data.publishers[key];
                    text += `-${publisher}\n`;
                }
            } else {
                text += "-Nenhuma\n";
            }
            text += `*---------------------------------*\n`;
            text += `*Categorias:*\n`;
            if(Object.keys(game.data.categories).length > 0) {
                for(const key in game.data.categories) {
                    var categorie = game.data.categories[key];
                    text += `-${categorie.description}\n`;
                }
            } else {
                text += "-Nenhuma\n";
            }
            text += `*---------------------------------*\n`;
            text += `*Generos:*\n`;
            if(Object.keys(game.data.genres).length > 0) {
                for(const key in game.data.genres) {
                    var genre = game.data.genres[key];
                    text += `-${genre.description}\n`;
                }
            } else {
                text += "-Nenhuma\n";
            }

            await chat.sendMessage(text, {media: media});
            return;
        }

        await message.reply(game.message);
    }
}

module.exports = WhatsappWebClient