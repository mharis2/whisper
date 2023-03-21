require('dotenv').config();
const path = require('path');

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const authRouter = require('./auth.js');
const groupRouter = require('./group');
const messageRouter = require('./message');
const chat = require('./chat');
const chatsRouter = require('./chats');
const userRouter = require('./user');



const app = express();

//const server = http.createServer(app);
const server = http.createServer(app);

const io = socketIO(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use('/auth', authRouter);
app.use('/group', groupRouter);
app.use('/message', messageRouter);
app.use('/api/chats', chatsRouter);
app.use('/user', userRouter);




chat(io);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = server;
