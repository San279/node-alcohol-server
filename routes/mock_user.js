const { Router } = require("express");
const router = Router();
const user = require("../models/user")

const db = require('../connect_sqlite');
const utils = require('./uti')
router.post("/register", async (req, res) => {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        console.log('Object missing');
        res.status(500).json(err);
    }

    let stringify = JSON.stringify(req.body)
    let userRes = user
    userRes = JSON.parse(stringify)

    let randGid = utils.getRandomGid();
    let curTime = utils.getCurDate();

    userRes.userId = randGid
    userRes.createdOn = curTime;
    console.log(userRes)

    let colStmt = utils.genStmtCol(userRes)
    let placeStmt = utils.genStmtPlaceHolder(userRes)
    let valArr = utils.genStmtArr(userRes);

    insertStmt = "INSERT INTO users(" + colStmt + ") VALUES(" + placeStmt + ")";
    db.run(insertStmt, valArr, (err) => {
        if (err) {
            console.log(err)
            res.status(501).json(err.message)
            return
        }
        console.log("new user created successfully")
        res.status(200).json(userRes);  //to send
    })

})

router.post("/login", async (req, res) => {
    console.log(req.body)
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        console.log('Object missing');
        res.status(500).json("object not found");
        return
    }
    let stringify = JSON.stringify(req.body);
    let userRes = user;
    userRes = JSON.parse(stringify);
    db.all("SELECT * FROM users WHERE userName = ? and password = ?", [userRes.userName, userRes.password], (err, rows) => {
        if (err) {
            res.status(501).json(err.message);
            return
        } 
        if (rows) {
            res.status(200).json(rows[0]);
        }
    })
})


router.post("/addUserEquip", async (req, res) => {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        console.log('Object missing');
        res.status(500).json("No json data found");
        return
    }

    let stringify = JSON.stringify(req.body);
    let userRes = user;
    userRes = JSON.parse(stringify);

    if (userRes.priv !== "admin"){
        res.status(500)
        return
    }
    res.status(200)

})




module.exports = router;
