const axios = require('axios');

class Waifu {
    constructor() {
        this.url = "https://api.waifu.im/search";
    }

    async getWaifu(nsfw = false) {
        if(nsfw == 'nsfw') 
            this.url = `${this.url}/?is_nsfw=true`;
    
        var response = await axios.get(this.url);
        return response.data.images[0].url;
    }
}

module.exports = Waifu;