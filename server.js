const express = require("express");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const db = new sqlite3.Database("users.db");

app.use(cors());
app.options("*", cors());
app.use(express.json());

db.run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
)
`);

app.post("/register", async function (req, res) {
    const userName = req.body.username;
    const passWord = req.body.password;

    if (!userName || !passWord) {
        res.send("Username and password are required");
        return;
    }    const checkIfUsernameTakenQuery = "SELECT * FROM users WHERE username = ?";

    db.get(checkIfUsernameTakenQuery, [userName], async function (err, row) {
        if (err) {
            res.send("Error checking username");
            return;
        }

        if (row) {
            res.send("Username already taken");
            return;
        }

        try {
            const hashedPassword = await bcrypt.hash(passWord, 10);
            const createAccountQuery = "INSERT INTO users (username, password) VALUES (?, ?)";

            db.run(createAccountQuery, [userName, hashedPassword], function (err) {
                if (err) {
                    res.send("Error creating account");
                    return;
                }

                res.send("User created successfully");
            });
        } catch (error) {
            res.send("Error hashing password");
                  }
    });
});

app.listen(3000, function () {
    console.log("Server running on port 3000");
});
