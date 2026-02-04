const mysql = require('mysql'); //Import mysql module

//Create mysql connection pool
const pool  = mysql.createPool({
    connectionLimit : process.env.CONNECTION_LIMIT,
    host            : process.env.HOST,
    user            : process.env.USER,
    password        : '',
    database        : process.env.DATABASE,
    charset         : process.env.CHARSET,
    multipleStatements: true
});

module.exports = pool; //Export pool variable