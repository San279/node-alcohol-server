const { Router } = require("express");
const router = Router();
const equipment = require("../models/equipment");
const newEquipment = require("../models/equipment_no")
const db = require('../connect_sqlite');

const utils = require('./uti')

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


router.get("/getEquip", async (req, res) => {
    let response = []
    db.all("SELECT * FROM equipment_logs", [], (err, rows) => {
        if (err) {
            console.log(err);
            res.status(501).json(err)
        }
        if (rows) {
            console.log('All data from the table:');
            rows.forEach(row => {
                console.log(row); // Or process each row as needed
                response.push(row)
            });
        }
        res.status(200).json(response)

    })
});


router.post("/createEquip", async (req, res) => {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        console.log('Object missing');
        res.status(500).json("No json data found");
    }

    let stringify = JSON.stringify(req.body);
    let newEquip = newEquipment;
    newEquip = JSON.parse(stringify)

    let curTime = utils.getCurDate();
    let randGid = utils.getRandomGid();

    newEquip.equipId = randGid;
    newEquip.createdOn = curTime;

    let colStmt = utils.genStmtCol(newEquip);
    let placeStmt = utils.genStmtPlaceHolder(newEquip)
    let valArr = utils.genStmtArr(newEquip);

    insertStmt = "INSERT INTO equipments(" + colStmt + ") VALUES(" + placeStmt + ")";
    db.run(insertStmt, valArr, (err) => {
        if (err) {
            console.log(err)
            res.status(501).json(err)
        }
        console.log("new equipment created successfully")
        res.status(200).json(newEquip);  //to send
    })
})


module.exports = router;