const axios = require('axios');

class MonsterHunterWorldApi {
    constructor() {
        this.url = "https://mhw-db.com";
    }

    async getMonster(monster) {
        var response = await axios.get(`${this.url}/monsters?q={"name": "${monster}"}`);
        
        if(response.data.length > 0) {
            return {
                error: false,
                data: response.data[0]
            }
        } else {
            return {
                error: true,
                message: "Nenhum monstro encontrado."
            }
        }
    }
}

module.exports = MonsterHunterWorldApi;