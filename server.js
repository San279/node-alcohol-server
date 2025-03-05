const express = require("express");
const cors = require("cors")
const app = express();
const port = process.env.SERVER_PORT

const jwt = require('jsonwebtoken');

const users = require("./routes/users");
const company = require("./routes/company");
const department = require("./routes/department");
const equipment = require("./routes/equipment");
const equipment_log = require("./routes/equipment_log");
const equipment_port = require("./routes/equipment_port");

const init_schema = require("./init_table")

init_schema.initializeSchema()

app.use(cors({
  origin: "*",
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
}));

app.use(express.json());
app.use("/actionapi", equipment_port);
app.use("/mock/api/log", equipment_log);
app.use("/mock/api/user", users);
app.use("/mock/api/company", company);
app.use("/mock/api/dep", department);
app.use("/mock/api/equip", equipment)


app.listen(port, () => {
  console.log("Backend running on " + port);
});

