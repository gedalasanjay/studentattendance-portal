const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("connect-flash");
const conn = require("./db");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const studentRoutes = require("./routes/student");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Optional: JSON parsing
app.use(express.static(__dirname + "/public"));

app.use(session({
    secret: "attendance_secret",
    resave: false,
    saveUninitialized: true
}));

app.use(flash());

// Make flash messages available in all views
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    req.conn = conn; // Pass DB connection to all routes
    next();
});

// Routes
app.use("/", authRoutes);
app.use("/admin", adminRoutes);
app.use("/student", studentRoutes);

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
