const jwt = require('jsonwebtoken'); //Import jsonwebtoken module

//Generate new access token
let generate_access_token = (user_id, status) => {
    return jwt.sign({ user_id: user_id, status: status }, process.env.ACCESS_TOKEN_SECRET, { algorithm: 'HS512', expiresIn: 900 }); // 15 minutes
}

module.exports = generate_access_token;