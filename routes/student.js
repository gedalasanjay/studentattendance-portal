const express = require("express");
const router = express.Router();

// Middleware: only student
function isStudent(req, res, next) {
    if (req.session.user && req.session.user.role === "student") {
        next();
    } else {
        res.send("Access denied");
    }
}

// Student Dashboard - View Attendance by roll_no
router.get("/", isStudent, (req, res) => {
    req.conn.query(
        `SELECT s.name, s.roll_no, a.date, a.status 
         FROM attendance a 
         JOIN students s ON a.student_id = s.id 
         WHERE s.roll_no = ? 
         ORDER BY a.date DESC`,
        [req.session.user.username],
        (err, records) => {
            if (err) throw err;
            res.render("student_dashboard", { records });
        }
    );
});

module.exports = router;
