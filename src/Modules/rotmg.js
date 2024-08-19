const axios = require("axios");
const cheerio = require('cheerio');

class Rotmg {
    constructor () {
        this.info = {
            name: null,
            characters: null,
            skins: null,
            exaltations: null,
            fame: null,
            rank: null,
            account_fame: null,
            guild: null,
            guild_rank: null,
            created: null,
            last_seen: null,
            description: null,
        };
        this.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
        };
    }

    async getGuildMembers(name) {
        const response = await axios.get("https://www.realmeye.com/guild/" + name, {
            headers: this.headers,
        })
            .catch(function (error) {
                return error.response;
            });

        if (response.status == 200) {
            const html = response.data;
            
            if (html.indexOf("Sorry, ") !== -1) {
                return { message: 'Guild not found' };
            }

            const $ = cheerio.load(html);

            var players = [];
            var crawler = $('#e > tbody > tr');

            crawler.each((index, element) => {
                const lastSeen = $(element).find('td').eq(5).text().trim();
                const server = $(element).find('td').eq(6).text().trim();

                players.push({
                    name: $(element).find('td').eq(0).text(),
                    guild_rank: $(element).find('td').eq(1).text(),
                    fame: $(element).find('td').eq(2).text(),
                    rank: $(element).find('td').eq(3).text(),
                    chars: $(element).find('td').eq(4).text(),
                    last_seen: lastSeen.length > 0 ? lastSeen : null,
                    server: server.length > 0 ? server : null,
                    avg_fame_char: $(element).find('td').eq(7).text(),
                });
            });

            return players;
        }

        const error = Error("Error code " + response.status + " at Guild Members page");
        error.statusCode = response.status;
        throw error;
    }

    async getPlayer(name) {
        const response = await axios.get("https://www.realmeye.com/player/" + name, {
            headers: this.headers,
        })
            .catch(function (error) {
                return error.response;
            });

        if (response.status == 200) {
            const html = response.data;
            
            if (html.indexOf("Sorry, ") !== -1) {
                return { message: 'Player not found' };
            }

            const $ = cheerio.load(html);

            var player = {
                info: {},
                characters: {},
                graveyard: {},
            };

            player.info.name = $('.entity-name').text();

            var crawler = $('table.summary > tbody > tr');

            crawler.each((index, element) => {
                var td = $(element).find('td');
                var header = $(td).eq(0).text();
                
                switch (header) {
                    case 'Characters':
                        player.info.characters = $(element).find('td').eq(1).text();
                        break;
                    case 'Skins':
                        player.info.skins = $(element).find('td').eq(1).find('span').text();
                        break;
                    case 'Exaltations':
                        player.info.exaltations = $(element).find('td').eq(1).text();
                        break;
                    case 'Fame':
                        player.info.fame = $(element).find('td').eq(1).find('span').text();
                        break;
                    case 'Rank':
                        player.info.rank = $(element).find('td').eq(1).text().trim();
                        break;
                    case 'Account fame':
                        player.info.account_fame = $(element).find('td').eq(1).find('span').text();
                        break;
                    case 'Guild':
                        player.info.guild = $(element).find('td').eq(1).text();
                        break;
                    case 'Guild Rank':
                        player.info.guild_rank = $(element).find('td').eq(1).text();
                        break;
                    case 'Created':
                        player.info.created = $(element).find('td').eq(1).text();
                        break;
                    case 'Last seen':
                        player.info.last_seen = $(element).find('td').eq(1).text();
                        break;
                }
            });

            var description = $('.line1.description-line').text().trim();

            player.info.description = description.length > 0 ? description : null;

            return player;
        }

        const error = Error("Error code " + response.status + " at Player page");
        error.statusCode = response.status;
        throw error;
    }
}

module.exports = Rotmg;
