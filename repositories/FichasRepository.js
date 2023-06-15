const sqlite3 = require('sqlite3').verbose();

class FichasRepository {
    constructor() {
        this.table = 'fichas';
    }

    connect() {
        this.db = new sqlite3.Database(`./database/bot.sqlite`, (err) => {
            if (err) {
              console.error(err.message);
            }
        });
    }

    async getFicha(mentionedContact, callback) {
        this.connect();

        this.db.all(`SELECT * FROM ${this.table} WHERE user_id = ?`, [mentionedContact.id.user], async (err, rows) => {
            if(err) {
                callback({error: true, message: err});
            }

            if(rows.length > 0) {
                callback({error:false, message: "Ficha encontrada", ficha: rows[0]});
                return;
            } else {
                callback({error: true, message: "Nenhuma ficha criada para este contato"});
                return;
            }
            
        })

        this.close();
    }

    async createFicha(ficha, mentionedContact, callback)
    {
        this.connect();

        this.db.all(`SELECT * FROM users WHERE contact_id = ?`, [mentionedContact.id.user], (err, rows) => {
            if (err) {
                callback({error: true, message: err});
                return;
            }

            if(rows.length == 0) {
                this.db.run(`INSERT INTO users (contact_id) VALUES (?)`, [mentionedContact.id.user], function(err) {
                    if (err) {
                        callback({error: true, message: err});
                        return;
                    }
                });

                this.db.all(`SELECT id FROM users WHERE contact_id = ?`, [mentionedContact.id.user], function (err, rows) {
                    if (err) {
                        callback({error: true, message: err});
                        return;
                    }

                    if(rows.length > 0) {
                        var userId = rows[0].id;

                        this.db.run(`INSERT INTO ${this.table} (
                            user_id, 
                            class, 
                            alignment, 
                            strenght, 
                            dexterity, 
                            constitution, 
                            intelligence, 
                            wisdom, 
                            charism
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                                userId, 
                                ficha.class, 
                                ficha.align, 
                                ficha.str, 
                                ficha.dex, 
                                ficha.con, 
                                ficha.int,
                                ficha.wis,
                                ficha.cha
                            ], function(err) {
                            if (err) {
                                callback({error: true, message: err});
                                return;
                            }
                        });

                        this.db.all(`SELECT * FROM ${this.table} WHERE user_id = ?`, [userId], async (err, rows) => {
                            callback({error:false, message: "Ficha criada com sucesso", ficha: rows[0]});
                            return;
                        })
                    }
                });
            } else {
                var userId = rows[0].id;

                this.db.run(`INSERT INTO ${this.table} (
                    user_id, 
                    class, 
                    alignment, 
                    strenght, 
                    dexterity, 
                    constitution, 
                    intelligence, 
                    wisdom, 
                    charism
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                        userId, 
                        ficha.class, 
                        ficha.align, 
                        ficha.str, 
                        ficha.dex, 
                        ficha.con, 
                        ficha.int,
                        ficha.wis,
                        ficha.cha
                    ], function(err) {
                    if (err) {
                        callback({error: true, message: err});
                        return;
                    }
                });

                this.db.all(`SELECT * FROM ${this.table} WHERE user_id = ?`, [userId], async (err, rows) => {
                    callback({error:false, message: "Ficha criada com sucesso", ficha: rows[0]});
                    return;
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

module.exports = { FichasRepository };