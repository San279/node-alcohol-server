const { Router } = require("express");
const router = Router();
const user = require("../models/users")

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
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        console.log('Object missing');
        res.status(500).json("object not found");
        return
    }
    let stringify = JSON.stringify(req.body);
    let userRes = user;
    userRes = JSON.parse(stringify);
    selectStmt = "SELECT * FROM users WHERE userName = $1 and password = $2"
    db.connect((err, client) => {  // Get client via callback
        if (err) {
            console.log(err)
            res.status(501).json({ error: err.message })
            return
        }
        client.query(selectStmt, [userRes.userName, userRes.passWord], (err, queryRes) => {
            if (err) {
                console.error(err);
                res.status(401).json({ error: err.message })
                client.release();
                return
            }
            if (queryRes.rows.length) {
                res.status(200).json(queryRes.rows[0]);
            } else {
                res.status(401).json({ error: "Wrong Username or/and Password" });
            }
            client.release();
        });
    });
})


router.post("/addUserCompany/:userId/:companyId", utils.requireParams(["userId"], ["companyId"]), async (req, res) => {
    const { userId, companyId } = req.params;
    console.log(req.params);
    const query = {
        text: `
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
        values: [userId, companyId]
    };
    db.connect((err, client) => {  // Get client via callback
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
            res.status(200).json("Values Inserted");
            client.release();
        });
    });
})

router.post("/addUserDep/:id", utils.requireParams(["id"]), async (req, res) => {
    const userUUID = req.params.id; // Get userUUID from params
    const { departmentUUIDs } = req.body;

    if (!departmentUUIDs || !Array.isArray(departmentUUIDs) || departmentUUIDs.length === 0) {
        return res.status(400).json({ error: "Missing or invalid request body" });
    }

    const insertStmt = `
        WITH user_info AS (
            SELECT userId AS user_id
            FROM users
            WHERE userUUID = $1::uuid
        ),
        department_info AS (
            SELECT departmentId AS department_id, departmentUUID
            FROM department
            WHERE departmentUUID = ANY($2::uuid[])
        )
        INSERT INTO users_department (userId, departmentId)
        SELECT user_id, department_id
        FROM user_info, department_info;
    `;

    db.connect((err, client) => {
        if (err) {
            console.error("Error connecting:", err);
            return res.status(500).json({ error: err.message });
        }

        client.query(insertStmt, [userUUID, departmentUUIDs], (err, queryRes) => {
            if (err) {
                console.error("Error inserting:", err);
                res.status(400).json({ error: err.message });
                client.release();
                return;
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

router.post("/addUserEquip/:userId", utils.requireParams(["userId"]), async (req, res) => {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        console.log('Object missing');
        res.status(500).json("No json body found");
    }
    const userUUID = req.params.userId; // Get userUUID from params
    const { equipmentUUID } = req.body;
    console.log(equipmentUUID);

    const query = {
        text: `
            WITH user_info AS (
                SELECT userId
                FROM users
                WHERE userUUID = $1::uuid
            ),
            equip_info AS (
                SELECT equipmentId, equipmentModel
                FROM equipment
                WHERE equipmentUUID = ANY($2::uuid[])
            )
            INSERT INTO users_equipment (userId, equipmentId, equipmentModel)
            SELECT userId, equipmentId, equipmentModel
            FROM user_info, equip_info
        `,
        values: [userUUID, equipmentUUID]
    };
    console.log(query.values)
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
