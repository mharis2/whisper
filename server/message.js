const express = require('express');
const pool = require('./db');
const router = express.Router();
const authenticateJWT = require('./authMiddleware');

// Add the endpoints for private and group messages here
router.post('/private', authenticateJWT, async (req, res) => {
    console.log("Private message - start");
    try {
      const { recipient_id, content, media_url } = req.body;
      const sender_id = req.user.id;
  
      const newMessage = await pool.query(
        `INSERT INTO messages (sender_id, recipient_id, content, media_url, created_at)
         VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [sender_id, recipient_id, content, media_url]
      );
  
      res.status(201).json(newMessage.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
    console.log("Private message - end");

});

router.post('/group', authenticateJWT, async (req, res) => {
    try {
      const { group_id, content, media_url } = req.body;
      const sender_id = req.user.id;
  
      const newMessage = await pool.query(
        `INSERT INTO messages (sender_id, group_id, content, media_url, created_at)
         VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [sender_id, group_id, content, media_url]
      );
  
      res.status(201).json(newMessage.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
});

  router.get('/private/:recipient_id', authenticateJWT, async (req, res) => {
    console.log("Get Private Messages - start ")
    try {
      const { recipient_id } = req.params;
      const sender_id = req.user.id;
  
      const messages = await pool.query(
        `SELECT * FROM messages
         WHERE (sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1)
         ORDER BY created_at`,
        [sender_id, recipient_id]
      );
  
      res.status(200).json(messages.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
    console.log("Get Private Messages - end ")

  });
  router.get('/group/:group_id', authenticateJWT, async (req, res) => {
    console.log("Get Group Messages - start ")
    try {
      const { group_id } = req.params;
      const user_id = req.user.id;
  
      // Check if the user is a member of the group
      const isMember = await pool.query(
        `SELECT * FROM group_members WHERE user_id = $1 AND group_id = $2`,
        [user_id, group_id]
      );
  
      if (isMember.rows.length === 0) {
        return res.status(403).send('You are not a member of this group');
      }
  
      const messages = await pool.query(
        `SELECT * FROM messages
         WHERE group_id = $1
         ORDER BY created_at`,
        [group_id]
      );
  
      res.status(200).json(messages.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
    console.log("Get Group Messages - end ")
  });

module.exports = router;
