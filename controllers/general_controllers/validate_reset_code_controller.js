const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db model
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header

const validate_reset_code = async (req, res) => {
    //Appropriate response headers
    res.setHeader('Access-Control-Allow-Origin', process.env.URL);
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader("Access-Control-Allow-Headers", 'Origin, X-Requested-With, Content-Type, Authorization, Accept');

    //Validate the request form body data
    if (req.body){
        let form_data = req.body; //Form data from the frontend

        //Check if the appropriate request parameters are set
        if (form_data.reset_code){
            let reset_code = sanitize_data(form_data.reset_code);

            if (/^ *$/.test(reset_code)){
                res.statusCode = 401;
                res.json({ status: 'missing_reset_code' });
            } else {
                let reset_password_token = validate_auth_header(req.headers['authorization']); //Validate the authorization header

                if (reset_password_token == null){
                    res.statusCode = 401;
                    res.json({ status: 'invalid_credentails' });
                } else {
                    jwt.verify(reset_password_token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
                        if (err){
                            res.statusCode = 401;
                            res.json({ status: 'invalid_credentails' });
                        } else {
                            var user_id = user.user_id;
                            let status = user.status;

                            if (status === 'reset_password_token'){
                                let result = await db_query.check_if_account_exists(user_id);

                                if (result.status === false){
                                    res.statusCode = 500;
                                    res.json({ status: 'error_occured' });
                                } else if (result.status === true){
                                    if (result.data.length > 0){
                                        let result = await db_query.check_if_account_exists(user_id);

                                        if (result.status === false){
                                            res.statusCode = 500;
                                            res.json({ status: 'error_occured' });
                                        } else if (result.status === true){
                                            if (result.data.length > 0 && result.data.length === 1){
                                                if (result.data[0].verification_status === 'verified'){
                                                    let result = await db_query.check_if_reset_code_exists(user_id, reset_code);

                                                    if (result.status === false){
                                                        res.statusCode = 500;
                                                        res.json({ status: 'error_occured' });
                                                    } else if (result.status === true){
                                                        if (result.data.length > 0 && result.data.length === 1){
                                                            let result = await db_query.check_if_reset_code_valid(user_id, reset_code);

                                                            if (result.status === false){
                                                                res.statusCode = 500;
                                                                res.json({ status: 'error_occured' });
                                                            } else if (result.status === true){
                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                    res.statusCode = 200;
                                                                    res.json({ status: 'direct_access', resetCode: reset_code });
                                                                } else {
                                                                    let result = await db_query.delete_reset_code(user_id);

                                                                    if (result.status === false){
                                                                        res.statusCode = 500;
                                                                        res.json({ status: 'error_occured' });
                                                                    } else if (result.status === true){
                                                                        res.statusCode = 401;
                                                                        res.json({ status: 'reset_code_expired' });
                                                                    }
                                                                }
                                                            }
                                                        } else {
                                                            res.statusCode = 401;
                                                            res.json({ status: 'invalid_reset_code' });
                                                        }
                                                    }
                                                } else if (result.data[0].verification_status === 'not_verified'){
                                                    res.statusCode = 401;
                                                    res.json({ status: 'account_not_verified' });
                                                }
                                            } else {
                                                res.statusCode = 401;
                                                res.json({ status: 'user_does_not_exist' });
                                            }
                                        }
                                    } else {
                                        res.statusCode = 401;
                                        res.json({ status: 'user_does_not_exist' });
                                    }
                                }
                            } else {
                                res.statusCode = 401;
                                res.json({ status: 'invalid_credentails' });
                            }
                        }
                    });
                }
            }
        } else {
            res.statusCode = 401;
            res.json({ status: 'invalid_credentails' });
        }
    } else {
        res.statusCode = 401;
        res.json({ status: 'error_occured' });
    }
}

module.exports = validate_reset_code;