class FichaRepository {
    constructor() {
        this.db = new sqlite3.Database(`./database/bot.db`, (err) => {
            if (err) {
              console.error(err.message);
            }
        });
    }
}

module.exports = { FichaRepository };