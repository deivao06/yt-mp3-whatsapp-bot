const express = require('express');
const router = express.Router();

const YoutubeMusicDownloader = require('./src/Modules/youtube-music-downloader.js');
const DiceRoller = require('./src/Modules/dice-roller.js');
const Waifu = require('./src/Modules/waifu.js');

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

module.exports = router;