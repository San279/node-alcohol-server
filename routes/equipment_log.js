const { Router } = require("express");
const router = Router();
const equipment = require("../models/equipment");
const verifyToken = require("./auth");
const db = require('../connect_postgres');
const utils = require('./uti')


router.get("/getAllLogs", verifyToken, async (req, res) => {
    let query = {
        text: ``,
        values: []
    }
    if (req.user.priv == 'admin') {
        query.text = `SELECT el.*
            FROM equipment_log el
            JOIN department d ON el.deptName = d.departmentName
            JOIN company c ON d.companyId = c.companyId
            JOIN users_company uc ON c.companyId = uc.companyId
            WHERE uc.userId = $1`
        query.values = [req.user.userId]
    } else if (req.user.priv == "super") {
        query.text = `SELECT el.*
            FROM equipment_log el;`;
    } else {
        query.text = `SELECT el.*
        FROM equipment_log el
        WHERE el.name = $1`;
        query.values = [req.user.name]
    }
    console.log(query)
    db.connect((err, client) => {
        if (err) {
            console.log(err);
            return res.status(401)
        }
        client.query(query.text, query.values, (err, queryRes) => {
            if (err) {
                console.log(err)
                client.release();
                return res.status(401);
            }
            if (queryRes.rows.length) {
                res.status(200).json(queryRes.rows)
            } else {
                res.status(200).json({ error: "No logs found" })
            }
            client.release();
        })
    })
})

router.post("/getLogByUser/:id", utils.requireParams(['id']), async (req, res) => {
    const id = req.params.id;
    const query = `
    SELECT el.*
    FROM users u
    JOIN users_equipment ue ON u.userId = ue.userId
    JOIN equipment_log el ON ue.equipmentModel = el.equipmentModel
    WHERE u.userUUID = $1::uuid;
    `;
    db.connect((err, client) => {  // Get client via callback
        if (err) {
            console.log(err)
            res.status(501).json({ error: err.message })
            return
        }
        client.query(query, [id], (err, queryRes) => {
            if (err) {
                console.error(err);
                res.status(401).json({ error: err.message })
                client.release();
                return
            }
            if (queryRes.rows.length) {
                res.status(200).json(queryRes.rows);
            } else {
                res.status(401).json({ error: "No equipment log found" });
            }
            client.release();
        });
    });
})

module.exports = router