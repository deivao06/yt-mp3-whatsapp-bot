const axios = require("axios");
const cheerio = require('cheerio');

class Rotmg {
    constructor () {
        this.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
        };
    }

    async getGuildMembers(name) {
        const response = await axios.get("https://www.realmeye.com/guild/" + name, {
            headers: this.headers,
        })
            .catch(function (error) {
                return error.response
            });

        if (response.status == 200) {
            const html = response.data;
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
}

module.exports = Rotmg;
