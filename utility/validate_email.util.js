//Validate email recieved from the frontend
let validate_email = (email) => {
    let mailformat = /.+@.+\..+/; //Mail validation RegEx

    if (email.match(mailformat)){
        return true; //Email is valid - True
    } else {
        return false; //Email is not valid - False
    }
}

module.exports = validate_email;