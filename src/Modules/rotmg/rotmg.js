const axios = require("axios");
const cheerio = require('cheerio');
const moment = require('moment');

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
        this.playerGraveyard = [];
    }

    async getGuildMembers(name) {
        const response = await axios.get("https://www.realmeye.com/guild/" + name, {
            headers: this.headers,
        }).catch(function (error) {
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
                    characters: $(element).find('td').eq(4).text(),
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
        }).catch(function (error) {
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
                characters: [],
                graveyard: [],
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
                        player.info.guild = $(element).find('td').eq(1).text().trim();
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

            crawler = $('.table.table-striped.tablesorter').eq(0).find('tbody > tr');
            
            crawler.each((index, element) => {
                var hasPet = $(element).find('td').length == 8 ? true : false;
                var sumPetIndex = hasPet ? 1 : 0;
                var equipmentsCrawler = $(element).find('td').eq(5 + sumPetIndex).find('a');
                var equipments = [];

                equipmentsCrawler.each((index, equipment) => {
                    equipments.push({
                        href: 'https://www.realmeye.com' + $(equipment).attr('href'),
                        name: $(equipment).find('span').attr('title'),
                    });
                });

                var statsCrawler = $(element).find('td').eq(6 + sumPetIndex);
                var keys = ['hp', 'mp', 'att', 'def', 'spd', 'vit', 'wis', 'dex'];
                var baseStatsArray = JSON.parse(statsCrawler.find('span').eq(0).attr('data-stats'));
                var baseStats = baseStatsArray.reduce((obj, value, index) => {
                    obj[keys[index]] = value;
                    return obj;
                }, {});

                player.characters.push({
                    href: 'https://www.realmeye.com' + $(element).find('td').eq(0 + sumPetIndex).find('a').eq(0).attr('href'),
                    class: $(element).find('td').eq(1 + sumPetIndex).text(),
                    level: $(element).find('td').eq(2 + sumPetIndex).text(),
                    fame: $(element).find('td').eq(3 + sumPetIndex).text(),
                    place: $(element).find('td').eq(4 + sumPetIndex).text(),
                    equipments: equipments,
                    stats: statsCrawler.text().trim(),
                    base_stats: baseStats,
                });
            });

            try {
                player.graveyard = await this.getPlayerGraveyard(name);
            } catch (error) {
                throw error;
            }

            return player;
        }

        const error = Error("Error code " + response.status + " at Player page");
        error.statusCode = response.status;
        throw error;
    }

    async getPlayerGraveyard(name) {
        var page = 1;
        var response = await this.getPlayerGraveyardPage(name, page);
        
        if (response.status == 200) {
            const $ = cheerio.load(response.data);

            const totalDeaths = $('.col-md-12').eq(0).find('p').eq(1).find('strong').text();
            
            this.playerGraveyardCrawler(response.data);

            page += 100;

            while (page < totalDeaths) {
                response = await this.getPlayerGraveyardPage(name, page);
                this.playerGraveyardCrawler(response.data);
                page += 100;
            }

            return this.playerGraveyard;
        }

        const error = Error("Error code " + response.status + " at Graveyard page");
        error.statusCode = response.status;
        throw error;
    }

    async getPlayerGraveyardPage(name, page) {
        const response = await axios.get("https://www.realmeye.com/graveyard-of-player/" + name + "/" + page, {
            headers: this.headers,
        }).catch(function (error) {
            return error.response;
        });

        return response;
    }

    playerGraveyardCrawler(html) {
        const $ = cheerio.load(html);

        var crawler = $('.table.table-striped.tablesorter').eq(0).find('tbody > tr');

        crawler.each((index, element) => {
            var equipmentsCrawler = $(element).find('td').eq(7).find('a');
            var equipments = [];

            equipmentsCrawler.each((index, equipment) => {
                equipments.push({
                    href: 'https://www.realmeye.com' + $(equipment).attr('href'),
                    name: $(equipment).find('span').attr('title'),
                });
            });

            var statsCrawler = $(element).find('td').eq(8);
            var keys = ['hp', 'mp', 'att', 'def', 'spd', 'vit', 'wis', 'dex'];
            var baseStatsArray = JSON.parse(statsCrawler.find('span').eq(0).attr('data-stats'));
            var baseStats = baseStatsArray.reduce((obj, value, index) => {
                obj[keys[index]] = value;
                return obj;
            }, {});
            
            this.playerGraveyard.push({
                died_on: moment($(element).find('td').eq(0).text()).format('YYYY-MM-DD HH:mm:ss'),
                class: $(element).find('td').eq(2).text(),
                level: $(element).find('td').eq(3).text(),
                base_fame: $(element).find('td').eq(4).text(),
                total_fame: $(element).find('td').eq(5).text(),
                exp: $(element).find('td').eq(6).text(),
                equipments: equipments,
                stats: statsCrawler.text().trim(),
                base_stats: baseStats,
                killed_by: $(element).find('td').eq(9).text(),
            });
        });
    }
}

module.exports = Rotmg;
