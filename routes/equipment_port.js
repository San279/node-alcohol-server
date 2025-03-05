const { Router } = require("express");
const router = Router();

const db = require('../connect_postgres');
const equipment_log = require('../models/equipment_log')
const utils = require('./uti')

router.post("/User/UploadAlcohol", async(req, res) => {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        console.log('Object missing');
        res.status(500).json("No json data found");
    }

    let stringify = JSON.stringify(req.body)
    let equipmentLog = equipment_log;
    equipmentLog = JSON.parse(stringify)

    let colStmt = utils.genStmtCol(equipmentLog)
    let placeStmt = utils.genStmtPlaceHolder(equipmentLog)
    let valArr = utils.genStmtArr(equipmentLog);
    let formatDate = equipmentLog.checkDate.replaceAll('/', '-');
    equipmentLog.checkDate = formatDate;
    let query = "INSERT INTO equipment_log(" + colStmt + ") VALUES(" + placeStmt + ")";

    db.connect((err, client) => {
        if (err) {
            console.log(err)
            client.release();
            return res.status(501).json({ error: err.message })
        }
        client.query(query, valArr, (err, queryRes) => {
            if (err) {
                console.error(err);
                client.release();
                return res.status(401).json({ error: err.message })
            }
            res.status(200).json(equipmentLog);
            client.release();
        });
    });
})

module.exports = router;
