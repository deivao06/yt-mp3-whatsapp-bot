const adventurer_json = require('../../notequest/adventurer.json');

class Notequest {
    async adventurer(name = null) {
        var adventurer = {
            name: null,
            pv: 0,
            race: null,
            class: null,
            basic_spells: {},
        }
    
        if(name) {
            adventurer.name = name;
        } else {
            var randomName = await fetch("https://randomuser.me/api/")
                .then(function (response) {
                    return response.json();
                });
    
            adventurer.name = randomName.results[0].name.first + ' ' + randomName.results[0].name.last;
        }
    
        adventurer = this.getAdventurerRace(adventurer);
        adventurer = this.getAdventurerClass(adventurer);
    
        return adventurer;
    }

    getAdventurerRace(adventurer) {
        var raceDice = adventurer_json.races.dice.split("d");
        var raceRoll = this.roll(raceDice[0], raceDice[1]).total;
        var race = adventurer_json.races.data[raceRoll];
    
        adventurer.race = {
            'name': race.race,
            'advantage': race.advantage,
        }
        adventurer.pv += race.pv;
    
        return this.getAdventurerBasicSpells(adventurer, race.spells_quantity, true);
    }
    
    getAdventurerClass(adventurer) {
        var classDice = adventurer_json.classes.dice.split("d");
        var classRoll = this.roll(classDice[0], classDice[1]).total;
        var jsonClass = adventurer_json.classes.data[classRoll];
    
        adventurer.class = {
            'name': jsonClass.class,
            'advantage': jsonClass.advantage,
            'weapon': jsonClass.weapon
        }
        adventurer.pv += jsonClass.pv;
    
        return this.getAdventurerBasicSpells(adventurer, jsonClass.spells_quantity);
    }
    
    getAdventurerBasicSpells(adventurer, quantity, race = false) {
        for(var i = 0; i < quantity; i++) {
            var spellDice = adventurer_json.basic_spells.dice.split("d");
            var spellRoll = this.roll(spellDice[0], spellDice[1]).total;
    
            if(race && adventurer.race.name == 'Vagalóide') {
                spellRoll = 2; //Luz
            }
    
            if(race && adventurer.race.name == 'Meio-Dragão') {
                spellRoll = 6; //Bola de Fogo
            }
    
            if(spellRoll in adventurer.basic_spells) {
                adventurer.basic_spells[spellRoll].qtd += 1;
            } else {
                adventurer.basic_spells[spellRoll] = {
                    'name': adventurer_json.basic_spells.data[spellRoll].basic_spell,
                    'effect': adventurer_json.basic_spells.data[spellRoll].effect,
                    'qtd': 1
                }
            }
        }
    
        return adventurer;
    }

    roll(quantity, faces) {
        var rolls = [];
        var sum = 0;
    
        for(var i = 0; i < quantity; i++) {
            var rollResult = this.randomNumber(faces);
            sum += rollResult;
    
            rolls.push(rollResult);
        }
    
        return {
            "rolls": rolls,
            "total": sum
        };
    }
    
    randomNumber(max) {
        max++;
        return Math.floor(Math.random() * (max - 1) + 1);
    }
}

module.exports = Notequest;