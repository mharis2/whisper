const { Pool } = require('pg');

const pool = new Pool({
    user: 'haris',
    host: 'localhost',
    database: 'mydatabase',
    password: '', // Leave this empty since you don't have a password
    port: 5432,
  });

module.exports = {
  query: (text, params, callback) => {
    return pool.query(text, params, callback);
  },
};
