const { Downloader } = require('ytdl-mp3');
const ytsr = require('ytsr');

class YoutubeMusicDownloader {
    async download(videoName) {
        const downloader = new Downloader({
            outputDir: './files',
            getTags: false,
        });

        const videoData = await this.searchYoutubeVideo(videoName);
        const path = await downloader.downloadSong(videoData.url);

        return {
            name: videoData.name,
            path: path
        }
    }
  
    async searchYoutubeVideo(videoName) {
        const filters1 = await ytsr.getFilters(videoName);
        const filter1 = filters1.get('Type').get('Video');

        const searchResults = await ytsr(filter1.url, { limit: 10, pages: 1 });

        var videoData = null;

        searchResults.items.every((result, index) => {
            if(result.type == 'shelf') {
                if(result.items.length > 0) {
                    videoData = {
                        name: result.items[0].title,
                        url: result.items[0].url
                    }

                    return false;
                }
            } else if (result.type == 'video') {
                videoData = {
                    name: result.title,
                    url: result.url
                }

                return false;
            }

            return true;
        });
        
        return videoData;
    }
}

module.exports = { YoutubeMusicDownloader };
