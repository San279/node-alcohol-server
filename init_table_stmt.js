const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/main/mock_alc.sqlite3');

const logTable = "CREATE TABLE IF NOT EXISTS equipment_logs (logId VARCHAR(255) PRIMARY KEY, gID VARCHAR(255), checkSerialNumber VARCHAR(255), name VARCHAR(255) ,deptName VARCHAR(255), equipmentModel VARCHAR(255), checkDate VARCHAR(255), checkResult VARCHAR(255), alcoholStrength VARCHAR(255), authentication VARCHAR(255), iPAdress VARCHAR(255), createdOn VARCHAR(255) )"

const depTable = "CREATE TABLE IF NOT EXISTS departments( depId VARCHAR(255) PRIMARY KEY, depName VARCHAR(255), createdOn VARCHAR(255) )"

const equipmentTable = "CREATE TABLE IF NOT EXISTS equipments( equipId VARCHAR(255) PRIMARY KEY,equipmentModel VARCHAR(255), depName VARCHAR(255), createdOn VARCHAR(255) )"

const userTable = "CREATE TABLE IF NOT EXISTS users( userId VARCHAR(255) PRIMARY KEY, userName VARCHAR(255) UNIQUE ,password VARCHAR(255), priv VARCHAR(255), name VARCHAR(255), createdOn VARCHAR(255) )"

const userDepTable = "CREATE TABLE IF NOT EXISTS user_dep( userDepId VARCHAR(255) PRIMARY KEY, userId VARCHAR(255), depId VARCHAR(255), equipId VARCHAR(255), equipmentModel VARCHAR(255), name VARCHAR(255), createdOn VARCHAR(255), FOREIGN KEY(userId) REFERENCES users(userId), FOREIGN KEY(depId) REFERENCES departments(depId), FOREIGN KEY(equipId) REFERENCES equipmentTable(equipId), FOREIGN KEY(equipmentModel) REFERENCES equipmentTable(equipmentModel), FOREIGN KEY(name) REFERENCES users(name))"

const userEquipTable = "CREATE TABLE IF NOT EXISTS user_equipment( userEquipId VARCHAR(255) PRIMARY KEY, userId VARCHAR(255), equipId VARCHAR(255), equipmentModel VARCHAR(255), depId VARCHAR(255), name VARCHAR(255), createdOn VARCHAR(255), FOREIGN KEY(userId) REFERENCES users(userId), FOREIGN KEY(depId) REFERENCES departments(depId), FOREIGN KEY(equipId) REFERENCES equipmentTable(equipId), FOREIGN KEY(equipmentModel) REFERENCES equipmentTable(equipmentModel), FOREIGN KEY(name) REFERENCES users(name))"



module.exports = {logTable, depTable, equipmentTable, userTable, userDepTable, userEquipTable}

