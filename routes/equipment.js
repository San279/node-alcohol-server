const { Router } = require("express");
const router = Router();
const equipment = require("../models/equipment");
const db = require('../connect_postgres');
const verifyToken = require("../routes/auth");
const utils = require('./uti')

router.post("/create", async (req, res) => {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        console.log('Object missing');
        res.status(500).json("No json body found");
    }
    const { companyUUID, departmentUUID, equipmentModel } = req.body;
    console.log(req.params);
    const query = {
        text: `
          WITH dep_info AS (
            SELECT departmentId
            FROM department
            WHERE departmentUUID = ANY($2::uuid[])
          ),
          comp_info AS (
            SELECT companyId
            FROM company
            WHERE companyUUID = ANY($3::uuid[])
          )
          INSERT INTO equipment (equipmentModel, companyId, departmentId)
          SELECT $1, companyId, departmentId
          FROM dep_info, comp_info
        `,
        values: [equipmentModel, departmentUUID, companyUUID]
    };
    db.connect((err, client) => {  // Get client via callback
        if (err) {
            console.log(err)
            return res.status(501).json({ error: err.message })
            
        }
        client.query(query.text, query.values, (err, queryRes) => {
            if (err) {
                console.error(err);
                client.release();
                return res.status(401).json({ error: err.message })
            }
            res.status(200).json({ message: `${queryRes.rowCount} Equipment created` });
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
        const { equipmentUUID } = req.body;
        query.text = `SELECT e.equipmentUUID, e.equipmentModel, 
            c.companyName, c.companyUUID, d.departmentUUID, d.departmentName
            FROM equipment e
            JOIN company c ON e.companyId = c.companyId
            JOIN department d ON e.departmentId = d.departmentId
            WHERE equipmentUUID = ANY($1::uuid[])`;
        query.values.push(...Array(equipmentUUID.length).fill(equipmentUUID));
    } catch (err) {
        console.log(err);
        return res.status(401).json({ error: err })
    }
    db.connect((err, client) => {  // Get client via callback
        if (err) {
            console.log(err)
            return res.status(501).json({ error: err.message })
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
                res.status(401).json({ error: "No Deparmtment found" });
            }
            client.release();
        });
    });
})

router.post("/getByDepId", async (req, res) => {
    let query = {
        text: ``,
        values: []
    }
    try {
        const { departmentUUID } = req.body;
        query.text = `
            SELECT e.*
            FROM department d
            JOIN equipment e ON d.departmentId = e.departmentId
            WHERE d.departmentUUID = ANY($1::uuid[]);`
        query.values = [departmentUUID]
    } catch (err) {
        return res.status(401).json({ error: err });
    }

    db.connect((err, client) => {  // Get client via callback
        if (err) {
            console.log(err)
            return res.status(501).json({ error: err.message })
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
                res.status(204).json({ error: "No Equipment found" });
            }
            client.release();
        });
    });
})



router.get("/getByCompany/:compId", utils.requireParams(["compId"]), async (req, res) => {
    const id = req.params.compId;
    const query = `
    SELECT e.*
    FROM company c
    JOIN equipment e ON c.companyId = e.companyId
    WHERE c.companyUUID = $1::uuid;
    `;
    db.connect((err, client) => {  // Get client via callback
        if (err) {
            console.log(err)
            return res.status(501).json({ error: err.message })
        }
        client.query(query, [id], (err, queryRes) => {
            if (err) {
                console.error(err);
                client.release();
                return res.status(401).json({ error: err.message })
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
            return res.status(501).json({ error: err.message })
        }
        client.query(query, [id], (err, queryRes) => {
            if (err) {
                console.error(err);
                client.release();
                return res.status(401).json({ error: err.message })
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

router.post("/getByUserId", async (req, res) => {
    let query = {
        text: ``,
        values: []
    }
    try {
        const { userUUID } = req.body
        query.text = ` SELECT e.equipmentUUID, e.equipmentModel, ue.userEquipUUID
            FROM users u
            JOIN users_equipment ue ON u.userId = ue.userId
            JOIN equipment e ON ue.equipmentId = e.equipmentId
            WHERE u.userUUID = ANY($1::uuid[]);`
        query.values = [userUUID]
    } catch (err) {
        return res.status(401).json({ error: err })
    }
    db.connect((err, client) => {  // Get client via callback
        if (err) {
            console.log(err)
            return res.status(501).json({ error: err.message })
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
                res.status(401).json({ error: "No Deparment found" });
            }
            client.release();
        });
    });
})

router.get("/getAll", verifyToken, async (req, res) => {
    let query = {
        text:``,
        values:[]
    }
    if (req.user.priv == 'admin'){
        query.text = `SELECT c.companyName, d.departmentName, e.equipmentUUID,
        e.equipmentModel, e.createon
        FROM equipment e
        JOIN company c ON e.companyId = c.companyId
        JOIN department d ON e.departmentId = d.departmentId
        JOIN users_company uc ON e.companyId = uc.companyId
        WHERE uc.userId = $1`;
        query.values = [req.user.userId]
    }else if (req.user.priv == "super"){
        query.text =  `SELECT c.companyName, d.departmentName, e.* 
        FROM equipment e
        JOIN company c ON e.companyId = c.companyId
        JOIN department d ON e.departmentId = d.departmentId`;
    }else{
        query.text =  `SELECT c.companyName, d.departmentName, e.equipmentUUID,
        e.equipmentModel, e.createon
        FROM equipment e
        JOIN company c ON e.companyId = c.companyId
        JOIN department d ON e.departmentId = d.departmentId
        JOIN users_equipment ue ON e.equipmentId = ue.equipmentId
        WHERE ue.userId = $1`;
        query.values = [req.user.userId]
    }
    console.log(query.text)
    db.connect((err, client) => {  // Get client via callback
        if (err) {
            console.log(err)
            return res.status(501).json({ error: err.message })
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
                res.status(401).json({ error: "No company found" });
            }
            client.release();
        });
    });
});


router.delete("/delete", async (req, res) => {
    let query = {
        text: [],
        values: []
    }
    try {
        const { equipmentUUID } = req.body;
        query.text = [
            `DELETE FROM users_equipment WHERE equipmentId IN (SELECT equipmentId FROM equipment WHERE equipmentUUID = ANY($1::uuid[]));`,
            `DELETE FROM equipment WHERE equipmentUUID = ANY($1::uuid[]);`
        ];
        query.values = [equipmentUUID];
    } catch (err) {
        return res.status(401).json({ error: err })
    }
    db.connect((err, client) => {  // Get client via callback
        if (err) {
            console.log(err);
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

router.delete("/deleteUserEquip", async (req, res) => {
    let query = {
        text: ``,
        values: []
    }
    try {
        const { userEquipUUID } = req.body;
        query.text = `DELETE FROM users_equipment where userEquipUUID = ANY($1::uuid[])`;
        query.values = [userEquipUUID];
    } catch (err) {
        return res.status(401).json({ error: err })
    }
    db.connect((err, client) => {  // Get client via callback
        if (err) {
            console.log(err)
            return res.status(501).json({ error: err.message })
        }
        client.query(query.text, query.values, (err, queryRes) => {
            if (err) {
                console.error(err);
                client.release();
                return res.status(401).json({ error: err.message })
            }
            client.release();
            res.status(200).json({ status: "rows deleted successfully" });
        });
    });
})


router.put("/edit", async (req, res) => {
    let query = {
        text: ``,
        values: []
    }
    try {
        const { equipment } = req.body;
        query.text = `
           WITH company_info AS (
            SELECT companyId
            FROM company
            WHERE companyUUID = $2::uuid
        ),
        dep_info AS (
            SELECT departmentId
            FROM department
            WHERE departmentUUID = $3::uuid
        )
        UPDATE equipment
        SET
            equipmentModel = $4,
            departmentId = (SELECT departmentId FROM dep_info),
            companyId = (SELECT companyId FROM company_info)
        WHERE
            equipmentUUID = $1::uuid;`,

            query.values.push(equipment.equipmentUUID)
        query.values.push(equipment.companyUUID)
        query.values.push(equipment.departmentUUID)
        query.values.push(equipment.equipmentModel)
    } catch (err) {
        console.log(err);
        return res.status(401).json({ error: err })
    }

    db.connect((err, client) => {
        if (err) {
            console.log(err)
            return res.status(501).json({ error: err.message })
        }
        client.query(query.text, query.values, (err, queryRes) => {
            if (err) {
                console.error(err);
                client.release();
                return res.status(401).json({ error: err.message })
            }
            res.status(200).json({ message: `${queryRes.rowCount} user equipment acc created` });
            client.release();
        });
    });
})


module.exports = router;