const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const mail_service = require('../../utility/mail_service.util'); //Import mail service
const db_query = require('../../models/db_model'); //Import db model
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token

const resend_verification_code = async (req, res) => {
    //Appropriate response headers
    res.setHeader('Access-Control-Allow-Origin', process.env.URL);
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader("Access-Control-Allow-Headers", 'Origin, X-Requested-With, Content-Type, Authorization, Accept');

    //Validate the request form body data
    if (req.body){
        let form_data = req.body; //Form data from the frontend

        //Check if the appropriate request parameters are set
        if (form_data.data){
            if (/^ *$/.test(form_data.data)){
                res.statusCode = 401;
                res.json({ status: 'invalid_credentials' });
            } else {
                if (form_data.data === 'resend_verification_code'){
                    let access_token = validate_auth_header(req.headers['authorization']);

                    //Validate access token and verification code
                    if (access_token == null){
                        res.statusCode = 401;
                        res.json({ status: 'invalid_credentials' });
                    } else {
                        jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
                            if (err){
                                res.statusCode = 403;
                                res.json({ status: 'access_denied' });
                            } else {
                                let user_id = user.user_id;
                                let status = user.status;

                                if (status === 'verify_account_token'){
                                    let result = await db_query.check_if_account_exists(user_id);

                                    if (result.status === false){
                                        res.statusCode = 500;
                                        res.json({ status: 'error_occured' });
                                    } else if (result.status === true){
                                        if (result.data.length > 0 && result.data.length === 1){
                                            if (result.data[0].verification_status === 'not_verified'){
                                                let isCode_exist = '';
                                                let verify_code = '';
                                                let verify_code_mail = '';

                                                do {
                                                    let verification_code = require('crypto').randomBytes(3).toString('hex');
                                                    verify_code = verification_code.toUpperCase();
                                                    verify_code_mail = verify_code;

                                                    let result = await db_query.check_verify_code(verify_code);

                                                    if (result.status === false){
                                                        res.statusCode = 500;
                                                        res.json({ status: 'error_occured' });
                                                    } else if (result.status === true){
                                                        if (result.data.length > 0){
                                                            isCode_exist = true;
                                                        } else if (result.data.length === 0){
                                                            isCode_exist = false;
                                                        }
                                                    }
                                                } while(isCode_exist === true);

                                                let result = await db_query.check_if_account_exists(user_id);

                                                if (result.status === false){
                                                    res.statusCode = 500;
                                                    res.json({ status: 'error_occured' });
                                                } else if (result.status === true){
                                                    if (result.data.length > 0 && result.data.length === 1){
                                                        var user_email = result.data[0].email;
                                                        var user_name = result.data[0].name;

                                                        let result2 = await db_query.delete_verify_code(user_id);

                                                        if (result2.status === false){
                                                            res.statusCode = 500;
                                                            res.json({ status: 'error_occured' });
                                                        } else if (result2.status === true){
                                                            let result = await db_query.insert_verify_code(user_id, verify_code);

                                                            if (result.status === false){
                                                                res.statusCode = 500;
                                                                res.json({ status: 'error_occured' });
                                                            } else if (result.status === true){
                                                                mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Verify Your Account', `This is your verification code: ${ verify_code_mail }`, user_name, `Hello, This is your verification code: ${ verify_code_mail }`, null, null); //Send mail

                                                                let access_token = generate_access_token(user_id, 'verify_account_token');
                                                                res.json({ status: 'verification_code_sent', accessToken: access_token });
                                                            }
                                                        }
                                                    } else {
                                                        res.statusCode = 401;
                                                        res.json({ status: 'user_does_not_exist' });
                                                    }
                                                }
                                            } else if (result.data[0].verification_status === 'verified'){
                                                res.statusCode = 401;
                                                res.json({ status: 'already_verified' });
                                            }
                                        } else {
                                            res.statusCode = 401;
                                            res.json({ status: 'user_does_not_exist' });
                                        }
                                    }
                                } else {
                                    res.statusCode = 403;
                                    res.json({ status: 'access_denied' });
                                }
                            }
                        });
                    }
                } else {
                    res.statusCode = 401;
                    res.json({ status: 'invalid_credentials' });
                }
            }
        } else {
            res.statusCode = 401;
            res.json({ status: 'invalid_credentials' });
        }
    } else {
        res.statusCode = 401;
        res.json({ status: 'error_occured' });
    }
}

module.exports = resend_verification_code;