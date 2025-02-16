const express = require("express");
const cors = require("cors")
const app = express();
const port = process.env.SERVER_PORT

const users = require("./routes/users");
const company = require("./routes/company");
const department = require("./routes/department");
const equipment = require("./routes/equipment");
/*
const mock_equipment = require("./routes/mock_equipment");
const user = require("./routes/mock_user");
const department = require("./routes/department")
*/
const init_schema = require("./init_table")

init_schema.initializeSchema()

app.use(cors({
  origin: "*",
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
}));

app.use(express.json());

app.use("/mock/api/user", users);
app.use("/mock/api/company", company);
app.use("/mock/api/dep", department);
app.use("/mock/api/equip", equipment)
/*
app.use("/mock/api/equip", mock_equipment)
app.use("/mock/api/user", user)
app.use("/mock/api/dep", department)
*/

//app/use("/mock/api/changeEquip/:equipNo")

app.listen(port, () => {
  console.log("Backend running on " + port);
});

