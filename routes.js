const express = require('express');
const router = express.Router();

const YoutubeMusicDownloader = require('./src/Modules/youtube-music-downloader.js');
const DiceRoller = require('./src/Modules/dice-roller.js');
const Waifu = require('./src/Modules/waifu.js');

router.get('/youtube-music-downloader', async (request, response) => {
    const videoNameOrUrl = request.query.message;
    const youtubeMusicDownloader = new YoutubeMusicDownloader();

    if(videoNameOrUrl.startsWith("https")){
        videoData = await youtubeMusicDownloader.downloadFromUrl(videoNameOrUrl);
    } else {
        videoData = await youtubeMusicDownloader.download(videoNameOrUrl);
    }

    if(videoData.hasOwnProperty('error') && !videoData.error) {
        response.status(200).json({ message: videoData.path });
        return;
    } else {
        response.status(401).json({ message: videoData.message });
        return;
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