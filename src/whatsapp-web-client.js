const fs = require('fs');
const qrcode = require('qrcode-terminal');
const { Client , LocalAuth, MessageMedia } = require('whatsapp-web.js');
const ffmpeg = require('ffmpeg-static');
const chromiumBinary = require('chromium');

const YoutubeMusicDownloader = require('./Modules/youtube-music-downloader.js');
const DiceRoller = require('./Modules/dice-roller.js');
const Waifu = require('./Modules/waifu.js');
const Notequest = require('./Modules/notequest.js');
const SteamGames = require('./Modules/steam-games.js');
const Meme = require('./Modules/meme-api.js');
const MonsterHunterWorldApi = require('./Modules/monster-hunter-world.js');
const Animes = require('./Modules/animes.js');
const Encore = require('./Modules/encore.js');
const Tibia = require('./Modules/tibia.js');
const Rotmg = require('./Modules/rotmg/rotmg.js');

class WhatsappWebClient {
    constructor() {
        this.prefixes = ["!", "-"];
        this.commands = [
            { "p": async (message) => { return await this.youtubeMusicDownloader(message) }},
            { "everyone": async (message) => { return await this.mentionEveryone(message) }},
            { "roll": async (message) => { return await this.rollDice(message) }},
            { "sticker": async (message) => { return this.imageToGif(message) }},
            { "waifu": async (message) => { return this.waifu(message) }},
            { "notequest": async (message) => { return this.notequest(message) }},
            { "steam": async (message) => { return this.getSteamGameInfo(message) }},
            { "meme": async (message) => { return this.getMeme(message) }},
            { "mhw": async (message) => { return this.getMonsterHunterWorldInfo(message) }},
            { "anime": async (message) => { return this.getAnimeDataByName(message, 'tv') }},
            { "encore": async (message) => { return this.getChartByName(message) }},
            { "tibia-player": async (message) => { return this.getPlayerByName(message) }},
            { "rotmg-player": async (message) => { return this.getRotmgPlayer(message) }}
        ];

        this.wwebClient = new Client({
            authStrategy: new LocalAuth(),
            ffmpegPath: ffmpeg,
            puppeteer: {
                executablePath: chromiumBinary.path,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });

        this.wwebClient.on('qr', qr => { qrcode.generate(qr, {small: true}); });
        this.wwebClient.on('auth_failure', message => { console.log(message) });
        this.wwebClient.on('ready', async () => { 
            console.log('Whatsapp web client is ready! \n'); 
        });
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

                var infoMessage = await chat.sendMessage(text, {mentions: [contact], linkPreview: true});
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
    
        if(nsfw == 'nsfw') {
            await chat.sendMessage(media, {isViewOnce: true});
        } else {
            await chat.sendMessage(media, {sendMediaAsSticker: true, stickerAuthor: "Sticker", stickerName: "Sticker", stickerCategories: []});
        }
    }

    async getMeme(message) {
        const chat = await message.getChat();
        const contact = await message.getContact();
    
        console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

        const meme = new Meme();
        const media = await MessageMedia.fromUrl(await meme.getMeme());
    
        await message.reply(media);
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
            text += `*Jogadores Online:* ${game.data.player_count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}\n\n`;
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

    async getMonsterHunterWorldInfo(message) {
        const chat = await message.getChat();
        const contact = await message.getContact();

        console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

        var commandSplit = message.body.split(" ");
        
        if(commandSplit.length < 3) {
            await message.reply("Comando ta errado!");
            return;
        }

        commandSplit.shift();
        var infoType = commandSplit[0];
        commandSplit.shift();
        var infoName = commandSplit.join(" ");

        if(infoType == 'monster') {
            const mhw = new MonsterHunterWorldApi();
            const data = await mhw.getMonster(infoName);

            if(data.error) {
                await message.reply(data.message);
                return; 
            }

            var monsterInfo = data.data;
            var text = "";

            text += `*Name:* ${monsterInfo.name}\n`;
            text += `*Type* ${monsterInfo.type}\n`;
            text += `*Species:* ${monsterInfo.species}\n`;
            text += `*Description:* ${monsterInfo.description}\n`;
            text += `*---------------------------------*\n`;
            text += `*Elements:*\n`;
            if(Object.keys(monsterInfo.elements).length > 0) {
                for(const key in monsterInfo.elements) {
                    var element = monsterInfo.elements[key];
                    text += `-${element}\n`;
                }
            } else {
                text += "-none\n";
            }
            text += `*---------------------------------*\n`;
            text += `*Resistances:*\n`;
            if(Object.keys(monsterInfo.resistances).length > 0) {
                for(const key in monsterInfo.resistances) {
                    var resistance = monsterInfo.resistances[key];
                    text += `-${resistance.element}\n`;
                }
            } else {
                text += "-none\n";
            }
            text += `*---------------------------------*\n`;
            text += `*Weaknesses:*\n`;
            if(Object.keys(monsterInfo.weaknesses).length > 0) {
                for(const key in monsterInfo.weaknesses) {
                    var weakness = monsterInfo.weaknesses[key];

                    var startText = "";
                    for(var i = 0; i < weakness.stars; i++) {
                        startText += " * ";
                    }

                    text += `-${weakness.element} -> ${startText}\n`;
                }
            } else {
                text += "-none\n";
            }

            var monsterNameSplit = monsterInfo.name.toLowerCase().split(" ");
            monsterNameSplit = monsterNameSplit.join("_");

            const media = await MessageMedia.fromUrl(`https://monsterhunterworld.wiki.fextralife.com/file/Monster-Hunter-World/mhw-${monsterNameSplit}_render_001.png`);

            await chat.sendMessage(text, {media: media});
            return;
        }
    }

    async getAnimeDataByName(message, type) {
        const chat = await message.getChat();
        const contact = await message.getContact();

        console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

        var commandSplit = message.body.split(" ");
        commandSplit.shift();
        var animeName = commandSplit.join(" ");

        if(!animeName) {
            await message.reply("Nome do anime é obrigatório.");
            return;
        }

        const animes = new Animes();
        const anime = await animes.getAnimeData(animeName, type);

        if(anime.error == false) {
            var animeSummary = anime.data;
            
            if(animeSummary.image) {
                const media = await MessageMedia.fromUrl(animeSummary.image);
    
                await chat.sendMessage(`${animeSummary.title}\n${animeSummary.title_english}\n${animeSummary.title_portuguese}\n\n*Episódios*: ${animeSummary.episodes}\n*Nota*: ${animeSummary.score}\n\n${animeSummary.synopsis}`,
                    {media: media}
                );
            } else {
                await message.reply(`${animeSummary.title}\n${animeSummary.title_english}\n${animeSummary.title_portuguese}\n\n*Episódios*: ${animeSummary.episodes}\n*Nota*: ${animeSummary.score}\n\n${animeSummary.synopsis}`);
            }
        } else {
            await message.reply(anime.message);
        }
    }

    async getChartByName(message) {
        const chat = await message.getChat();
        const contact = await message.getContact();

        console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

        var commandSplit = message.body.split(" ");
        commandSplit.shift();
        var musicName = commandSplit.join(" ");

        if(!musicName) {
            await message.reply("Nome da musica é obrigatório.");
            return;
        }

        const encore = new Encore();
        const response = await encore.getCharts(musicName);

        if(response.error == false) {
            var chart = response.data;

            var text = "";

            text += `*Nome:* ${chart.name}\n`;
            text += `*Artista:* ${chart.artist}\n`;
            text += `*Album:* ${chart.album}\n`;
            text += `*Ano:* ${chart.year}\n`;
            text += `*Charter:* ${chart.charter}\n`;
            text += `*Url:* ${encodeURI(chart.url)}\n`;
            text += `*Download:* ${encodeURI(chart.download_url)}`;

            const media = await MessageMedia.fromUrl(chart.image);
            await chat.sendMessage(text, {media: media});
            
            return;
        } else {
            await message.reply(response.message);
        }
    }

    async getRedditUrlContent(message) {
        const chat = await message.getChat();
        const contact = await message.getContact();

        console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

        var commandSplit = message.body.split(" ");
        commandSplit.shift();
        var redditUrl = commandSplit.join(" ");

        if(!redditUrl) {
            await message.reply("Link é obrigatório.");
            return;
        }

        const reddit = new Reddit();
        const contentUrl = await reddit.getPostMediaUrl(redditUrl);

        const media = await MessageMedia.fromUrl(contentUrl);

        await chat.sendMessage(media);

        return;
    }

    async getPlayerByName(message) {
        const chat = await message.getChat();
        const contact = await message.getContact();

        console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

        var commandSplit = message.body.split(" ");
        commandSplit.shift();
        var name = commandSplit.join(" ");

        if(!name) {
            await message.reply("Nome do jogador é obrigatório.");
            return;
        }

        const tibia = new Tibia()
        const player = await tibia.getPlayerByName(name);

        if (player.error) {
            await chat.sendMessage(player.error)
            return;
        }

        var text = "";
        text += `*${player.data.name}*\n\n`;

        text += `*Level:* ${player.data.level}\n`;
        text += `*Gender:* ${player.data.sex}\n`;
        text += `*Residence:* ${player.data.residence}\n`;
        text += `*Guild Name:* ${player.data.guild_name}\n`;
        text += `*Guild Rank:* ${player.data.guild_rank}\n`;
        text += `*Last Login:* ${player.data.last_login}`;

        await chat.sendMessage(text);
    }

    async getRotmgPlayer(message) {
        const chat = await message.getChat();
        const contact = await message.getContact();

        console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

        var commandSplit = message.body.split(" ");
        commandSplit.shift();
        var name = commandSplit.join(" ");

        if(!name) {
            await message.reply("Nome do jogador é obrigatório.");
            return;
        }

        const rotmg = new Rotmg();

        try {
            const player = await rotmg.getPlayer(name);

            var text = "*Info*\n";
            text += `*---------------------------------*\n`;
            text += `*Nome:* ${player.info.name}\n`;
            text += `*Personagens:* ${player.info.characters}\n`;
            text += `*Skins:* ${player.info.skins}\n`;
            text += `*Exaltations:* ${player.info.exaltations}\n`;
            text += `*Fama:* ${player.info.fame}\n`;
            text += `*Rank:* ${player.info.rank}\n`;
            text += `*Guild:* ${player.info.guild}\n`;
            text += `*Cargo:* ${player.info.guild_rank}\n`;
            text += `*Visto por último: ${player.info.last_seen == 'hidden' ? player.info.last_seen : this.formatDate(player.info.last_seen)}*\n`;
            text += `*Descrição:* ${player.info.description}\n\n`;

            text += `*Personagens*\n`;
            text += `*---------------------------------*\n`;
            if(Object.keys(player.characters).length > 0) {
                for(const key in player.characters) {
                    var character = player.characters[key];

                    text += `*Classe:* ${character.class}\n`;
                    text += `*Level:* ${character.level}\n`;
                    text += `*Fama:* ${character.fame}\n`;
                    text += `*Stats:* ${character.stats}\n\n`;
                }
            } else {
                text += "-none\n";
            }

            text += `*Ultima morte*\n`;
            text += `*---------------------------------*\n`;
            if(Object.keys(player.graveyard).length > 0) {
                text += `*Morto em: ${this.formatDate(player.graveyard[0].died_on)}*\n`;
                text += `*Classe:* ${player.graveyard[0].class}\n`;
                text += `*Level:* ${player.graveyard[0].level}\n`;
                text += `*Stats:* ${player.graveyard[0].stats}\n`;
                text += `*Morto por:* ${player.graveyard[0].killed_by}\n`;
            } else {
                text += "-none\n";
            }

            await chat.sendMessage(text);
        } catch (e) {
            await message.reply(e.message);
        }
    }

    formatDate(date) {
        var data = new Date(date);
        var config = {
            timezone: 'America/Sao_Paulo'
        };
        return data.toLocaleString('pt-BR', config);
    }
}

module.exports = WhatsappWebClient
