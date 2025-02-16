const { Router } = require("express");
const router = Router();
const equipment = require("../models/equipment");
const db = require('../connect_postgres');
const utils = require('./uti')

router.post("/create/:depId", utils.requireParams(["depId"]), async (req, res) => {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        console.log('Object missing');
        res.status(500).json("No json body found");
    }
    const depId = req.params.depId;
    const {equipmentModel} = req.body;
    console.log(req.params);
    const query = {
        text: `
          WITH dep_info AS (
            SELECT departmentId, companyId
            FROM department
            WHERE departmentUUID = $2::uuid
          )
          INSERT INTO equipment (equipmentModel, companyId, departmentId)
          SELECT $1, companyId, departmentId
          FROM dep_info
        `,
        values: [equipmentModel, depId]
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
            res.status(200).json({ message: `${queryRes.rowCount} Equipment created` });
            client.release();
        });
    });
})


router.get("/getById/:id", utils.requireParams(["id"]), async (req, res) => {
    const id = req.params.id;
    const selectStmt = "SELECT * FROM equipment WHERE equipmentUUID = $1";
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



router.get("/getByDep/:depId", utils.requireParams(["depId"]), async (req, res) => {
    const id = req.params.depId;
    const query = `
    SELECT e.*
    FROM department d
    JOIN equipment e ON d.departmentId = e.departmentId
    WHERE d.departmentUUID = $1::uuid;
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
                res.status(401).json({ error: "No department found" });
            }
            client.release();
        });
    });
})



router.get("/getByCompanyId/:compId", utils.requireParams(["compId"]), async (req, res) => {
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
                res.status(401).json({ error: "No company found" });
            }
            client.release();
        });
    });
})




/*
router.post("/sendData", async (req, res) => {
    //console.log(req.params.new)
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        console.log('Object missing');
        res.status(500).json(err);
    }
    let stringify = JSON.stringify(req.body);
    let userReq = JSON.parse(stringify);
    let curTime = utils.getCurDate();
    let randGid = utils.getRandomGid();

    userReq.logId = randGid;
    userReq.gID = randGid;
    userReq.checkDate = curTime;
    userReq.createdOn = curTime;

    let colStmt = utils.genStmtCol(userReq);
    let placeStmt = utils.genStmtPlaceHolder(userReq)
    let valArr = utils.genStmtArr(userReq);

    console.log(colStmt);
    console.log(placeStmt);
    console.log(valArr);

    insertStmt = "INSERT INTO equipment_logs(" + colStmt + ") VALUES(" + placeStmt + ")";
    console.log(insertStmt);
    db.run(insertStmt, valArr, (err) => {
        if (err) {
            console.log(err)
            res.status(501).json(err)
        }
        console.log("insert successfully")
        res.status(200).json(userReq);  //to send
    })
    //db.run()
});
*/

router.get("/getAll", async (req, res) => {
    const selectStmt = "SELECT * FROM equipment"
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
});


module.exports = router;