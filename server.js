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
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      )
    `);
    console.log("Users table ready");
  } catch (err) {
    console.error("Error creating users table:", err);
  }
}

async function createQuestionsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL
      )
    `);
    console.log("Questions table ready");
  } catch (err) {
    console.error("Error creating questions table:", err);
  }
}

async function createResponsesTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS responses (
        id SERIAL PRIMARY KEY,
        response TEXT NOT NULL
      )
    `);
    console.log("Responses table ready");
  } catch (err) {
    console.error("Error creating responses table:", err);
  }
}

createUsersTable();
createQuestionsTable();
createResponsesTable();

app.post("/register", async function (req, res) {
  const userName = req.body.username;
  const passWord = req.body.password;
  const confirmpassWord = req.body.confirmPassword;
  const Email = req.body.email;

  if (!userName || !passWord || !Email || !confirmpassWord) {
    res.send("Username, password, and email are required");
    return;
  }

  try {
    const checkIfUsernameTakenQuery = "SELECT * FROM users WHERE username = $1";
    const existingUser = await pool.query(checkIfUsernameTakenQuery, [userName]);

    const checkIfEmailTakenQuery = "SELECT * FROM users WHERE email = $1";
    const existingEmail = await pool.query(checkIfEmailTakenQuery, [Email]);

    if (existingUser.rows.length > 0 || existingEmail.rows.length > 0) {
      res.send("Username or email already taken");
      return;
    }

    if (passWord !== confirmpassWord){
      res.send("Password must match confirmation password");
      return;
    }

    const hashedPassword = await bcrypt.hash(passWord, 10);

    const createAccountQuery = "INSERT INTO users (username, password, email) VALUES ($1, $2, $3)";
    await pool.query(createAccountQuery, [userName, hashedPassword, Email]);

    res.send("User created successfully");
  } catch (error) {
    console.error(error);
    res.send("Error creating account");
  }
});

app.post("/login", async function(req, res) {
  const userName = req.body.username;
  const passWord = req.body.password;

  try {
    const findUsername = "SELECT * FROM users WHERE username = $1";
    const findUsernameQuery = await pool.query(findUsername, [userName]);

    if (findUsernameQuery.rows.length > 0){
      
      const user = findUsernameQuery.rows[0];
      const isMatch = await bcrypt.compare(passWord, user.password);
      
      if (isMatch){
        res.send("Login successful");
      }
      else{
        res.send("Incorrect username or password");
        return;
      }
    }

    else{
      res.send("Incorrect username or password yay");
      return;
    }
  }

  catch (error){
    console.error(error);
    res.send("Error logging in");
  }
});

app.post("/question", async function(req, res) {
  const question = req.body.question;

  try{
    const submitQuestionQuery = "INSERT INTO questions (question) VALUES ($1)";
    await pool.query(submitQuestionQuery, [question]);
  }
  catch (error) {
    console.error(error);
    res.send("Error submitting question");
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
