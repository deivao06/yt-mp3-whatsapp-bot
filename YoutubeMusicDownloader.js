const { Downloader, YtdlMp3Error } = require('ytdl-mp3');
const ytsr = require('ytsr');

class YoutubeMusicDownloader {
    async download(videoName) {
        const downloader = new Downloader({
            outputDir: './files',
            getTags: false,
        });

        const videoData = await this.searchYoutubeVideo(videoName);

        if(!videoData.error) {
            try {
                const path = await downloader.downloadSong(videoData.url);
        
                return {
                    error: false,
                    path: path
                }
            } catch (e) {
                if(e instanceof YtdlMp3Error) {
                    return {
                        error: true,
                        message: "Não consegui baixar não, pode ser que tenha restrição de idade"
                    }
                }
            }
        } else {
            return videoData;
        }
    }

    async downloadFromUrl(videoUrl) {
        const downloader = new Downloader({
            outputDir: './files',
            getTags: false,
        });

        try {
            const path = await downloader.downloadSong(videoUrl);
    
            return {
                error: false,
                path: path
            }
        } catch (e) {
            if(e instanceof YtdlMp3Error) {
                return {
                    error: true,
                    message: "Não consegui baixar não, pode ser que tenha restrição de idade"
                }
            }
        }
    }
  
    async searchYoutubeVideo(videoName) {
        try {
            const filters1 = await ytsr.getFilters(videoName);
            const filter1 = filters1.get('Type').get('Video');

            const searchResults = await ytsr(filter1.url, { limit: 10, pages: 1 });

            var videoData = null;

            searchResults.items.every((result, index) => {
                if(result.type == 'shelf') {
                    if(result.items.length > 0) {
                        videoData = {
                            error: false,
                            name: result.items[0].title,
                            url: result.items[0].url
                        }

                        return false;
                    }
                } else if (result.type == 'video') {
                    videoData = {
                        error: false,
                        name: result.title,
                        url: result.url
                    }

                    return false;
                }

                return true;
            });
            
            return videoData;
        } catch (e) {
            if(e instanceof TypeError) {
                return {
                    error: true,
                    message: "Não deu certo, tenta denovo"
                }
            }
        }
    }
}

module.exports = { YoutubeMusicDownloader };
