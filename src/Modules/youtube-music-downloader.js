const usetube = require('usetube');
const ytdl = require('ytdl-core');
const cp = require('child_process');
const path = require('path');
const ffmpeg = require('ffmpeg-static');

class YoutubeMusicDownloader {
    constructor(outputDir) {
        this.outputDir = outputDir;
        this.ffmpegBinary = ffmpeg;
    }

    async downloadSong(videoName) {
        var searchData = null;

        if(videoName.includes('http')) {
            searchData = {
                error: false,
                url: videoName
            }
        } else {
            searchData = await this.searchYoutubeVideo(videoName);
        }
        
        if(!searchData.error) {
            var url = searchData.url;

            const videoInfo = await ytdl.getInfo(url);
            const outputFile = this.getOutputFile(videoInfo.videoDetails.title);
            const videoData = await this.downloadVideo(videoInfo);

            this.videoToAudio(videoData, outputFile);

            return {
                error: false,
                path: outputFile
            }
        } else {
            return searchData;
        }
    }

    async downloadVideo(videoInfo) {
        const buffers = [];
        const stream = ytdl.downloadFromInfo(videoInfo, { quality: 'highestaudio' });
    
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => {
                buffers.push(chunk);
            });
            stream.on('end', () => {
                resolve(Buffer.concat(buffers));
            });
            stream.on('error', (err) => {
                reject(err);
            });
        });
    }
  
    async searchYoutubeVideo(videoName) {
        const searchResults = await usetube.searchVideo(videoName);

        if(searchResults.videos.length > 0) {
            return {
                error: false,
                name: searchResults.videos[0].original_title,
                url: `https://www.youtube.com/watch?v=${searchResults.videos[0].id}`
            }
        }

        return {
            error: true,
            message: "Nenhum video encontrado"
        }
    }

    videoToAudio(videoData, outputFile) {
        cp.execSync(`${this.ffmpegBinary} -loglevel 24 -i pipe:0 -vn -sn -c:a mp3 -ab 192k ${outputFile}`, {
            input: videoData,
        });
    }

    getOutputFile(videoTitle) {
        const baseFileName = videoTitle
            .replace(/\s*[([].*?[)\]]\s*/g, '')
            .replace(/[^a-z0-9]/gi, '_')
            .split('_')
            .filter((element) => element)
            .join('_')
            .toLowerCase();

        return path.join(this.outputDir, baseFileName + '.mp3');
    }
}

module.exports = YoutubeMusicDownloader;
