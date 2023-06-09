DROP TABLE IF EXISTS repetecos;

CREATE TABLE repetecos (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);