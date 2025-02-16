const { Router } = require("express");
const router = Router();

const department = require('../models/department')
const db = require('../connect_postgres');
const utils = require('./uti')

//need security
router.post("/create/:companyId", utils.requireParams(["companyId"]), async (req, res) => {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        console.log('Object missing');
        res.status(500).json("No json data found");
    }
    const companyUUID = req.params.companyId
    const { departmentName } = req.body;
    const query = {
        text: `
            WITH company_info AS (
                SELECT companyId AS company_id
                FROM company
                WHERE companyUUID = $2::uuid
            )
            INSERT INTO department (departmentName, companyId)
            SELECT department_name, company_id
            FROM UNNEST($1::text[]) AS department_name, company_info;
        `,
        values: [departmentName, companyUUID]
    };

    console.log(query.text, query.values)
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
            res.status(200).json({ message: `${queryRes.rowCount} deparments created` });
            client.release();
        });
    });
})


router.get("/getById/:id", utils.requireParams(["id"]), async (req, res) => {
    const id = req.params.id;
    const selectStmt = "SELECT * FROM department WHERE departmentUUID = $1";
    db.connect((err, client) => {  // Get client via callback
        if (err) {
            console.log(err)
            res.status(501).json({ error: err.message })
            return
        }
        client.query(selectStmt, [id], (err, queryRes) => {
            if (err) {
                console.error(err);
                res.status(401).json({ error: err.message })
                client.release();
                return
            }
            if (queryRes.rows.length) {
                res.status(200).json(queryRes.rows);
            } else {
                res.status(401).json({ error: "No company found" });
            }
            client.release();
        });
    });
})

router.get("/getByCompanyId/:id", utils.requireParams(["id"]), async (req, res) => {
    const id = req.params.id;
    const selectStmt = `
    SELECT d.*
    FROM company c
    JOIN department d ON c.companyId = d.companyId
    WHERE c.companyUUID = $1::uuid;
    `;
    db.connect((err, client) => {  // Get client via callback
        if (err) {
            console.log(err)
            res.status(501).json({ error: err.message })
            return
        }
        client.query(selectStmt, [id], (err, queryRes) => {
            if (err) {
                console.error(err);
                res.status(401).json({ error: err.message })
                client.release();
                return
            }
            if (queryRes.rows.length) {
                res.status(200).json(queryRes.rows);
            } else {
                res.status(401).json({ error: "No Deparment found" });
            }
        });
    });
})

router.get("/getByUserId/:id", utils.requireParams(["id"]), async (req, res) => {
    const id = req.params.id;
    const selectStmt = `
    SELECT d.*
    FROM users u
    JOIN users_department ud ON u.userId = ud.userId
    JOIN department d ON ud.departmentId = d.departmentId
    WHERE u.userUUID = $1::uuid;
    `;
    db.connect((err, client) => {  // Get client via callback
        if (err) {
            console.log(err)
            res.status(501).json({ error: err.message })
            return
        }
        client.query(selectStmt, [id], (err, queryRes) => {
            if (err) {
                console.error(err);
                res.status(401).json({ error: err.message })
                client.release();
                return
            }
            if (queryRes.rows.length) {
                res.status(200).json(queryRes.rows);
            } else {
                res.status(401).json({ error: "No Deparment found" });
            }
        });
    });
})


router.get("/getAll", async (req, res) => {
    const selectStmt = "SELECT * FROM department"
    db.connect((err, client) => {  // Get client via callback
        if (err) {
            console.log(err)
            res.status(501).json({ error: err.message })
            return
        }
        client.query(selectStmt, (err, queryRes) => {
            if (err) {
                console.error(err);
                res.status(401).json({ error: err.message })
                client.release();
                return
            }
            if (queryRes.rows.length) {
                res.status(200).json(queryRes.rows);
            } else {
                res.status(401).json({ error: "No company found" });
            }
            client.release();
        });
    });
})


module.exports = router