const sqlite3 = require('sqlite3').verbose();

const DBSOURCE = "db.sqlite";

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            chairId INTEGER,
            startTime INTEGER,
            endTime INTEGER,
            duration INTEGER
        )`, (err) => {
            if (err) {
                // Table already created
                console.log('Sessions table already exists.');
            } else {
                console.log('Sessions table created.');
            }
        });
    }
});

module.exports = db;
