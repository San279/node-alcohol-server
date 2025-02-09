const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/main/mock_alc.sqlite3', sqlite3.OPEN_READWRITE, connected);

function connected(err) {
    if (err) {
        console.log(err.message)
        return
    }

    console.log("sqlite connected")
}

module.exports = db