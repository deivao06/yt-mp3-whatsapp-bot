const qrcode = require('qrcode-terminal');
const fs = require('fs')
const axios = require('axios');

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const { YoutubeMusicDownloader } = require('./YoutubeMusicDownloader.js');

const yt = new YoutubeMusicDownloader();
const prefix = "!";
const commands = [
    {"p": async (message) => {return await downloadAndSendYoutubeMp3(message)}},
    {"everyone": async (message) => {return await mentionEveryone(message)}},
    {"roll": async (message) => {return await rollDice(message)}},
    {"timetoduel": async (message) => {return await randomYugiohCard(message)}},
    {"anime": async (message) => {return await animeData(message)}}
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
                await commandFunction(message);
            }
        })
    }
}

async function downloadAndSendYoutubeMp3(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();

    console.log(`${contact.id.user} ${chat.name} ${message.body}`);

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

    console.log(`${contact.id.user} ${chat.name} ${message.body}`);

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

    console.log(`${contact.id.user} ${chat.name} ${message.body}`);

    var commandSplit = message.body.split(" ");
    commandSplit.shift();

    if(!regex.test(commandSplit.join(" "))) {
        await message.reply("Escreve direto, exemplo: 2d6 (2 dados de 6 lados)");
        return;
    }

    var dices = commandSplit.join(" ").split("d");

    var diceQtd = dices[0];
    var diceType = dices[1];

    if(diceQtd <= 0 || diceType <= 0) {
        await message.reply("Escreve direto, não existe dado 0");
        return;
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

async function animeData(message) {
    const chat = await message.getChat();
    const contact = await message.getContact();

    console.log(`${contact.id.user} ${chat.name} ${message.body}`);

    var commandSplit = message.body.split(" ");
    commandSplit.shift();
    var animeName = commandSplit.join(" ");

    var response = await axios.get(`https://api.jikan.moe/v4/anime?q=${animeName}&sfw`);

    if(response.data.data.length > 0) {
        var anime = response.data.data[0];

        var animeSummary = {
            title: anime.titles[0].title,
            episodes: anime.episodes,
            score: anime.score,
            image: anime.images.jpg.image_url,
            synopsis: anime.synopsis
        }

        if(animeSummary.image) {
            const media = await MessageMedia.fromUrl(animeSummary.image);

            await chat.sendMessage(`*${animeSummary.title}*\n\n*Episódios*: ${animeSummary.episodes}\n*Nota*: ${animeSummary.score}\n\n${animeSummary.synopsis}`,
                {media: media}
            );
        } else {
            await message.reply(`*${animeSummary.title}*\n\n*Episódios*: ${animeSummary.episodes}\n*Nota*: ${animeSummary.score}\n\n${animeSummary.synopsis}`);
        }
    } else {
        await message.reply("Não encontrei nenhum anime com esse nome");
        return;
    }
}