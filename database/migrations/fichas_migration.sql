DROP TABLE IF EXISTS fichas;

CREATE TABLE fichas (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    class TEXT NOT NULL,
    alignment TEXT NOT NULL,
    strenght INTEGER DEFAULT 1,
    dexterity INTEGER DEFAULT 1,
    constitution INTEGER DEFAULT 1,
    intelligence INTEGER DEFAULT 1,
    wisdom INTEGER DEFAULT 1,
    charism INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);