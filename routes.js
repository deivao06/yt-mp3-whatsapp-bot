const express = require('express');
const router = express.Router();

const YoutubeMusicDownloader = require('./src/Modules/youtube-music-downloader.js');

router.get('/youtube-music-downloader', async (request, response) => {
    const videoNameOrUrl = request.query.message;
    const youtubeMusicDownloader = new YoutubeMusicDownloader();

    if(videoNameOrUrl.startsWith("https")){
        videoData = await youtubeMusicDownloader.downloadFromUrl(videoNameOrUrl);
    } else {
        videoData = await youtubeMusicDownloader.download(videoNameOrUrl);
    }

    if(videoData && videoData.hasOwnProperty('error') && !videoData.error) {
        response.send(videoData.path);
        return;
    } else {
        response.send(videoData.message);
        return;
    }
});

module.exports = router;