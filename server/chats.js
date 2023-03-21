const express = require('express');
const pool = require('./db');
const router = express.Router();
const authenticateJWT = require('./authMiddleware');

router.get('/', authenticateJWT, async (req, res) => {
  try {
    const user_id = req.user.id;

    // Fetch group chats
    const groupChats = await pool.query(
      `SELECT g.id as group_id, g.name as group_name, m.content as last_message, COUNT(um.message_id) as unread_count
      FROM groups g
      INNER JOIN group_members gm ON gm.group_id = g.id
      INNER JOIN messages m ON m.group_id = g.id
      LEFT JOIN user_messages um ON um.message_id = m.id AND um.user_id = $1 AND um.read = false
      WHERE gm.user_id = $1
      GROUP BY g.id, m.id
      ORDER BY m.created_at DESC`,
      [user_id]
    );

    // Fetch private chats
    const privateChats = await pool.query(
      `SELECT m.sender_id, m.recipient_id, m.content as last_message, u.username, COUNT(um.message_id) as unread_count
      FROM messages m
      INNER JOIN users u ON u.id = (CASE WHEN m.sender_id = $1 THEN m.recipient_id ELSE m.sender_id END)
      LEFT JOIN user_messages um ON um.message_id = m.id AND um.user_id = $1 AND um.read = false
      WHERE m.sender_id = $1 OR m.recipient_id = $1
      GROUP BY m.id, u.id
      ORDER BY m.created_at DESC`,
      [user_id]
    );

    const chats = [
      ...groupChats.rows.map((group) => ({
        id: group.group_id,
        type: 'group',
        name: group.group_name,
        lastMessage: group.last_message,
        unreadCount: group.unread_count,
      })),
      ...privateChats.rows.map((privateVar) => ({
        id: privateVar.sender_id === user_id ? privateVar.recipient_id : privateVar.sender_id,
        type: 'private',
        name: privateVar.username,
        lastMessage: privateVar.last_message,
        unreadCount: privateVar.unread_count,
      })),
    ];

    res.status(200).json({ chats });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
