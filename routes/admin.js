const express = require("express");
const md5 = require("md5");
const router = express.Router();

// Middleware: only allow admin
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === "admin") {
        next();
    } else {
        res.send("Access denied");
    }
}

// Admin Dashboard
router.get("/", isAdmin, (req, res) => {
    res.render("admin_dashboard");
});

// Add Student Page
router.get("/add-student", isAdmin, (req, res) => {
    res.render("add_student");
});

// Add Student Handler
router.post("/add-student", isAdmin, (req, res) => {
    const { name, roll_no } = req.body;
    const defaultPassword = "student123";
    const hashedPassword = md5(defaultPassword);

    req.conn.query(
        "INSERT INTO students (name, roll_no) VALUES (?, ?)",
        [name, roll_no],
        (err) => {
            if (err) {
                if (err.code === "ER_DUP_ENTRY") {
                    req.flash("error_msg", "Roll number already exists!");
                    return res.redirect("/admin/view-students");
                }
                throw err;
            }

            req.conn.query(
                "INSERT INTO users (username, password, role) VALUES (?, ?, 'student')",
                [roll_no, hashedPassword],
                (err2) => {
                    if (err2) {
                        if (err2.code === "ER_DUP_ENTRY") {
                            req.flash("error_msg", "User already exists!");
                            return res.redirect("/admin/view-students");
                        }
                        throw err2;
                    }
                    req.flash("success_msg", `Student "${name}" added successfully! Default password is "${defaultPassword}"`);
                    res.redirect("/admin/view-students");
                }
            );
        }
    );
});

// View Students
router.get("/view-students", isAdmin, (req, res) => {
    req.conn.query("SELECT * FROM students ORDER BY roll_no ASC", (err, students) => {
        if (err) throw err;
        res.render("view_students", { students });
    });
});

// Edit Student Page
router.get("/edit-student/:id", isAdmin, (req, res) => {
    const studentId = req.params.id;

    req.conn.query("SELECT * FROM students WHERE id = ?", [studentId], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            req.flash("error_msg", "Student not found");
            return res.redirect("/admin/view-students");
        }
        res.render("edit_student", { student: results[0] });
    });
});

// Edit Student Handler
router.post("/edit-student/:id", isAdmin, (req, res) => {
    const studentId = req.params.id;
    const { name, roll_no } = req.body;

    req.conn.query("SELECT roll_no FROM students WHERE id = ?", [studentId], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            req.flash("error_msg", "Student not found");
            return res.redirect("/admin/view-students");
        }

        const oldRollNo = results[0].roll_no;

        req.conn.query(
            "UPDATE students SET name = ?, roll_no = ? WHERE id = ?",
            [name, roll_no, studentId],
            (err2) => {
                if (err2) {
                    if (err2.code === "ER_DUP_ENTRY") {
                        req.flash("error_msg", "Roll number already exists!");
                        return res.redirect("/admin/view-students");
                    }
                    throw err2;
                }

                if (oldRollNo !== roll_no) {
                    req.conn.query(
                        "UPDATE users SET username = ? WHERE username = ?",
                        [roll_no, oldRollNo],
                        (err3) => {
                            if (err3) throw err3;
                            req.flash("success_msg", `Student "${name}" updated successfully!`);
                            res.redirect("/admin/view-students");
                        }
                    );
                } else {
                    req.flash("success_msg", `Student "${name}" updated successfully!`);
                    res.redirect("/admin/view-students");
                }
            }
        );
    });
});

// Delete Student
router.get("/delete-student/:id", isAdmin, (req, res) => {
    const studentId = req.params.id;

    req.conn.query("SELECT roll_no, name FROM students WHERE id = ?", [studentId], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            req.flash("error_msg", "Student not found");
            return res.redirect("/admin/view-students");
        }

        const roll_no = results[0].roll_no;
        const name = results[0].name;

        req.conn.query("DELETE FROM students WHERE id = ?", [studentId], (err2) => {
            if (err2) throw err2;

            req.conn.query("DELETE FROM users WHERE username = ?", [roll_no], (err3) => {
                if (err3) throw err3;
                req.flash("success_msg", `Student "${name}" deleted successfully!`);
                res.redirect("/admin/view-students");
            });
        });
    });
});

// Mark Attendance Page
router.get("/mark-attendance", isAdmin, (req, res) => {
    req.conn.query("SELECT * FROM students", (err, students) => {
        if (err) throw err;
        res.render("mark_attendance", { students });
    });
});

// Mark Attendance Handler
router.post("/mark-attendance", isAdmin, (req, res) => {
    const { date } = req.body;
    const attendanceData = [];
    for (let key in req.body) {
        if (key.startsWith("student_")) {
            const studentId = key.split("_")[1];
            attendanceData.push([studentId, date, req.body[key]]);
        }
    }
    req.conn.query(
        "INSERT INTO attendance (student_id, date, status) VALUES ?",
        [attendanceData],
        (err) => {
            if (err) throw err;
            req.flash("success_msg", "Attendance marked successfully!");
            res.redirect("/admin/view-attendance");
        }
    );
});

// View Attendance Page (Admin)
router.get("/view-attendance", isAdmin, (req, res) => {
    const sql = `
        SELECT s.name, s.roll_no, a.date, a.status 
        FROM attendance a 
        JOIN students s ON a.student_id = s.id 
        ORDER BY a.date DESC, s.name ASC
    `;
    req.conn.query(sql, (err, records) => {
        if (err) throw err;
        res.render("view_attendance", { records });
    });
});

module.exports = router;
