const express = require('express');
const pool = require('./db');
const router = express.Router();
const authenticateJWT = require('./authMiddleware');

router.post('/create', authenticateJWT, async (req, res) => {
  try {
    const { name } = req.body;
    const user_id = req.user.id;

    const newGroup = await pool.query(
      'INSERT INTO groups (name) VALUES ($1) RETURNING *',
      [name]
    );

    const group_id = newGroup.rows[0].id;

    await pool.query(
      'INSERT INTO group_members (user_id, group_id) VALUES ($1, $2)',
      [user_id, group_id]
    );

    res.status(201).json(newGroup.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/:group_id/members', authenticateJWT, async (req, res) => {
  try {
    const { group_id } = req.params;
    const { user_ids } = req.body;

    const members = await Promise.all(
      user_ids.map(async (member_id) => {
        try {
          const newMember = await pool.query(
            'INSERT INTO group_members (user_id, group_id) VALUES ($1, $2) RETURNING *',
            [member_id, group_id]
          );
          return newMember.rows[0];
        } catch (error) {
          console.error(`Error adding user_id: ${member_id} to group_id: ${group_id}`, error);
          throw error;
        }
      })
    );

    res.status(201).json(members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.post('/leave/:group_id', authenticateJWT, async (req, res) => {
  try {
    const { group_id } = req.params;
    const user_id = req.user.id;

    await pool.query(
      'DELETE FROM group_members WHERE user_id = $1 AND group_id = $2',
      [user_id, group_id]
    );

    res.status(200).json({ message: 'Successfully left the group' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

router.get('/group/:group_id', authenticateJWT, async (req, res) => {
  try {
    const { group_id } = req.params;

    const messages = await pool.query(
      'SELECT * FROM group_messages WHERE group_id = $1 ORDER BY created_at ASC',
      [group_id]
    );

    res.status(200).json(messages.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
