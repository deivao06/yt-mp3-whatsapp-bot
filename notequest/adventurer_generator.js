const { roll } = require("./dice.js");
const adventurer_json = require('./adventurer.json');

async function adventurer(name = null) {
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

    adventurer = getAdventurerRace(adventurer);
    adventurer = getAdventurerClass(adventurer);

    return adventurer;
}

function getAdventurerRace(adventurer) {
    var raceDice = adventurer_json.races.dice.split("d");
    var raceRoll = roll(raceDice[0], raceDice[1]).total;
    var race = adventurer_json.races.data[raceRoll];

    adventurer.race = {
        'name': race.race,
        'advantage': race.advantage,
    }
    adventurer.pv += race.pv;

    return getAdventurerBasicSpells(adventurer, race.spells_quantity, true);
}

function getAdventurerClass(adventurer) {
    var classDice = adventurer_json.classes.dice.split("d");
    var classRoll = roll(classDice[0], classDice[1]).total;
    var jsonClass = adventurer_json.classes.data[classRoll];

    adventurer.class = {
        'name': jsonClass.class,
        'advantage': jsonClass.advantage,
        'weapon': jsonClass.weapon
    }
    adventurer.pv += jsonClass.pv;

    return getAdventurerBasicSpells(adventurer, jsonClass.spells_quantity);
}

function getAdventurerBasicSpells(adventurer, quantity, race = false) {
    for(var i = 0; i < quantity; i++) {
        var spellDice = adventurer_json.basic_spells.dice.split("d");
        var spellRoll = roll(spellDice[0], spellDice[1]).total;

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

module.exports = {adventurer}