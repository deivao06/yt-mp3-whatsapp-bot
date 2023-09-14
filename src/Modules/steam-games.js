const axios = require('axios');
const cheerio = require('cheerio');

class SteamGames {
    constructor() {
        this.steam_db_url = 'https://steamdb.info/api/RenderAppHover/';
        this.steam_games_api_url = 'https://api.steampowered.com/ISteamApps/GetAppList/v2/';
    }

    async getGameInfoByName(name) {
        const steamAllGames = await this.getAllSteamGames();

        var result = steamAllGames.find(game => {
            return game.name.toLowerCase() == name.toLowerCase();
        });

        var game = result;

        if(game) {
            const response = await axios.get(this.steam_db_url + `?appid=${game.appid}`);
        }
    }

    async getAllSteamGames() {
        const steamGames = await axios.get(this.steam_games_api_url);

        return steamGames.data.applist.apps;
    }
}

module.exports = SteamGames;