const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const bcrypt = require('bcrypt'); //Import bcrypt module
const mail_service = require('../../utility/mail_service.util'); //Import mail service
const db_query = require('../../models/db_model'); //Import db model
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header

const reset_password = async (req, res) => {
    //Appropriate response headers
    res.setHeader('Access-Control-Allow-Origin', process.env.URL);
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader("Access-Control-Allow-Headers", 'Origin, X-Requested-With, Content-Type, Authorization, Accept');

    //Validate the request form body data
    if (req.body){
        let form_data = req.body; //Form data from the frontend

        //Check if the appropriate request parameters are set
        if (form_data.reset_code && form_data.password){
            let reset_code = sanitize_data(form_data.reset_code);
            let password = sanitize_data(form_data.password);

            if (/^ *$/.test(reset_code) === true  || /^ *$/.test(password) === true || password.length > 10 || password.length < 10){
                res.statusCode = 401;
                res.json({ status: 'missing_credentials' });
            } else {
                if (!!(password || '').match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*(_|[^\w])).+$/) === true){
                    let reset_password_token = validate_auth_header(req.headers['authorization']);

                    if (reset_password_token == null){
                        res.statusCode = 401;
                        res.json({ status: 'invalid_credentails' });
                    } else {
                        jwt.verify(reset_password_token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
                            if (err){
                                res.statusCode = 401;
                                res.json({ status: 'invalid_credentails' });
                            } else {
                                let user_id = user.user_id;
                                let status = user.status;

                                if (status === 'reset_password_token'){
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
                                                                let result = await db_query.fetch_all_account_details();

                                                                if (result.status === false){
                                                                    res.statusCode = 500;
                                                                    res.json({ status: 'error_occured' });
                                                                } else if (result.status === true){
                                                                    if (result.data.length > 0){
                                                                        let password_exist_count = 0;

                                                                        result.data.forEach(async data_value => {
                                                                            let hashed_password_from_db = data_value.password;
                                                                            let password_from_request = password;
                                                                            let compare_passwords = bcrypt.compareSync(password_from_request, hashed_password_from_db);

                                                                            if (compare_passwords === true){
                                                                                password_exist_count += 1;
                                                                            }
                                                                        });

                                                                        if (password_exist_count > 0){
                                                                            res.statusCode = 401;
                                                                            res.json({ status: 'password_already_taken' });
                                                                        } else if (password_exist_count === 0){
                                                                            let hashed_password = bcrypt.hashSync(password, 10);

                                                                            let result = await db_query.update_password(hashed_password, user_id);

                                                                            if (result.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (result.status === true){
                                                                                let result = await db_query.check_if_account_exists(user_id);

                                                                                if (result.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (result.status === true){
                                                                                    if (result.data.length > 0){
                                                                                        var user_name = result.data[0].name;
                                                                                        var user_email = result.data[0].email;
                                                                                        var user_password = password;

                                                                                        mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Password Changed', `Hi ${ user_name }, This is your new password: ${ user_password }`, user_name, `<p style="font-weight: 400;">Your password has changed successfully. Here are your details below:</p><p style="margin-top: 16px;"><b>This is your email: ${ user_email }</b><br><b>This is your new password: ${ user_password }</b></p>`, null, null); //Send mail

                                                                                        let result2 = await db_query.delete_reset_code(user_id);

                                                                                        if (result2.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (result2.status === true){
                                                                                            res.statusCode = 200;
                                                                                            res.json({ status: 'password_changed_successfully' });
                                                                                        }
                                                                                    } else {
                                                                                        res.statusCode = 404;
                                                                                        res.json({ status: 'user_does_not_exist' });
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            } else {
                                                                res.statusCode = 401;
                                                                res.json({ status: 'reset_code_expired' });
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
                                            res.statusCode = 404;
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
                } else {
                    res.statusCode = 401;
                    res.json({ status: 'invalid_password' });
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

module.exports = reset_password;