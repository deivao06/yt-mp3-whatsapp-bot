const sqlite3 = require('sqlite3').verbose();

class RepetecosRepository {
    constructor() {
        this.table = 'repetecos';
    }

    connect() {
        this.db = new sqlite3.Database(`./database/bot.sqlite`, (err) => {
            if (err) {
              console.error(err.message);
            }
        });
    }

    async registerRepeteco(mentions, chat) {
        var mentionedContact = mentions[0];

        this.connect();

        this.db.all(`SELECT * FROM users WHERE contact_id = ?`, [mentionedContact.id.user], (err, rows) => {
            if (err) {
                throw err;
            }

            if(rows.length == 0) {
                this.db.run(`INSERT INTO users (contact_id) VALUES (?)`, [mentionedContact.id.user], function(err) {
                    if (err) {
                        throw err;
                    }
                });

                this.db.all(`SELECT id FROM users WHERE contact_id = ?`, [mentionedContact.id.user], function (err, rows) {
                    if (err) {
                        throw err;
                    }

                    if(rows.length > 0) {
                        var userId = rows[0].id;

                        this.db.run(`INSERT INTO ${this.table} (user_id) VALUES (?)`, [userId], function(err) {
                            if (err) {
                                throw err;
                            }
                        });

                        this.db.all(`SELECT * FROM ${this.table} WHERE user_id = ?`, [userId], async (err, rows) => {
                            await chat.sendMessage(`@${mentionedContact.id.user} ja enviou *${rows.length}* repetecos(s)`, {mentions: [mentionedContact]});
                        })
                    }
                });
            } else {
                var userId = rows[0].id;

                this.db.run(`INSERT INTO ${this.table} (user_id) VALUES (?)`, [userId], function(err) {
                    if (err) {
                        throw err;
                    }
                });

                this.db.all(`SELECT * FROM ${this.table} WHERE user_id = ?`, [userId], async (err, rows) => {
                    var s = "";
                    if(rows.length > 1) {
                        s = "s";
                    }

                    await chat.sendMessage(`@${mentionedContact.id.user} ja enviou *${rows.length}* repeteco${s}`, {mentions: [mentionedContact]});
                })
            }
        });

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

module.exports = { RepetecosRepository };