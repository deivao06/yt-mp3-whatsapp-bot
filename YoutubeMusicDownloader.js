const { Downloader } = require('ytdl-mp3');
const ytsr = require('ytsr');

class YoutubeMusicDownloader {
  async download(videoName) {
    const downloader = new Downloader({
      outputDir: './files',
      getTags: false,
    });
  
    const data = await this.searchYoutubeVideo(videoName);

    if(!data.error) {
      try {
        var path = await downloader.downloadSong(data.url);
        return path;
      } catch(e) {
        return e;
      }
    } else {
      return data.message;
    }
  }
  
  async searchYoutubeVideo(videoName) {
      const filters1 = await ytsr.getFilters(videoName);
      const filter1 = filters1.get('Type').get('Video');

      const searchResults = await ytsr(filter1.url, { limit: 2 });

      if(searchResults.items.length > 0) {
        return {
          error: false,
          url: searchResults.items[0].url
        }
      } else {
        return {
          error: true,
          message: "Nenhum resultado encontrado"
        }
      }
  }
}

module.exports = { YoutubeMusicDownloader };
