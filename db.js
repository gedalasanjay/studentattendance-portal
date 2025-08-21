const mysql = require('mysql');

const conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "sanju",
    database: "attendance_system"
});

conn.connect(err => {
    if (err) throw err;
    console.log("MySQL Connected...");
});

module.exports = conn;
