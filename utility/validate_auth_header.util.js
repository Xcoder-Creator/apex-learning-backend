//Validate the authentication header that comes with the request from the frontend
let validate_auth_header = (header) => {
    let auth_header = header;
    return auth_header && auth_header.split(' ')[1]; //Return the token from the header
}

module.exports = validate_auth_header;