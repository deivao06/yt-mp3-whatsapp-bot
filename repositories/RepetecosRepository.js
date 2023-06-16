const { UsersRepository } = require('./UsersRepository');

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

class RepetecosRepository {
    constructor() {
        this.table = 'repetecos';
        this.usersRepository = new UsersRepository();
    }

    async connect() {
        this.db = await open({
            filename: `./database/bot.sqlite`,
            driver: sqlite3.Database
        })
    }

    async registerRepeteco(mentionedContact) {
        await this.connect();

        var user = await this.usersRepository.getUserByContactId(mentionedContact.id.user);

        if(!user) {
            await this.db.run(`INSERT INTO users (contact_id) VALUES (?)`, [mentionedContact.id.user]);
            user = await this.usersRepository.getUserByContactId(mentionedContact.id.user);
        }

        await this.db.run(`INSERT INTO ${this.table} (user_id) VALUES (?)`, [user.id]);

        var repetecos = await this.db.all(`SELECT * FROM ${this.table} WHERE user_id = ?`, [user.id]);

        await this.close();

        return repetecos.length;
    }

    async close() {
        await this.db.close();
    }
}

module.exports = { RepetecosRepository };