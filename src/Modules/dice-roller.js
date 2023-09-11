const axios = require('axios');

class DiceRoller {
    async roll(dices) {
        const regex = new RegExp('[0-9][d][0-9]');

        if(!regex.test(dices)) {
            return "Escreve direto, exemplo: 2d6 (2 dados de 6 lados)";
        }

        dices = dices.split("d");

        var diceQtd = dices[0];
        var diceType = dices[1];
        
        if(diceQtd <= 0 || diceType <= 0) {
            return "Escreve direto, não existe dado 0";
        }

        var response = await axios.get(`https://www.dejete.com/api?nbde=${diceQtd}&tpde=${diceType}`);
    
        var result = "Resultado: (";
        var sum = 0;
    
        response.data.forEach((dice, key) => {
            if(key == response.data.length - 1) {
                result += `${dice.value})`
            } else {
                result += `${dice.value} + `
            }
    
            sum += dice.value;
        })
    
        result += ` = ${sum}`;
        
        return result;
    }
}

module.exports = DiceRoller;