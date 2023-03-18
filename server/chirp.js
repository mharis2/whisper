const express = require('express');
const pool = require('./db');
const router = express.Router();

router.post('/new', async (req, res) => {
    try {
        const { user_id, content } = req.body;
        const newChirp = await pool.query(
            'INSERT INTO chirps (user_id, content) VALUES ($1, $2) RETURNING *',
            [user_id, content]
        );
        res.status(201).json(newChirp.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/', async (req, res) => {
    try {
        const allChirps = await pool.query('SELECT * FROM chirps');
        res.status(200).json(allChirps.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
