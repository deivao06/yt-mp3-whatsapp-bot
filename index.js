const qrcode = require('qrcode-terminal');
const fs = require('fs')
const axios = require('axios');
const { translate } = require('free-translate');

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { YoutubeMusicDownloader } = require('./YoutubeMusicDownloader.js');
const { UsersRepository } = require('./repositories/UsersRepository.js');
const { RepetecosRepository } = require('./repositories/RepetecosRepository.js');
const { FichasRepository } = require('./repositories/FichasRepository.js');

const yt = new YoutubeMusicDownloader();
const usersRepository = new UsersRepository();
const repetecosRepository = new RepetecosRepository();
const fichasRepository = new FichasRepository();

const prefix = "!";
const commands = [
    {"p": async (message) => {return await downloadAndSendYoutubeMp3(message)}},
    {"everyone": async (message) => {return await mentionEveryone(message)}},
    {"roll": async (message) => {return await rollDice(message)}},
    {"timetoduel": async (message) => {return await randomYugiohCard(message)}},
    {"anime": async (message) => {return await animeData(message, "tv")}},
    {"animem": async (message) => {return await animeData(message, "movie")}},
    {"movie": async (message) => {return await movieData(message)}},
    {"sticker": async (message) => {return await imageToGif(message)}},
    {"pkm": async (message) => {return await pokemon(message)}},
    // {"register": async (message) => {return await registerUsers(message)}},
    {"repeteco": async (message) => {return await repeteco(message)}},
    {"snap": async (message) => {return await marvelSnapCardData(message)}},
    {"ficha": async (message) => {return await ficha(message)}},
    {"trace": async (message) => {return await trace(message)}},
];
const attributes = {
    "str": "strength",
    "dex": "dexterity",
    "con": "constitution",
    "int": "intelligence",
    "wis": "wisdom",
    "cha": "charism",
}

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
                const contact = await message.getContact();

                await commandFunction(message);
                // if(contact.id.user == '559181770303') {
                //     await message.reply('Você está proibido de mandar comandos no bot');
                // } else {
                // }
            }
        })
    }
}

async function downloadAndSendYoutubeMp3(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();

    console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

    var commandSplit = message.body.split(" ");
    commandSplit.shift();
    var videoNameOrUrl = commandSplit.join(" ");
    
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

    console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

    var text = "";
    var mentions = [];

    for(var participant of chat.participants) {
        const contact = await client.getContactById(participant.id._serialized);
        
        mentions.push(contact);
        text += `@${participant.id.user} `;
    }

    await chat.sendMessage(text, { mentions });
}

async function rollDice(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();
    const regex = new RegExp('[0-9][d][0-9]');

    console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

    var commandSplit = message.body.split(" ");
    commandSplit.shift();

    var dices = commandSplit[0];

    if(!regex.test(commandSplit[0])) {
        await message.reply("Escreve direto, exemplo: 2d6 (2 dados de 6 lados)");
        return;
    }

    dices = dices.split("d");

    var diceQtd = dices[0];
    var diceType = dices[1];

    if(diceQtd <= 0 || diceType <= 0) {
        await message.reply("Escreve direto, não existe dado 0");
        return;
    }

    var modificadorDado = null;

    if(commandSplit[1]) {
        var requestAtributo = commandSplit[1].trim();
        var attribute = attributes[requestAtributo];

        if(attribute) {
            var ficha = await fichasRepository.getFicha(contact);

            if(ficha) {
                var fichaAttribute = ficha[attribute];
                modificadorDado = modificador(fichaAttribute);
            } else {
                await message.reply("Nenhuma ficha encontrada para este contato");
                return;
            }
        } else {
            await message.reply("Este atributo não existe");
            return;
        }
    }

    var response = await axios.get(`https://www.dejete.com/api?nbde=${diceQtd}&tpde=${diceType}`);

    var result = "Resultado: (";
    var sum = 0;

    response.data.forEach((dice, key) => {
        if(key == response.data.length - 1) {
            result += `${dice.value})`
        } else {
            result += `${dice.value} + `
        }

        sum += dice.value;
    })

    result += ` = ${sum}`;

    if(modificadorDado) {
        result += ` + (${modificadorDado}) = ${sum + modificadorDado}`
    }

    await message.reply(result);
}

async function randomYugiohCard(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();

    console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

    var response = await axios.get(`https://db.ygoprodeck.com/api/v7/randomcard.php`);

    const media = await MessageMedia.fromUrl(response.data.card_images[0].image_url);
    
    await message.reply(media);
}

async function animeData(message, type) {
    const chat = await message.getChat();
    const contact = await message.getContact();

    console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

    var commandSplit = message.body.split(" ");
    commandSplit.shift();
    var animeName = commandSplit.join(" ");

    var response = await axios.get(`https://api.jikan.moe/v4/anime?q=${animeName}&type=${type}`);

    if(response.data.data.length > 0) {
        var anime = response.data.data[0];
        var synopsis = "";
        var title = "";

        if(anime.title_english) {
            title = await translate(anime.title_english, { from: 'en', to: 'pt' });
        }

        if(anime.synopsis) {
            synopsis = await translate(anime.synopsis, { from: 'en', to: 'pt' });
        }

        var animeSummary = {
            title: `*${anime.title}*`,
            title_portuguese: title ? `~${title}~` : "",
            title_english: anime.title_english ? `_${anime.title_english}_` : "",
            episodes: anime.episodes,
            score: anime.score,
            image: anime.images.jpg.image_url,
            synopsis: synopsis != "" ? synopsis : anime.synopsis
        }

        if(animeSummary.image) {
            const media = await MessageMedia.fromUrl(animeSummary.image);

            await chat.sendMessage(`${animeSummary.title}\n${animeSummary.title_english}\n${animeSummary.title_portuguese}\n\n*Episódios*: ${animeSummary.episodes}\n*Nota*: ${animeSummary.score}\n\n${animeSummary.synopsis}`,
                {media: media}
            );
        } else {
            await message.reply(`${animeSummary.title}\n${animeSummary.title_english}\n${animeSummary.title_portuguese}\n\n*Episódios*: ${animeSummary.episodes}\n*Nota*: ${animeSummary.score}\n\n${animeSummary.synopsis}`);
        }
    } else {
        await message.reply("Não encontrei nenhum anime com esse nome");
        return;
    }
}

async function movieData(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();

    console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

    var commandSplit = message.body.split(" ");
    commandSplit.shift();
    var movieName = commandSplit.join(" ");

    var response = await axios.get(`https://search.imdbot.workers.dev/?q=${movieName}`);

    if(response.data.ok && response.data.description.length > 0) {
        var movieSummary = {};

        var movie = response.data.description[0];
        movieSummary = {
            title: movie['#TITLE'],
            year: movie['#YEAR'],
            url: movie['#IMDB_URL'],
            image: movie['#IMG_POSTER']
        }

        if(movieSummary.image) {
            const media = await MessageMedia.fromUrl(movieSummary.image);
    
            await chat.sendMessage(`*${movieSummary.title}*\n*Ano:* ${movieSummary.year}\n*Url:* ${movieSummary.url}`,
                {media: media}
            );
        } else {
            await message.reply("Não encontrei imagem para esse filme, então nem compensa mandar nada");
        }
    } else {
        await message.reply("Não encontrei nenhum filme com esse nome");
    }
}

async function imageToGif(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();

    console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);
    
    if(message.hasMedia) {
        const media = await message.downloadMedia();
        await chat.sendMessage(media, {sendMediaAsSticker: true, stickerAuthor: "Sticker", stickerName: "Sticker", stickerCategories: []});
    } else {
        message.reply("Tem que mandar uma imagem junto com a mensagem");
    }
}

async function pokemon(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();

    console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

    var commandSplit = message.body.split(" ");
    commandSplit.shift();
    var pokemonName = commandSplit.join(" ");

    try {
        if(pokemonName.trim()) {
            var pokemonResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName.toLowerCase()}`);
        } else {
            var pokemonTotalResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon?limit=2000`);
            var randomPokemon = rand(pokemonTotalResponse.data.results);
        
            var pokemonResponse = await axios.get(randomPokemon.url);
        }
    } catch (e) {
        message.reply("Não encontrei nenhum pokemon com este nome")
        return;
    }

    var pokemonSpeciesResponse = await axios.get(pokemonResponse.data.species.url);

    var pokemonNameObject = pokemonSpeciesResponse.data.names.filter(obj => {
        return obj.language.name === "en";
    });

    var pokemonSummary = {
        id: pokemonResponse.data.id,
        order: pokemonResponse.data.order,
        name: pokemonNameObject[0].name,
        height: pokemonResponse.data.height,
        weight: pokemonResponse.data.weight,
        sprite: pokemonResponse.data.sprites.other['official-artwork'].front_default,
        stats: pokemonResponse.data.stats,
        types: pokemonResponse.data.types
    }

    if(pokemonSummary.sprite) {
        const media = await MessageMedia.fromUrl(pokemonSummary.sprite);

        var responseMessage = `*${pokemonSummary.name}*\n\n_Altura:_ ${pokemonSummary.height}\n_Peso:_ ${pokemonSummary.weight}\n\n*Tipos*\n`;
        var types = pokemonSummary.types.length > 1 ? `_${pokemonSummary.types[0].type.name}_ | _${pokemonSummary.types[1].type.name}_` : `_${pokemonSummary.types[0].type.name}_`;
    
        responseMessage += `${types}\n\n`;
        responseMessage += "*Status*\n"

        pokemonSummary.stats.forEach((stat, index) => {
            if(index == pokemonSummary.stats.length - 1) {
                responseMessage += `_${stat.stat.name}_: ${stat.base_stat}`;
            } else {
                responseMessage += `_${stat.stat.name}_: ${stat.base_stat}\n`;
            }
        })

        await chat.sendMessage(media, {sendMediaAsSticker: true, stickerAuthor: "Sticker", stickerName: "Sticker", stickerCategories: []});
        await chat.sendMessage(`${responseMessage}\n\n @${contact.id.user}`, {mentions: [contact]});
    }
}

async function marvelSnapCardData(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();

    var commandSplit = message.body.split(" ");
    commandSplit.shift();
    var cardName = commandSplit.join(" ");

    console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

    if(!cardName.trim()) {
        message.reply("Nenhum card encontrado com este nome");
        return;
    }

    var response = await axios.get(`https://marvelsnap.io/api/search.php?database&n=${cardName}`).catch(error => {
        if(error.response.status == 400){
            message.reply("Nenhum card encontrado com este nome");
        }

        return error.response;
    });

    if(response.status == 200) {
        var card = response.data.card[0];
        const media = await MessageMedia.fromUrl(`https://images.marvelsnap.io/images/cards/${card.id}.webp`);

        var responseMessage = `*${card.name}*`;

        if(card.ability) {
            responseMessage += `\n\n_"${card.ability}"_`;
        }

        if(card.method) {
            responseMessage += `\n\n${card.method}`
        }

        await chat.sendMessage(media, {sendMediaAsSticker: true, stickerAuthor: "Sticker", stickerName: "Sticker", stickerCategories: []});
        await chat.sendMessage(`${responseMessage}\n\n @${contact.id.user}`, {mentions: [contact]});
    }
}

async function registerUsers(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();

    console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

    var response = await usersRepository.registerUsers(chat.participants, client);

    if(response) {
        message.reply("Todos os contatos deste grupo foram cadastrados com sucesso");
    } else {
        message.reply("Falha ao cadastrar contatos");
    }
}

async function repeteco(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();

    console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

    const mentions = await message.getMentions();

    if(mentions.length > 0) {
        var mentionedContact = mentions[0];
        var repetecosCount = await repetecosRepository.registerRepeteco(mentionedContact);
        var s = "";

        if(repetecosCount > 1) {
            s = "s";
        }

        await chat.sendMessage(`@${mentionedContact.id.user} ja enviou *${repetecosCount}* repeteco${s}`, {mentions: [mentionedContact]});
        return;
    } else {
        message.reply("Precisa mencionar algum contato");
    }
}

async function trace(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();

    console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

    if(message.hasMedia) {
        const media = await message.downloadMedia();

        fs.writeFileSync(
            `./files/${media.filename}.jpg`,
            media.data,
            "base64",
            function (err) {
                if (err) {
                    console.log(err);
                }
            }
        )

        try {
            var response = await axios({
                method: "post",
                url: "https://api.trace.moe/search",
                data: fs.readFileSync(`./files/${media.filename}.jpg`),
            });

            if(response.data.result.length > 0) {
                var animeResult = response.data.result[0];
                const mediaMoe = await MessageMedia.fromUrl(animeResult.video);
                mediaMoe.filename = decodeURI(mediaMoe.filename);

                await chat.sendMessage(`@${contact.id.user}`, { media: mediaMoe, sendMediaAsDocument: true, mentions: [contact] });
                fs.unlinkSync(`./files/${media.filename}.jpg`)
            }
        } catch (e) {
            console.log(e);
            fs.unlinkSync(`./files/${media.filename}.jpg`)
        }
    } else if (message.hasQuotedMsg()) {

    } else {
        message.reply("Tem que mandar uma imagem junto com a mensagem");
    }
}

async function ficha(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();

    console.log(`${contact.id.user} | ${chat.name} | ${message.body}`);

    const mentions = await message.getMentions();

    var commandSplit = message.body.split(" ");

    commandSplit.splice(0, 2);

    var fichaString = commandSplit.join(" ");

    if(mentions.length == 0 && !fichaString) {
        var ficha = await fichasRepository.getFicha(contact);
        
        if(ficha) {
            var responseMessage = `*Ficha do @${contact.id.user}*\n\n`;
            responseMessage += `*Classe:* ${ficha.class}\n`
            responseMessage += `*Alinhamento:* ${ficha.alignment}\n`
            responseMessage += `*Força:* ${ficha.strength} | _${modificador(ficha.strength)}_\n`
            responseMessage += `*Destreza:* ${ficha.dexterity} | _${modificador(ficha.dexterity)}_\n`
            responseMessage += `*Constituição:* ${ficha.constitution} | _${modificador(ficha.constitution)}_\n`
            responseMessage += `*Inteligência:* ${ficha.intelligence} | _${modificador(ficha.intelligence)}_\n`
            responseMessage += `*Sabedoria:* ${ficha.wisdom} | _${modificador(ficha.wisdom)}_\n`
            responseMessage += `*Carisma:* ${ficha.charism} | _${modificador(ficha.charism)}_\n`;

            await chat.sendMessage(responseMessage, {mentions: [contact]});
            return;
        } else {
            await message.reply("Nenhuma ficha encontrada para este contato");
            return
        }
    } else if (!fichaString) {
        var mentionedContact = mentions[0];

        var ficha = await fichasRepository.getFicha(mentionedContact);
        
        if(ficha) {
            var responseMessage = `*Ficha do @${mentionedContact.id.user}*\n\n`;
            responseMessage += `*Classe:* ${ficha.class}\n`
            responseMessage += `*Alinhamento:* ${ficha.alignment}\n`
            responseMessage += `*Força:* ${ficha.strength} | _${modificador(ficha.strength)}_\n`
            responseMessage += `*Destreza:* ${ficha.dexterity} | _${modificador(ficha.dexterity)}_\n`
            responseMessage += `*Constituição:* ${ficha.constitution} | _${modificador(ficha.constitution)}_\n`
            responseMessage += `*Inteligência:* ${ficha.intelligence} | _${modificador(ficha.intelligence)}_\n`
            responseMessage += `*Sabedoria:* ${ficha.wisdom} | _${modificador(ficha.wisdom)}_\n`
            responseMessage += `*Carisma:* ${ficha.charism} | _${modificador(ficha.charism)}_\n`;

            await chat.sendMessage(responseMessage, {mentions: [mentionedContact]});
            return;
        }

        await message.reply("Nenhuma ficha encontrada para este contato");
        return;
    } else {
        try {
            var ficha = JSON.parse(fichaString);
    
            if(ficha instanceof Object) {
                var mentionedContact = mentions[0];
                var response = await fichasRepository.createOrUpdateFicha(ficha, mentionedContact);

                if(response) {
                    message.reply("Ficha criada com sucesso");
                    return;
                } else {
                    message.reply("Falha ao criar ficha");
                    return;
                }
            } else {
                message.reply("A ficha tem que ser um JSON");
                return;
            }
        } catch (e) {
            if(e instanceof SyntaxError) {
                console.log(e);

                message.reply("O formato do JSON está errado");
                return;
            }
        }
    }
}

function rand(items) {
    // "|" for a kinda "int div"
    return items[items.length * Math.random() | 0];
}

function modificador(attr) {
    return Math.floor(attr / 2) - 5;
}