require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const authRouter = require('./auth.js');
const groupRouter = require('./group'); // Add this line
const messageRouter = require('./message');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());

// const chirpsRouter = require('./chirp');
// app.use('/chirps', chirpsRouter);

const PORT = process.env.PORT || 5001;

app.use('/auth', authRouter);
app.use('/group', groupRouter); // Add this line
app.use('/message', messageRouter);

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;
