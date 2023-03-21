const express = require('express');
const router = express.Router();
const pool = require('./db');
const authenticateJWT = require('./authMiddleware');
const bcrypt = require('bcrypt');


// Additional API calls related to user operations will be added here

// Update user's profile information
router.put('/profile', authenticateJWT, async (req, res) => {
    console.log('Update user profile - start');
    try {
      const { username, email, password } = req.body;
      const user_id = req.user.id;
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const updatedUser = await pool.query(
        `UPDATE users
         SET username = $1, email = $2, password = $3
         WHERE id = $4
         RETURNING id, username, email`,
        [username, email, hashedPassword, user_id]
      );
  
      res.status(200).json({ user: updatedUser.rows[0] });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
    console.log('Update user profile - end');
  });

// Delete a message
router.delete('/message/:message_id', authenticateJWT, async (req, res) => {
    console.log('Delete message - start');
    try {
      const { message_id } = req.params;
      const user_id = req.user.id;
  
      // Check if the user is the sender of the message
      const message = await pool.query(
        'SELECT * FROM messages WHERE id = $1 AND sender_id = $2',
        [message_id, user_id]
      );
  
      if (message.rows.length === 0) {
        return res.status(403).send('You can only delete your own messages');
      }
  
      await pool.query('DELETE FROM messages WHERE id = $1', [message_id]);
      res.status(200).json({ message: 'Message deleted' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
    console.log('Delete message - end');
  });

// Edit a message
router.put('/message/:message_id', authenticateJWT, async (req, res) => {
    console.log('Edit message - start');
    try {
      const { message_id } = req.params;
      const user_id = req.user.id;
      const { content, media_url } = req.body;
  
      // Check if the user is the sender of the message
      const message = await pool.query(
        'SELECT * FROM messages WHERE id = $1 AND sender_id = $2',
        [message_id, user_id]
      );
  
      if (message.rows.length === 0) {
        return res.status(403).send('You can only edit your own messages');
      }
  
      const updatedMessage = await pool.query(
        `UPDATE messages
         SET content = $1, media_url = $2
         WHERE id = $3
         RETURNING *`,
        [content, media_url, message_id]
      );
  
      res.status(200).json(updatedMessage.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
    console.log('Edit message - end');
  });
  // Get User's Groups
  router.get('/groups', authenticateJWT, async (req, res) => {
    console.log('Get user groups - start');
    try {
      const user_id = req.user.id;
  
      const groups = await pool.query(
        `SELECT g.id, g.name, g.description, g.created_at
         FROM groups g
         JOIN group_members gm ON g.id = gm.group_id
         WHERE gm.user_id = $1
         ORDER BY g.created_at DESC`,
        [user_id]
      );
  
      res.status(200).json({ groups: groups.rows });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });

// Get User's Private Chats
router.get('/private-chats', authenticateJWT, async (req, res) => {
  try {
    const user_id = req.user.id;

    const privateChats = await pool.query(
      `SELECT pc.id, u.username AS participant, pc.created_at
       FROM private_chats pc
       JOIN private_chat_members pcm ON pc.id = pcm.private_chat_id
       JOIN users u ON pcm.user_id = u.id
       WHERE pcm.user_id != $1 AND pc.id IN (
         SELECT private_chat_id
         FROM private_chat_members
         WHERE user_id = $1
       )
       ORDER BY pc.created_at DESC`,
      [user_id]
    );

    res.status(200).json({ privateChats: privateChats.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});



module.exports = router;
