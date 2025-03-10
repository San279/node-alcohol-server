
CREATE TABLE IF NOT EXISTS company(
    companyId SERIAL PRIMARY KEY,
    companyUUID UUID DEFAULT gen_random_uuid() UNIQUE,
    companyName VARCHAR(255) UNIQUE,
    createOn TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS department(
    departmentId SERIAL PRIMARY KEY,
    departmentUUID UUID DEFAULT gen_random_uuid() UNIQUE,
    departmentName VARCHAR(255),
    companyId INTEGER REFERENCES company(companyId),
    lowAlcLvl INTEGER,
    medAlcLvl INTEGER,
    highAlcLvl INTEGER,
    createOn TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (departmentName, companyId)
);

CREATE TABLE IF NOT EXISTS users(
    userId SERIAL PRIMARY KEY,
    userUUID UUID DEFAULT gen_random_uuid() UNIQUE,
    userName VARCHAR(255) UNIQUE,
    passWord VARCHAR(255),
    priv VARCHAR(255),
    name VARCHAR(255),
    gId VARCHAR(255),
    taxId VARCHAR(255),
    email VARCHAR(255),
    createOn TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users_company(
    userCompanyId SERIAL PRIMARY KEY,
    userCompanyUUID UUID DEFAULT gen_random_uuid() UNIQUE,
    userId INTEGER REFERENCES users(userId),
    companyId INTEGER REFERENCES company(companyId),
    createOn TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (userId, companyId)
);

CREATE TABLE IF NOT EXISTS users_department(
    userDepartmentId SERIAL PRIMARY KEY,
    userDepartmentUUID UUID DEFAULT gen_random_uuid() UNIQUE,
    userId INTEGER REFERENCES users(userId),
    departmentId INTEGER REFERENCES department(departmentId),
    createOn TIMESTAMP WITHOUT TIME ZONE,
    UNIQUE (userId, departmentId)
);


CREATE TABLE IF NOT EXISTS equipment(
    equipmentId SERIAL PRIMARY KEY,
    equipmentUUID UUID DEFAULT gen_random_uuid() UNIQUE,
    equipmentModel VARCHAR(255) UNIQUE,
    departmentId INTEGER REFERENCES department(departmentId),
    companyId INTEGER REFERENCES company(companyId),
    createOn TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users_equipment(
    userEquipId SERIAL PRIMARY KEY,
    userEquipUUID UUID DEFAULT gen_random_uuid() UNIQUE,
    userId INTEGER REFERENCES users(userId),
    equipmentId INTEGER REFERENCES equipment(equipmentId),
    equipmentModel VARCHAR(255) REFERENCES equipment(equipmentModel),
    createOn TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (equipmentId, userId)
);

CREATE TABLE IF NOT EXISTS equipment_log(
    logId SERIAL PRIMARY KEY,
    logUUID UUID DEFAULT gen_random_uuid() UNIQUE,
    gID VARCHAR(255),
    checkSerialNumber VARCHAR(255),
    name VARCHAR(255),
    deptName VARCHAR(255),
    equipmentModel VARCHAR(255),
    checkDate VARCHAR(255),
    checkResult VARCHAR(255),
    alcoholStrength VARCHAR(255),
    authentication VARCHAR(255),
    faceFeature TEXT,
    ipAdress VARCHAR(255),
    createOn TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (equipmentModel, checkSerialNumber, checkDate)
);

INSERT INTO users (username, passWord, priv, name, gID)
VALUES ('super', 'super', 'super', 'super admin', '')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (username, passWord, priv, name, gID)
VALUES ('admin', 'admin', 'admin', 'admin', '')
ON CONFLICT (username) DO NOTHING;
