const axios = require('axios');
const { translate } = require('free-translate');

class Animes {
    constructor() {
        this.api_url = "https://api.jikan.moe/v4";
    }

    async getAnimeData(animeName, type) {
        const response = await axios.get(`${this.api_url}/anime?q=${animeName}&nsfw&type=${type}`);

        if(response.data.data.length > 0) {
            var anime = response.data.data[0];
            var synopsis = "";
            var title = "";
    
            if(anime.title_english) {
                title = await translate(anime.title_english, { from: 'en', to: 'pt' });
            }
    
            if(anime.synopsis) {
                synopsis = await translate(anime.synopsis, { from: 'en', to: 'pt' });
            }
    
            var animeSummary = {
                title: `*${anime.title}*`,
                title_portuguese: title ? `~${title}~` : "",
                title_english: anime.title_english ? `_${anime.title_english}_` : "",
                episodes: anime.episodes,
                score: anime.score,
                image: anime.images.jpg.image_url,
                synopsis: synopsis != "" ? synopsis : anime.synopsis
            }

            return {
                error: false,
                data: animeSummary
            }
        } else {
            return {
                error: true,
                message: "Não encontrei nenhum anime com esse nome"
            }
        }
    }
}


module.exports = Animes;