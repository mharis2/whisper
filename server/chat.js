module.exports = function (io) {
    io.on('connection', (socket) => {
      console.log('A user connected');
  
      socket.on('joinRoom', ({ roomId }) => {
        socket.join(roomId);
        console.log(`User joined room: ${roomId}`);
      });
  
      socket.on('message', (msg) => {
        console.log(`Received message: ${msg.text} in room: ${msg.roomId}`);
        io.in(msg.roomId).emit('message', msg);
      });
  
      socket.on('disconnect', () => {
        console.log('A user disconnected');
      });
    });
  };
  