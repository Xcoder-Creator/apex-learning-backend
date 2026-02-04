//Sanitize data
let sanitize_data = (data) => {
    return data.split('"').join('').replace(/^[ ]+|[ ]+$/g, '').trim(); //Return sanitized data
}

module.exports = sanitize_data;