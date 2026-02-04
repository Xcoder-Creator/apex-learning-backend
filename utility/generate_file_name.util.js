//Generate a new file name for an uploaded file
let generate_file_name = (length) => {
    let charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"; //List of characters used to generate the new file name
    let result = "";
    for (var i = 0; i < length; ++i){
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result; //Return new generated file name
}

module.exports = generate_file_name;