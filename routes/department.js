const { Router } = require("express");
const router = Router();
const db = require('../connect_sqlite');

const utils = require('./uti')


router.post("/createDep", async (req, res) => {
    if (req.body.constructor === Object && Object.keys(req.body).length === 0) {
        console.log('Object missing');
        res.status(500).json("No json data found");
    }

    let stringify = JSON.stringify(req.body);
    let newDep = JSON.parse(stringify);

    let curTime = utils.getCurDate();
    let randGid = utils.getRandomGid();

    newDep.depId = randGid;
    newDep.createdOn = curTime;

    let colStmt = utils.genStmtCol(newDep);
    let placeStmt = utils.genStmtPlaceHolder(newDep)
    let valArr = utils.genStmtArr(newDep);

    insertStmt = "INSERT INTO departments(" + colStmt + ") VALUES(" + placeStmt + ")"; 
    db.run(insertStmt, valArr, (err) => {
        if (err) {
            console.log(err)
            res.status(501).json(err)
        }
        console.log("new department created successfully")
        res.status(200).json(newDep);  //to send
})


router.get("/getDep", async(req,res) => {
    let response = []
    db.all("SELECT * FROM departments", [], (err, rows) => {
        if (err) {
            console.log(err);
            res.status(501).json(err)
        }
        if (rows) {
            rows.forEach(row => {
              console.log(row); // Or process each row as needed
              response.push(row)
            });
        }
        res.status(200).json(response)
         
    })

})






})

module.exports = router