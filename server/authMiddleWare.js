const jwt = require('jsonwebtoken');

module.exports = function authenticateJWT(req, res, next) {
  console.log("Authenticating JWT");
  const authHeader = req.headers.authorization;

  if (authHeader) {
    console.log('Auth header found');
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    console.log('Auth header NOT found');
    res.sendStatus(401);
  }
};
