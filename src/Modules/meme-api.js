const axios = require('axios');

class Meme {
    constructor() {
        this.url = "https://meme-api.com/gimme";
    }

    async getMeme() {
        var response = await axios.get(this.url);
        return response.data.url;
    }
}

module.exports = Meme;