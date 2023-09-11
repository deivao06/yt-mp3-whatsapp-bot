const express = require('express');
const router = express.Router();

const YoutubeMusicDownloader = require('./src/Modules/youtube-music-downloader.js');

router.get('/youtube-music-downloader', async (request, response) => {
    var videoNameOrUrl = request.params.message;
    
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
});

module.exports = router;