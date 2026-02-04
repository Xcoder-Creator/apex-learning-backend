const jwt = require('jsonwebtoken'); //Import jsonwebtoken module

//Generate new refresh token
let generate_refresh_token = (user_id, status) => {
    return jwt.sign({ user_id: user_id, status: status }, process.env.REFRESH_TOKEN_SECRET, { algorithm: 'HS512', expiresIn: 86400 }); // One day
}

module.exports = generate_refresh_token;