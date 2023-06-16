const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

class UsersRepository {
    constructor() {
        this.table = 'users';
    }

    async connect() {
        this.db = await open({
            filename: `./database/bot.sqlite`,
            driver: sqlite3.Database
        })
    }

    async getUserByContactId(contactId) {
        await this.connect();

        const user = await this.db.get(`SELECT * FROM ${this.table} WHERE contact_id = ?`, [contactId]);

        await this.close();

        if(user) {
            return user;
        } else {
            return false;
        }
    }

    async registerUsers(chatParticipants, client) {
        await this.connect();

        for(var participant of chatParticipants) {
            const chatContact = await client.getContactById(participant.id._serialized);
    
            var user = await this.db.get(`SELECT * FROM ${this.table} WHERE contact_id = ?`, [chatContact.id.user]);

            if(!user) {
                await this.db.run(`INSERT INTO ${this.table} (contact_id) VALUES (?)`, [chatContact.id.user]);
            }
        }

        await this.close();

        return true;
    }

    async close() {
        await this.db.close();
    }
}

module.exports = { UsersRepository };