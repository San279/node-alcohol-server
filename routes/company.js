const { Router } = require("express");
const router = Router();
const company = require('../models/company')
const db = require('../connect_postgres');
const verifyToken = require("../routes/auth");
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

    const insertStmt = "INSERT INTO company(" + colStmt + ") VALUES(" + placeStmt + ")";

    db.connect((err, client) => {
        if (err) {
            console.log(err)
            res.status(501).json({ error: err.message })
            return
        }
        client.query(insertStmt, valArr, (err, queryRes) => {
            if (err) {
                console.error(err);
                client.release();
                return res.status(401).json({ error: err.message })

            }
            client.release();
            return res.status(200).json(companyRes);
        });
    });
})

router.post("/getById", async (req, res) => {
    let query = {
        text: ``,
        values: []
    };
    try {
        const { companyUUID } = req.body
        query.text = `
            SELECT companyUUID, companyName 
            FROM company 
            WHERE companyUUID = ANY($1::uuid[])
        `;
        query.values.push(...Array(companyUUID.length).fill(companyUUID));
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


router.post("/getByUserId", async (req, res) => {
    let query = {
        text: ``,
        values: []
    };
    try {
        const { userUUID } = req.body;
        query.text = `SELECT c.companyUUID, c.companyName, uc.userCompanyUUID
            FROM users u
            JOIN users_company uc ON u.userId = uc.userId
            JOIN company c ON uc.companyId = c.companyId
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
                console.log(queryRes.rows);
                res.status(200).json(queryRes.rows);
            } else {
                res.status(204).json({ error: "No user found" });
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
        const { companyUUID } = req.body;
        query.text = [
            `DELETE FROM users_equipment WHERE equipmentId IN (SELECT equipmentId FROM equipment WHERE companyId IN (SELECT companyId FROM company WHERE companyUUID = ANY($1::uuid[])));`,
            `DELETE FROM equipment WHERE companyId IN (SELECT companyId FROM company WHERE companyUUID = ANY($1::uuid[]));`,
            `DELETE FROM users_department WHERE departmentId IN (SELECT departmentId FROM department WHERE companyId IN (SELECT companyId FROM company WHERE companyUUID = ANY($1::uuid[])));`,
            `DELETE FROM users_company WHERE companyId IN (SELECT companyId FROM company WHERE companyUUID = ANY($1::uuid[]));`,
            `DELETE FROM department WHERE companyId IN (SELECT companyId FROM company WHERE companyUUID = ANY($1::uuid[]));`,
            `DELETE FROM company WHERE companyUUID = ANY($1::uuid[]);`
        ];
        query.values = [companyUUID];
            
    }catch(err){
        return res.status(401).json({error: err})
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

router.delete("/deleteUserCompany", async (req, res) => {
    let query = {
        text: ``,
        values: []
    }
    try{
        const { userCompanyUUID } = req.body;
        query.text = `DELETE FROM users_company where userCompanyUUID = ANY($1::uuid[])`;
        query.values = [userCompanyUUID];
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
    if (req.user.priv == 'admin'){
        query.text = `SELECT c.companyName, c.companyUUID, c.createOn 
        FROM company c
        JOIN users_company uc ON c.companyId = uc.companyId
        WHERE uc.userId = $1`
        query.values = [req.user.userId]
    }else if (req.user.priv == "super"){
        query.text = `SELECT * FROM company`
    }else{
        query.text = `SELECT c.companyName, c.companyUUID, c.createOn 
        FROM company c
        JOIN users_company uc ON c.companyId = uc.companyId
        WHERE uc.userId = $1`
        query.values = [req.user.userId]
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
                res.status(401).json({ error: "Acess denied" });
            }
            client.release();
        });
    });
})

router.put("/edit", async (req, res) => {
    let query = {
        text: ``,
        values: []
    };
    try {
        const { company } = req.body;

        query.text = `
        UPDATE company
        SET
            companyName = $2
        WHERE
            companyUUID = $1::uuid;
    `,
            query.values.push(company.companyUUID);
        query.values.push(company.companyName);
    } catch (err) {
        console.log(err);
        res.status(401).json({ error: err })
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



module.exports = router