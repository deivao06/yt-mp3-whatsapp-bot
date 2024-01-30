const axios = require('axios');

class Encore {
    constructor() {
        this.api_url = 'https://api.enchor.us';
        this.chart_url = 'https://enchor.us';
        this.image_url = 'https://files.enchor.us';
        this.response_limit = 1;
    }

    async getCharts(musicName) {
        var formatedData = [];

        const response = await axios.post(`${this.api_url}/search`, {
            "search": musicName,
            "page":1,
            "instrument": null,
            "difficulty": null
        });

        if(response.data.found > 0) {
            response.data.data.forEach((chart) => {
                if(formatedData.length < this.response_limit) {
                    var data = {
                        name: chart.name || '',
                        artist: chart.artist || '',
                        album: chart.album || '',
                        year: chart.album || '',
                        charter: chart.charter || '',
                        url: `${this.chart_url}/?hash=${chart.md5}`,
                        download_url: `${this.chart_url}/download?md5=${chart.md5}&isSng=false&filename=${chart.artist} - ${chart.name} (${chart.charter})`,
                        image: `${this.image_url}/${chart.albumArtMd5}.jpg`
                    }

                    formatedData.push(data);
                }
            })
        } else {
            return {
                error: true,
                message: "Nenhuma chart encontrada!"
            }
        }

        return {
            error: false,
            data: formatedData
        }
    }
}

module.exports = Encore;