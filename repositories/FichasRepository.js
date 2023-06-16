const { UsersRepository } = require('./UsersRepository');

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

class FichasRepository {
    constructor() {
        this.table = 'fichas';
        this.usersRepository = new UsersRepository();
    }

    async connect() {
        this.db = await open({
            filename: `./database/bot.sqlite`,
            driver: sqlite3.Database
        })
    }

    async getFicha(mentionedContact) {
        var user = await this.usersRepository.getUserByContactId(mentionedContact.id.user);

        await this.connect();

        var ficha = await this.db.get(`SELECT * FROM ${this.table} WHERE user_id = ?`, [user.id]);

        await this.close();

        if(ficha){
            return ficha;
        } else {
            return false;
        }
    }

    async createOrUpdateFicha(fichaData, mentionedContact)
    {
        await this.connect();

        var user = await this.usersRepository.getUserByContactId(mentionedContact.id.user);

        if(!user) {
            await this.db.run(`INSERT INTO users (contact_id) VALUES (?)`, [mentionedContact.id.user]);
            user = await this.usersRepository.getUserByContactId(mentionedContact.id.user);
        }

        var fichaUser = await this.db.get(`SELECT * FROM ${this.table} WHERE user_id = ?`, [user.id]);

        if(fichaUser) {
            await this.db.run(`UPDATE ${this.table} SET
                class = ?, 
                alignment = ?, 
                strength = ?, 
                dexterity = ?, 
                constitution = ?, 
                intelligence = ?, 
                wisdom = ?, 
                charism = ?
                WHERE id = ?`, 
                [ 
                    fichaData.class, 
                    fichaData.align, 
                    fichaData.str, 
                    fichaData.dex, 
                    fichaData.con, 
                    fichaData.int,
                    fichaData.wis,
                    fichaData.cha,
                    fichaUser.id
                ]
            );
        } else {
            await this.db.run(`INSERT INTO ${this.table} (
                user_id, 
                class, 
                alignment, 
                strength, 
                dexterity, 
                constitution, 
                intelligence, 
                wisdom, 
                charism
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                [
                    user.id, 
                    fichaData.class, 
                    fichaData.align, 
                    fichaData.str, 
                    fichaData.dex, 
                    fichaData.con, 
                    fichaData.int,
                    fichaData.wis,
                    fichaData.cha
                ]
            );
        }

        const ficha = await this.db.get(`SELECT * FROM ${this.table} WHERE user_id = ?`, [user.id]);

        await this.close();

        if(ficha) {
            return ficha;
        } else {
            return false;
        }
    }

    async close() {
        await this.db.close();
    }
}

module.exports = { FichasRepository };