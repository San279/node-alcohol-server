const express = require("express");
const cors = require("cors")
const app = express();
const port = 5000

const mock_equipment = require("./routes/mock_equipment");
const user = require("./routes/mock_user");
const department = require("./routes/department")
const init_table_stmt = require("./init_table_stmt")
const db = require('./connect_sqlite')

app.use(cors({
  origin: "*",
  methods: "GET,POST,PUT,DELETE",
  credentials: true,
}));


db.serialize(() => {
  /*
  db.run("DROP TABLE userDepTable");
  db.run("DROP TABLE userEquipmentTable");
  db.run("DROP TABLE equipment_logs")
  db.run("DROP TABLE departments")
  db.run("DROP TABLE equipments")
  db.run("DROP TABLE users")
  */
  db.run(init_table_stmt.logTable);
  db.run(init_table_stmt.depTable);
  db.run(init_table_stmt.equipmentTable);
  db.run(init_table_stmt.userTable);
  db.run(init_table_stmt.userDepTable);
  db.run(init_table_stmt.userEquipTable);
  console.log("tables have been create successfully")
  /*
  const stmt = db.prepare("INSERT INTO lorem VALUES (?)");
  for (let i = 0; i < 10; i++) {
      stmt.run("Ipsum " + i);
  }
  stmt.finalize();

  db.each("SELECT rowid AS id, info FROM lorem", (err, row) => {
      console.log(row.id + ": " + row.info);
  });
  */
});

app.use(express.json());

app.use("/mock/api/equip", mock_equipment)
app.use("/mock/api/user", user)
app.use("/mock/api/dep", department)

//app/use("/mock/api/changeEquip/:equipNo")

app.listen(port, () => {
  console.log("Backend running on " + port);
});

