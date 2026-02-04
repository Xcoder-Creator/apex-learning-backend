const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db model
const mail_service = require('../../utility/mail_service.util'); //Import mail service
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const generate_refresh_token = require('../../utility/generate_refresh_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header
const cookie_life = require('../../utility/cookie_life.util'); //Import cookie life
const transporter = require('../../mail_configuration/mail_config'); //Import transporter for mail config

const verify_account = async (req, res) => {
    // Appropriate response headers
    res.setHeader('Access-Control-Allow-Origin', process.env.URL);
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader("Access-Control-Allow-Headers", 'Origin, X-Requested-With, Content-Type, Authorization, Accept');

    //Validate the request form body data
    if (req.body){
        let form_data = req.body; //Form data from the frontend

        //Check if the appropriate request parameters are set
        if (form_data.verification_code){
            //Variables to hold form data individually and remove any quotes contained in them from left to right
            //and also remove leading and trailing whitespaces
            var verification_code = sanitize_data(form_data.verification_code);

            if (/^ *$/.test(verification_code)){
                res.statusCode = 401;
                res.json({ status: 'invalid_credentials' });
            } else {
                let access_token = validate_auth_header(req.headers['authorization']); //Validate the authorization header

                //Validate access token and verification code
                if (access_token == null){
                    res.statusCode = 401;
                    res.json({ status: 'invalid_credentials' });
                } else {
                    var access_token_value = access_token;

                    jwt.verify(access_token_value, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
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
                                            let result = await db_query.check_if_verify_code_belong_to_user(user_id, verification_code);

                                            if (result.status === false){
                                                res.statusCode = 500;
                                                res.json({ status: 'error_occured' });
                                            } else if (result.status === true){
                                                if (result.data.length > 0 && result.data.length === 1){
                                                    let result = await db_query.check_if_verify_code_valid(user_id, verification_code);

                                                    if (result.status === false){
                                                        res.statusCode = 500;
                                                        res.json({ status: 'error_occured' });
                                                    } else if (result.status === true){
                                                        if (result.data.length > 0 && result.data.length === 1){
                                                            let result = await db_query.verify_account(user_id);

                                                            if (result.status === false){
                                                                res.statusCode = 500;
                                                                res.json({ status: 'error_occured' });
                                                            } else if (result.status === true){
                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                let new_refresh_token = generate_refresh_token(user_id, 'user_direct_access_refresh_token');

                                                                let result = await db_query.insert_refresh_token(new_refresh_token);

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
                                                                            let user_name = result.data[0].name;
                                                                            let user_email = result.data[0].email;
                                                                            let profile_img = result.data[0].profile_image;
                                                                            let user_id_value = result.data[0].id;
                                                                            let user_role = result.data[0].role;

                                                                            let user_data = {
                                                                                user_name: user_name,
                                                                                user_email: user_email,
                                                                                user_profile_image: profile_img,
                                                                                user_role: user_role,
                                                                                user_id: user_id_value,
                                                                                value: true
                                                                            }

                                                                            let result2 = await db_query.delete_verify_code(user_id);

                                                                            if (result2.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (result2.status === true){
                                                                                let resultx = await db_query.get_user_settings(user_id);

                                                                                if (resultx.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (resultx.status === true){
                                                                                    if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                        let user_settings = {};

                                                                                        if (user_role === 'Student'){
                                                                                            user_settings = {
                                                                                                user_id: resultx.data[0].user_id,
                                                                                                allow_email_notif: (resultx.data[0].allow_email_notif === 'true') ? true : false 
                                                                                            }
                                                                                        } else if (user_role === 'Teacher'){
                                                                                            user_settings = {
                                                                                                user_id: resultx.data[0].user_id,
                                                                                                allow_email_notif: (resultx.data[0].allow_email_notif === 'true') ? true : false 
                                                                                            }
                                                                                        }

                                                                                        mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Account Verification Successfull', 'Welcome to Apex Learning 👋', user_name, '<p>Your account has been verified successfully. Welcome to Apex Learning <span style="font-size: 1.2rem;">👋</span></p>', null, null); //Send mail

                                                                                        let environment = process.env.ENVIRONMENT;
                                                                                        res.statusCode = 200;

                                                                                        if (environment === 'development'){
                                                                                            res.json({ status: 'account_verified_successfully', user_details: user_data, user_settings: user_settings, user_role: user_role, accessToken: new_access_token, refreshToken: new_refresh_token });
                                                                                        } else if (environment === 'production'){
                                                                                            res.cookie('apex_auth', `${ new_refresh_token }`, {
                                                                                                maxAge: cookie_life,
                                                                                                httpOnly: true,
                                                                                                sameSite: 'strict',
                                                                                                secure: process.env.NODE_ENV === 'production' ? true : false
                                                                                            });

                                                                                            res.json({ status: 'account_verified_successfully', user_details: user_data, user_settings: user_settings, user_role: user_role, accessToken: new_access_token });
                                                                                        }
                                                                                    } else {
                                                                                        res.statusCode = 401;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    }
                                                                                }
                                                                            }
                                                                        } else {
                                                                            res.statusCode = 500;
                                                                            res.json({ status: 'error_occured' });
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        } else {
                                                            let result = await db_query.delete_verify_code(user_id);

                                                            if (result.status === false){
                                                                res.statusCode = 500;
                                                                res.json({ status: 'error_occured' });
                                                            } else if (result.status === true){
                                                                res.statusCode = 401;
                                                                res.json({ status: 'verification_code_expired' });
                                                            }
                                                        }
                                                    }
                                                } else {
                                                    res.statusCode = 401;
                                                    res.json({ status: 'invalid_verification_code' });
                                                }
                                            }
                                        } else if (result.data[0].verification_status === 'verified'){
                                            res.statusCode = 401;
                                            res.json({ status: 'already_verified' });
                                        }
                                    } else {
                                        res.statusCode = 401;
                                        res.json({ status: 'account_does_not_exist' });
                                    }
                                }
                            } else {
                                res.statusCode = 401;
                                res.json({ status: 'access_denied' });
                            }
                        }
                    });
                }
            }
        }
    } else {
        res.statusCode = 401;
        res.json({ status: 'error_occured' });
    }
}

module.exports = verify_account;