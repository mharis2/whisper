require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const db = require('./db');

const router = express.Router();

router.post('/register', async (req, res) => {
  console.log('register route called');
  try {
    const { username, email, password } = req.body;

    // Check if any of the input fields are empty
    if (!username || !email || !password) {
      return res.status(400).send('All fields are required');
    }

    // Check if user already exists in the database
    const userExists = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(409).send('User already exists');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into database
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
      [username, email, hashedPassword]
    );

    // Generate JWT token
    const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    // Return success response with JWT token
    res.status(201).json({
      token,
      user: {
        id: newUser.rows[0].id,
        username: newUser.rows[0].username,
        email: newUser.rows[0].email,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


router.post('/login', async (req, res) => {
  try {
    // Get user input
    const { email, password } = req.body;

    // Check if user exists in the database
    const user = await db.query('SELECT * FROM users WHERE email=$1', [email]);
    if (user.rows.length === 0) {
      return res.status(401).send('Invalid credentials');
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(401).send('Invalid credentials');
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.rows[0].id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    // Return success response with JWT token
    res.json({
      token,
      user: {
        id: user.rows[0].id,
        username: user.rows[0].username,
        email: user.rows[0].email,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
