const sqlite3 = require('sqlite3').verbose();

class UsersRepository {
    constructor() {
        this.table = 'users';
    }

    connect() {
        this.db = new sqlite3.Database(`./database/bot.sqlite`, (err) => {
            if (err) {
              console.error(err.message);
            }
        });
    }

    async registerUsers(chatParticipants, client, callback) {
        this.connect();

        for(var participant of chatParticipants) {
            const chatContact = await client.getContactById(participant.id._serialized);
    
            this.db.all(`SELECT * FROM ${this.table} WHERE contact_id = ?`, [chatContact.id.user], (err, rows) => {
                if (err) {
                    callback({error: true, message: err})
                    return;
                }
    
                if(rows.length == 0) {
                    this.db.run(`INSERT INTO ${this.table} (contact_id) VALUES (?)`, [chatContact.id.user], function(err) {
                        if (err) {
                            callback({error: true, message: err});
                            return;
                        }
                    });
                }
            });
        }

        callback({error: false, message: "Todos os contatos deste grupo foram cadastrados com sucesso"})

        this.close();
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }
}

module.exports = { UsersRepository };