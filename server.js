const express = require("express");
const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(cors());
app.use(express.json());

async function createUsersTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);
    console.log("Users table ready");
  } catch (err) {
    console.error("Error creating users table:", err);
  }
}

createUsersTable();

app.post("/register", async function (req, res) {
  const userName = req.body.username;
  const passWord = req.body.password;

  if (!userName || !passWord) {
    res.send("Username and password are required");
    return;
  }

  try {
    const checkIfUsernameTakenQuery = "SELECT * FROM users WHERE username = $1";
    const existingUser = await pool.query(checkIfUsernameTakenQuery, [userName]);

    if (existingUser.rows.length > 0) {
      res.send("Username already taken");
      return;
    }

    const hashedPassword = await bcrypt.hash(passWord, 10);

    const createAccountQuery = "INSERT INTO users (username, password) VALUES ($1, $2)";
    await pool.query(createAccountQuery, [userName, hashedPassword]);

    res.send("User created successfully");
  } catch (error) {
    console.error(error);
    res.send("Error creating account");
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
