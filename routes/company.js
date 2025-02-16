const { Router } = require("express");
const router = Router();
const company = require('../models/company')
const db = require('../connect_postgres');
const utils = require('./uti')


router.post("/create", async (req, res) => {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        console.log('Object missing');
        res.status(500).json("No json data found");
    }

    let stringify = JSON.stringify(req.body)
    let companyRes = company
    companyRes = JSON.parse(stringify)

    let colStmt = utils.genStmtCol(companyRes)
    let placeStmt = utils.genStmtPlaceHolder(companyRes)
    let valArr = utils.genStmtArr(companyRes);

    insertStmt = "INSERT INTO company(" + colStmt + ") VALUES(" + placeStmt + ")";

    db.connect((err, client) => {
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
            res.status(200).json(companyRes);
            client.release();
        });
    });
})

router.get("/getById/:id", utils.requireParams(["id"]), async (req, res) => {
    const id = req.params.id;
    const selectStmt = "SELECT * FROM company WHERE companyId = $1";
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


router.get("/getByUserId/:id", utils.requireParams(["id"]), async (req, res) => {
    const id = req.params.id;
    const selectStmt = `
    SELECT 
        c.*
    FROM users u
    JOIN users_company uc ON u.userId = uc.userId
    JOIN company c ON uc.companyId = c.companyId  -- Join with the company table
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
                res.status(401).json({ error: "No company found" });
            }
            client.release();
        });
    });
})


router.get("/getAll", async (req, res) => {
    const selectStmt = "SELECT * FROM company"
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