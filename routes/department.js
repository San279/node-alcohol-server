const { Router } = require("express");
const router = Router();
const verifyToken = require("../routes/auth");
const department = require('../models/department')
const db = require('../connect_postgres');
const utils = require('./uti')

//need security
router.post("/create", async (req, res) => {
    let query = {
        text: ``,
        values: []
    }
    try {
        const { companyUUID, departmentName, lowAlcLvl, medAlcLvl, highAlcLvl} = req.body;
        query.text = ` WITH company_info AS (
                SELECT companyId AS company_id
                FROM company
                WHERE companyUUID = $2::uuid
            )
            INSERT INTO department (departmentName, companyId, lowAlcLvl, medAlcLvl, highAlcLvl)
            SELECT $1, company_id, $3, $4, $5
            FROM company_info;`
            query.values = [departmentName,companyUUID, lowAlcLvl, medAlcLvl, highAlcLvl];

    } catch (err) {
        console.log(err);
        return res.status(401).json({ error: err })
    }
    //const id = req.params.id;
    //values: [departmentName, companyUUID]

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


router.post("/getById", async (req, res) => {
    let query = {
        text: ``,
        values: []
    }
    try {
        const { departmentUUID } = req.body;
        query.text = `SELECT c.companyName, c.companyUUID, d.departmentUUID, d.departmentName
            FROM department d
            JOIN company c ON d.companyId = c.companyId
            WHERE departmentUUID = ANY($1::uuid[])`;
        query.values.push(...Array(departmentUUID.length).fill(departmentUUID));
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

router.post("/getByCompanyId", async (req, res) => {
    let query = {
        text: ``,
        values: []
    }
    try {
        const { companyUUID } = req.body;
        query.text = ` SELECT d.*
            FROM company c
            JOIN department d ON c.companyId = d.companyId
            WHERE c.companyUUID = ANY($1::uuid[]);`;
        query.values = [companyUUID];
    } catch (err) {
        console.log(err);
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
                res.status(200).json(queryRes.rows);
            } else {
                res.status(401).json({ error: "No Deparment found" });
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
    try{
        const {userUUID } = req.body
        query.text = ` SELECT d.departmentUUID, d.departmentName, ud.userDepartmentUUID
            FROM users u
            JOIN users_department ud ON u.userId = ud.userId
            JOIN department d ON ud.departmentId = d.departmentId
            WHERE u.userUUID = ANY($1::uuid[]);`
        query.values = [userUUID]
    }catch(err){
        return res.status(401).json({error: err})
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
                res.status(200).json(queryRes.rows);
            } else {
                res.status(401).json({ error: "No Deparment found" });
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
        const { departmentUUID } = req.body;
        query.text = [
            `DELETE FROM users_equipment WHERE equipmentId IN (SELECT equipmentId FROM equipment WHERE departmentId IN (SELECT departmentId FROM department WHERE departmentUUID = ANY($1::uuid[])));`,
            `DELETE FROM equipment WHERE departmentId IN (SELECT departmentId FROM department WHERE departmentUUID = ANY($1::uuid[]));`,
            `DELETE FROM users_department WHERE departmentId IN (SELECT departmentId FROM department WHERE departmentUUID = ANY($1::uuid[]));`,
            `DELETE FROM department WHERE departmentUUID = ANY($1::uuid[]);`
        ];
        query.values = [departmentUUID];
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


router.delete("/deleteUserDep", async (req, res) => {
    let query = {
        text: ``,
        values: []
    }
    try{
        const { userDepartmentUUID } = req.body;
        query.text = `DELETE FROM users_department where userDepartmentUUID = ANY($1::uuid[])`;
        query.values = [userDepartmentUUID];
    }catch(err){
        return res.status(401).json({error : err})
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
            client.release();
            res.status(200).json({ status: "rows deleted successfully" });
        });
    });
})

router.get("/getAll", verifyToken, async (req, res) => {
    let query = {
        text:``,
        values:[]
    }
    console.log(req.user);
    if (req.user.priv == 'admin'){
        query.text = `SELECT c.companyName, c.companyUUID, d.departmentName,
        d.createOn, d.departmentUUID 
        FROM company c
        JOIN department d ON d.companyId = c.companyId
        JOIN users_company uc ON d.companyId = uc.companyId
        WHERE uc.userId = $1`;
        query.values = [req.user.userId]
    }else if (req.user.priv == "super"){
        query.text =  `SELECT c.companyName, c.companyUUID, d.*
        FROM company c
        JOIN department d ON c.companyId = d.companyId`;
    }else{
        query.text =  `SELECT c.companyName, c.companyUUID, d.departmentName,
        d.createOn, d.departmentUUID 
        FROM company c
        JOIN department d ON c.companyId = d.companyId
        JOIN users_department ud ON d.departmentId = ud.departmentId
        WHERE ud.userId = $1`;
        query.values = [req.user.userId]
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
                res.status(200).json(queryRes.rows);
            } else {
                res.status(201).json({ error: "No department found" });
            }
            client.release();
        });
    });
})

router.put("/edit", async (req, res) => {
    if (!req.body || Object.keys(req.body).length === 0 || !req.body.department) {
        console.log('Object missing');
        res.status(500).json("No json body found");
    }
    const { department } = req.body;
    const query = {
        text: `
           WITH company_info AS (
                SELECT companyId
                FROM company
                WHERE companyUUID = $2::uuid
            )
            UPDATE department
            SET
                departmentName = $3,
                companyId = (SELECT companyId FROM company_info)
            WHERE
                departmentUUID = $1::uuid;
    `,
        values: [department.departmentUUID, department.companyUUID, department.departmentName]
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



module.exports = router