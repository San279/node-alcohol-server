const { Router } = require("express");
const router = Router();
const user = require("../models/users")
const verifyToken = require("../routes/auth");
//const usrToken = require("../routes/auth");

const jwt = require('jsonwebtoken');

const db = require('../connect_postgres');
const utils = require('./uti')
router.post("/register", async (req, res) => {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        console.log('Object missing');
        res.status(500).json(err);
    }

    let stringify = JSON.stringify(req.body)
    let userRes = user
    userRes = JSON.parse(stringify)

    let colStmt = utils.genStmtCol(userRes)
    let placeStmt = utils.genStmtPlaceHolder(userRes)
    let valArr = utils.genStmtArr(userRes);

    insertStmt = "INSERT INTO users(" + colStmt + ") VALUES(" + placeStmt + ")";
    db.connect((err, client) => {  // Get client via callback
        if (err) {
            console.log(err)
            res.status(501).json({ error: err.message })
            return
        }
        client.query(insertStmt, valArr, (err, queryRes) => {
            if (err) {
                console.error(err);
                res.status(401).json({ error: err.message })
                client.release();
                return
            }
            res.status(200).json(userRes);
            client.release();
        });
    });
})

router.post("/login", async (req, res) => {
    let query = {
        text: ``,
        values: []
    }
    try {
        let stringify = JSON.stringify(req.body);
        let userRes = user;
        userRes = JSON.parse(stringify);
        query.text = `SELECT * FROM users WHERE userName = $1 and password = $2`
        query.values = [userRes.userName, userRes.passWord]
    } catch (err) {
        return res.status(401).json({ error: err })
    }
    db.connect((err, client) => {  // Get client via callback
        if (err) {
            console.log(err)
            res.status(501).json({ error: err.message })
            return
        }
        client.query(query.text, query.values, (err, queryRes) => {
            if (err) {
                console.error(err);
                client.release();
                return res.status(401).json({ error: err.message })
            }
            if (queryRes.rows.length) {
                const accessToken = jwt.sign({
                    userId: queryRes.rows[0].userid,
                    userName:queryRes.rows[0].username,
                    name: queryRes.rows[0].name, 
                    priv: queryRes.rows[0].priv,
                }, 
                    process.env.JWT_SECRET,
                    {expiresIn: "20d"}
                );
                console.log(accessToken);
                res.status(200).json({accessToken});
            } else {
                res.status(401).json({ error: "Wrong Username or/and Password" });
            }
            client.release();
        });
    });
})

router.post("/getById", async (req, res) => {
    let query = {
        text: ``,
        values: []
    }
    try {
        const { userUUID } = req.body;
        query.text = `SELECT name, userUUID, userName, password, gId, createOn 
        FROM users WHERE userUUID = ANY($1::uuid[])`;
        query.values = [userUUID]
    } catch (err) {
        return res.status(401).json({ error: err })
    }
    db.connect((err, client) => {
        if (err) {
            console.log(err)
            res.status(501).json({ error: err.message })
            return
        }
        client.query(query.text, query.values, (err, queryRes) => {
            if (err) {
                console.error(err);
                client.release();
                return res.status(401).json({ error: err.message })
            }
            if (queryRes.rows.length) {
                res.status(200).json(queryRes.rows);
            } else {
                res.status(401).json({ error: "No user found" });
            }
            client.release();
        });
    });
})

router.post("/addUserCompany", async (req, res) => {
    let query = {
        text: ``,
        values: []
    }
    try {
        const { userUUID, companyUUID } = req.body;
        query.text = `
          WITH user_info AS (
            SELECT userId AS user_id 
            FROM users 
            WHERE userUUID = $1::uuid
          ),
          company_info AS (
            SELECT companyId AS company_id 
            FROM company 
            WHERE companyUUID = $2::uuid
          )
          INSERT INTO users_company (userId, companyId)
          SELECT user_id, company_id
          FROM user_info, company_info;
        `,
            query.values = [userUUID, companyUUID]
    } catch (err) {
        res.status(401).json({ error: err });
        return
    }
    db.connect((err, client) => {
        if (err) {
            console.error("Error connecting:", err);
            return res.status(500).json({ error: err.message });
        }

        client.query(query, query.values, (err, queryRes) => {
            if (err) {
                console.error("Error inserting:", err);
                client.release();
                return res.status(400).json({ error: err.message });
            }
            if (queryRes.rowCount > 0) {
                res.status(200).json({ message: `${queryRes.rowCount} user-department associations created` });
            } else {
                res.status(404).json({ error: "User or Departments not found" });
            }
            client.release();
        });
    });
})

router.post("/addUserDep", async (req, res) => {
    let query = {
        text: ``,
        values: []
    }
    try {
        const { userUUID, departmentUUID } = req.body
        query.text = `WITH user_info AS (
            SELECT userId AS user_id
            FROM users
            WHERE userUUID = $1::uuid
        ),
        department_info AS (
            SELECT departmentId AS department_id, departmentUUID
            FROM department
            WHERE departmentUUID = $2::uuid
        )
        INSERT INTO users_department (userId, departmentId)
        SELECT user_id, department_id
        FROM user_info, department_info;
        `
        query.values = [userUUID, departmentUUID]
    } catch (err) {
        return res.status(401).json({ error: err })
    }
    db.connect((err, client) => {
        if (err) {
            console.error("Error connecting:", err);
            return res.status(500).json({ error: err.message });
        }
        client.query(query.text, query.values, (err, queryRes) => {
            if (err) {
                console.error("Error inserting:", err);
                client.release();
                return res.status(400).json({ error: err.message });
            }

            if (queryRes.rowCount > 0) {
                res.status(200).json({ message: `${queryRes.rowCount} user-department associations created` });
            } else {
                res.status(204).json({ error: "User or Departments not found" });
            }
            client.release();
        });
    });
})

router.post("/addUserEquip", async (req, res) => {
    let query = {
        text: ``,
        values: []
    }
    try {
        const { userUUID, equipmentUUID } = req.body;
        query.text = `WITH user_info AS (
                SELECT userId
                FROM users
                WHERE userUUID = $1::uuid
            ),
            equip_info AS (
                SELECT equipmentId, equipmentModel
                FROM equipment
                WHERE equipmentUUID = $2::uuid
            )
            INSERT INTO users_equipment (userId, equipmentId, equipmentModel)
            SELECT userId, equipmentId, equipmentModel
            FROM user_info, equip_info`;
        query.values = [userUUID, equipmentUUID]
    } catch (err) {
        return res.status(401).json({ error: err })
    }
    db.connect((err, client) => {
        if (err) {
            console.log(err)
            res.status(501).json({ error: err.message })
            return
        }
        client.query(query.text, query.values, (err, queryRes) => {
            if (err) {
                console.error("Error inserting:", err);
                client.release();
                return res.status(400).json({ error: err.message });
            }

            if (queryRes.rowCount > 0) {
                res.status(200).json({ message: `${queryRes.rowCount} user-equipment associations created` });
            } else {
                res.status(401).json({ error: "User or Departments not found" });
            }
            client.release();
        });
    });
})

router.get("/getAll", verifyToken, async (req, res) => {
    console.log(req.user);
    let query = {
        text:``,
        values:[]
    }
    if (req.user.priv == 'admin'){
        query.text = `SELECT u.name, u.userUUID, u.userName, u.gId, u.createOn 
        FROM users u
        JOIN users_company uc ON u.userId = uc.userId`
    }else if (req.user.priv == "super"){
        query.text = `SELECT name, userUUID, userName, gId, createOn 
        FROM users`;
    }else{
        query.text = `SELECT name, userUUID, userName, gId, createOn 
        FROM users WHERE userId = $1`
        query.values = [req.user.userId]
    }
    console.log(query);
    db.connect((err, client) => {
        if (err) {
            console.log(err)
            res.status(501).json({ error: err.message })
            return
        }
        client.query(query.text, query.values, (err, queryRes) => {
            if (err) {
                console.error(err);
                client.release();
                return res.status(401).json({ error: err.message })
            }
            if (queryRes.rows.length) {
                res.status(200).json(queryRes.rows);
            } else {
                res.status(401).json({ error: "Acess denied" });
            }
            client.release();
        });
    });
})


router.delete("/delete", async (req, res) => {
    let query = {
        text: [],
        values: []
    }
    try{
        const { userUUID } = req.body;
        query.text = [
            `DELETE FROM users_equipment WHERE userId IN (SELECT userId FROM users WHERE userUUID = ANY($1::uuid[]));`,
            `DELETE FROM users_department WHERE userId IN (SELECT userId FROM users WHERE userUUID = ANY($1::uuid[]));`,
            `DELETE FROM users_company WHERE userId IN (SELECT userId FROM users WHERE userUUID = ANY($1::uuid[]));`,
            `DELETE FROM users WHERE userUUID = ANY($1::uuid[]);`
        ];
        query.values = [userUUID];
    }catch(err){
        return res.status(401).json({error : err})
    }
    db.connect((err, client) => {  // Get client via callback
        if (err) {
            console.log(err);
            client.release();
            return res.status(501).json({ error: err.message })
            
        }
        const executeQueries = async () => {
            try {
                for (const sql of query.text) {
                    await client.query(sql, query.values);
                }
                client.release();
                res.status(200).json({ status: "rows deleted successfully" });
            } catch (queryErr) {
                console.error(queryErr);
                client.release();
                res.status(401).json({ error: queryErr.message });
            }
        };
        executeQueries();
    });
})

router.put("/edit", async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0 || !req.body.users) {
        console.log('Object missing');
        res.status(500).json("No json body found");
    }
    const { users } = req.body;
    const query = {
        text: `
           UPDATE users
                SET name = $2, gId = $3, userName = $4, passWord = $5
                WHERE userUUID = $1;
        `,
        values: [users.userUUID, users.name, users.gId, users.userName, users.passWord]
    };

    db.connect((err, client) => {
        if (err) {
            console.log(err)
            res.status(501).json({ error: err.message })
            return
        }
        client.query(query.text, query.values, (err, queryRes) => {
            if (err) {
                console.error(err);
                res.status(401).json({ error: err.message })
                client.release();
                return
            }
            res.status(200).json({ message: `${queryRes.rowCount} user equipment acc created` });
            client.release();
        });
    });
})





module.exports = router;
