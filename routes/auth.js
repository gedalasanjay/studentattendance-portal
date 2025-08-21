const express = require("express");
const md5 = require("md5");
const router = express.Router();

// Login Page
router.get("/", (req, res) => {
    res.render("login");
});

// Login Handler
router.post("/login", (req, res) => {
    const { username, password, role } = req.body;
    req.conn.query(
        "SELECT * FROM users WHERE username = ? AND password = ?",
        [username, md5(password), role],
        (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
                req.session.user = results[0];
                if (results[0].role === "admin") {
                    res.redirect("/admin");
                } else {
                    res.redirect("/student");
                }
            } else {
                res.send("Invalid login credentials or role");
            }
        }
    );
});

// Logout
router.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

module.exports = router;
