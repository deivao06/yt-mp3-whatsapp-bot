const express = require('express');
const router = express.Router();

const YoutubeMusicDownloader = require('./src/Modules/youtube-music-downloader.js');
const DiceRoller = require('./src/Modules/dice-roller.js');
const Waifu = require('./src/Modules/waifu.js');
const Notequest = require('./src/Modules/notequest.js');
const SteamGames = require('./src/Modules/steam-games.js');
const Animes = require('./src/Modules/animes.js');
const Encore = require('./src/Modules/encore.js');
const Reddit = require('./src/Modules/reddit.js');
const Rotmg = require('./src/Modules/rotmg.js');

router.get('/youtube-music-downloader', async (request, response) => {
    const videoNameOrUrl = request.query.message;
    const youtubeMusicDownloader = new YoutubeMusicDownloader('./src/Files');

    try {
        var songData = await youtubeMusicDownloader.downloadSong(videoNameOrUrl);
        response.status(200).json(songData);
    } catch (e) {
        console.log(e.message);
        response.status(500).json({ message: e.message });
    }
});

router.get('/youtube-video-downloader', async (request, response) => {
    const videoNameOrUrl = request.query.message;
    const youtubeMusicDownloader = new YoutubeMusicDownloader('./src/Files');

    try {
        var songData = await youtubeMusicDownloader.downloadVideo(videoNameOrUrl);
        response.status(200).json(songData);
    } catch (e) {
        console.log(e.message);
        response.status(500).json({ message: e.message });
    }
});

router.get('/dice-roller', async (request, response) => {
    const dices = request.query.message;
    const diceRoller = new DiceRoller();

    var result = await diceRoller.roll(dices);

    response.status(200).json({ message: result });
});

router.get('/waifu', async (request, response) => {
    const nsfw = request.query.message;

    const waifu = new Waifu();
    response.status(200).json({ message: await waifu.getWaifu(nsfw)});
})

router.get('/notequest', async (request, response) => {
    const name = request.query.message;
    const notequest = new Notequest();
    const adventurer = await notequest.adventurer(name);

    response.status(200).json(adventurer);
})

router.get('/steam-games', async (request, response) => {
    var gameName = request.query.message;

    const steamGames = new SteamGames();
    const game = await steamGames.getGameInfoByName(gameName);
    
    response.status(200).json(game);
});

router.get('/anime', async (request, response) => {
    var animeName = request.query.message;
    const animes = new Animes();
    const anime = await animes.getAnimeData(animeName, 'tv');

    response.status(200).json(anime);
})

router.get('/encore', async (request, response) => {
    var musicName = request.query.message;
    const encore = new Encore();
    const chart = await encore.getCharts(musicName);

    response.status(200).json(chart);
})

router.get('/teste', async (request, response) => {
    const reddit = new Reddit();
    const mediaUrl = await reddit.getPostMediaUrl(`https://www.reddit.com/r/videogames/s/jdV2GThluT`);

    response.status(200).json(mediaUrl);
})

router.get('/rotmg/guild/:name', async (request, response) => {
    const rotmg = new Rotmg();
    
    try {
        const players = await rotmg.getGuildMembers(request.params.name);
        response.status(200).json(players);
    } catch (error) {
        response.status(error.statusCode).json({message: error.message});
    }
})

router.get('/rotmg/player/:name', async (request, response) => {
    const rotmg = new Rotmg();
    
    // try {
        const player = await rotmg.getPlayer(request.params.name);
        response.status(200).json(player);
    // } catch (error) {
    //     response.status(error.statusCode).json({message: error.message});
    // }
})

module.exports = router;