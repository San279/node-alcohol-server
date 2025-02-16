const { Router } = require("express");
const router = Router();

const db = require('../connect_postgres');
const equipment_log = require('../models/equipment_log')
const utils = require('./uti')

router.post("/User/UploadAlcohol", async(req, res) => {
    console.log(req.body);
})



module.exports = router

