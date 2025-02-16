const db = require('./connect_postgres')
const fs = require('fs');

async function executeSqlFile(filePath) {
    try {
        const sql = fs.readFileSync(filePath, 'utf8');
        // Important: Handle potential multiple statements in the file
        const statements = sql.split(';'); // Split by semicolon
        db.connect((err, client) => {  // Get client via callback
            if (err) {
                console.error('Error connecting to database:', err);
                throw err; // Important: Stop here if connection fails
            }
            for (const statement of statements) {
                const trimmedStatement = statement.trim();
                if (trimmedStatement) { // Skip empty statements
                    client.query(trimmedStatement, (err, res) => {
                        if (err) {
                            console.error(err);
                            client.release();
                            throw err; // Important: Stop further execution in case of error
                        }
                        console.log(`Executed statement: ${trimmedStatement.slice(0, 50)}...`); // Log a snippet
                    });
                }
            }
            client.release();
        });
    } catch (err) {
        console.error(`Error executing SQL file: ${filePath}`, err);
        console.log(err)
        throw err
    }
}

async function initializeSchema() {
    try {
        await executeSqlFile('./postgres_db/subscriber.sql');
    } catch (err) {
        console.log(err)
    }
}

module.exports = { initializeSchema }

