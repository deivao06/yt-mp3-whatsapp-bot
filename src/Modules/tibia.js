const axios = require('axios');

class Tibia {
    constructor() {
        this.api_url = 'https://api.expto.com.br'
    }

    async getPlayerByName(name) {
        const { data } = await axios.get(`${this.api_url}/player?name=${name}`);
        return data;
    }
}

module.exports = Tibia;