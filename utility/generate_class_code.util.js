//Generate apex learning class code
let generate_class_code = (length) => {
    let charset = "abcdefghijklmnopqrstuvwxyz0123456789"; //List of possible characters used to create the class code
    let result = "";
    for (var i = 0, n = charset.length; i < length; ++i){
        result += charset.charAt(Math.floor(Math.random() * n));
    }
    return result; //Return fully generated class code
}

module.exports = generate_class_code;