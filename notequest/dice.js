function roll(quantity, faces) {
    var rolls = [];
    var sum = 0;

    for(var i = 0; i < quantity; i++) {
        var rollResult = randomNumber(faces);
        sum += rollResult;

        rolls.push(rollResult);
    }

    return {
        "rolls": rolls,
        "total": sum
    };
}

function randomNumber(max) {
    max++;
    return Math.floor(Math.random() * (max - 1) + 1);
}

module.exports = {roll};