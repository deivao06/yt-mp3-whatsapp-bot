const axios = require('axios');

class SteamGames {
    constructor() {
        this.steam_games_api_url = 'https://api.steampowered.com/ISteamApps/GetAppList/v2/';
        this.steam_game_player_count_url = 'https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/';
        this.steam_game_info_url = 'https://store.steampowered.com/api/appdetails';
    }

    async getGameInfoByName(name) {
        const steamAllGames = await this.getAllSteamGames();

        var game = steamAllGames.find(game => {
            return game.name.toLowerCase() == name.toLowerCase();
        });

        if(game != null) {
            const response = await axios.get(this.steam_game_info_url + `?appids=${game.appid}&cc=br&l=pt`);
            const playerCountResponse = await axios.get(this.steam_game_player_count_url + `?appid=${game.appid}`);

            if(response.data[game.appid].success) {
                var gameInfoFormatted = {};

                gameInfoFormatted.id = game.appid;
                gameInfoFormatted.name = response.data[game.appid].data.name;
                gameInfoFormatted.player_count =  playerCountResponse.data.response.player_count;
                gameInfoFormatted.free = response.data[game.appid].data.is_free; 
                gameInfoFormatted.description = response.data[game.appid].data.short_description;
                gameInfoFormatted.image = response.data[game.appid].data.header_image;
                gameInfoFormatted.developers = response.data[game.appid].data.developers;
                gameInfoFormatted.publishers = response.data[game.appid].data.publishers;
                gameInfoFormatted.price = response.data[game.appid].data.price_overview;
                gameInfoFormatted.categories = response.data[game.appid].data.categories;
                gameInfoFormatted.genres = response.data[game.appid].data.genres;

                return {
                    error: false,
                    data: gameInfoFormatted
                }
            }
        } else {
            console.log(game);

            return {
                error: true,
                message: "Nenhum jogo encontrado."
            }
        }
    }

    async getAllSteamGames() {
        const steamGames = await axios.get(this.steam_games_api_url);

        return steamGames.data.applist.apps;
    }
}

module.exports = SteamGames;