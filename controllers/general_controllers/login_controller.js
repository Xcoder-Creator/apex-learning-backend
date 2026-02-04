const bcrypt = require('bcrypt'); // Import bcrypt module
const mail_service = require('../../utility/mail_service.util'); //Import mail service
const db_query = require('../../models/db_model'); // Import db model
const sanitize_data = require('../../utility/sanitize_data.util'); // Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); // Import generate access token
const generate_refresh_token = require('../../utility/generate_refresh_token.util'); // Import generate refresh token
const validate_email = require('../../utility/validate_email.util'); // Import validate email
const cookie_life = require('../../utility/cookie_life.util'); // Import cookie life

const login = async (req, res) => {
    // Appropriate response headers
    res.setHeader('Access-Control-Allow-Origin', process.env.URL);
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Authorization, Accept');

    // Validate the request form body data
    if (req.body){
        let form_data = req.body; // Form data from the frontend

        // Check if the appropriate request parameters are set
        if (form_data.email && form_data.password){
            var user_email = sanitize_data(form_data.email);
            var user_password = sanitize_data(form_data.password);

            if (/^ *$/.test(user_email)){
                res.statusCode = 401;
                res.json({ status: 'missing_email' });
            } else {
                if (validate_email(user_email) === true){
                    if (/^ *$/.test(user_password)){
                        res.statusCode = 401;
                        res.json({ status: 'missing_password' });
                    } else {
                        if (user_password.length === 10){
                            let result = await db_query.check_email(user_email);

                            if (result.status === false){
                                res.statusCode = 500;
                                res.json({ status: 'error_occured' });
                            } else if (result.status === true){
                                if (result.data.length > 0 && result.data.length === 1){
                                    let password_from_db = result.data[0].password;
                                    let verification_status = result.data[0].verification_status;
                                    let role = result.data[0].role;
                                    let user_id = result.data[0].id;
                                    let name = result.data[0].name;
                                    let email = result.data[0].email;
                                    let profile_img = result.data[0].profile_image;

                                    if (verification_status === 'verified'){
                                        let compare_passwords = bcrypt.compareSync(user_password, password_from_db);

                                        if (compare_passwords === true){
                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                            let new_refresh_token = generate_refresh_token(user_id, 'user_direct_access_refresh_token');

                                            let result = await db_query.insert_refresh_token(new_refresh_token);

                                            if (result.status === false){
                                                res.statusCode = 500;
                                                res.json({ status: 'error_occured' });
                                            } else if (result.status === true){
                                                let user_data = {
                                                    user_name: name,
                                                    user_email: email,
                                                    user_profile_image: profile_img,
                                                    user_role: role,
                                                    user_id: user_id,
                                                    value: true
                                                }

                                                let resultx = await db_query.get_user_settings(user_id);

                                                if (resultx.status === false){
                                                    res.statusCode = 500;
                                                    res.json({ status: 'error_occured' });
                                                } else if (resultx.status === true){
                                                    if (resultx.data.length > 0 && resultx.data.length === 1){
                                                        let user_settings = {};

                                                        if (role === 'Student'){
                                                            user_settings = {
                                                                user_id: resultx.data[0].user_id,
                                                                allow_email_notif: (resultx.data[0].allow_email_notif === 'true') ? true : false 
                                                            }
                                                        } else if (role === 'Teacher'){
                                                            user_settings = {
                                                                user_id: resultx.data[0].user_id,
                                                                allow_email_notif: (resultx.data[0].allow_email_notif === 'true') ? true : false 
                                                            }
                                                        }

                                                        let environment = process.env.ENVIRONMENT;
                                                        res.statusCode = 200;

                                                        if (environment === 'development'){
                                                            res.json({ status: 'login_successfull', user_details: user_data, user_settings: user_settings, verified_status: 'verified', accessToken: new_access_token, refreshToken: new_refresh_token });
                                                        } else if (environment === 'production'){
                                                            res.cookie('apex_auth', `${ new_refresh_token }`, {
                                                                maxAge: cookie_life,
                                                                httpOnly: true,
                                                                sameSite: 'strict',
                                                                secure: process.env.NODE_ENV === 'production' ? true : false
                                                            });

                                                            res.json({ status: 'login_successfull', user_details: user_data, user_settings: user_settings, verified_status: 'verified', accessToken: new_access_token });
                                                        }
                                                    } else {
                                                        res.statusCode = 401;
                                                        res.json({ status: 'error_occured' });
                                                    }
                                                }
                                            }
                                        } else {
                                            res.statusCode = 401;
                                            res.json({ status: 'wrong_password' });
                                        }
                                    } else if (verification_status === 'not_verified'){
                                        let isCode_exist = '';
                                        let verify_code = '';
                                        let verify_code_mail = '';

                                        do {
                                            let verification_code = require('crypto').randomBytes(3).toString('hex');
                                            verify_code = verification_code.toUpperCase();
                                            verify_code_mail = verify_code.substr(2, 6);

                                            let result = await db_query.check_verify_code(verify_code);

                                            if (result.data.length > 0){
                                                isCode_exist = true;
                                            } else if (result.data.length === 0){
                                                isCode_exist = false;
                                            }
                                        } while(isCode_exist === true);

                                        let result = await db_query.check_email(user_email);

                                        if (result.status === false){
                                            res.statusCode = 500;
                                            res.json({ status: 'error_occured' });
                                        } else if (result.status === true){
                                            let user_id = result.data[0].id;
                                            let user_name = result.data[0].name;

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
                                                    mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Verify Your Account', `This is your verification code: ${ verify_code_mail }`, user_name, `This is your verification code: ${ verify_code }`, null, null); //Send mail

                                                    let result = await db_query.check_email(user_email);

                                                    if (result.status === false){
                                                        res.statusCode = 500;
                                                        res.json({ status: 'error_occured' });
                                                    } else if (result.status === true){
                                                        res.statusCode = 200;
                                                        let user_row_id = result.data[0].id;
                                                        let user_name = result.data[0].name;
                                                        let access_token = generate_access_token(user_row_id, 'verify_account_token');
                                                        res.json({ status: 'login_successfull_but_not_verified', verified_status: 'not_verified', user_name: user_name, user_email: user_email, accessToken: access_token });
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    res.statusCode = 401;
                                    res.json({ status: 'account_does_not_exist' });
                                }
                            }
                        } else {
                            res.statusCode = 401;
                            res.json({ status: 'invalid_password' });
                        }
                    }
                } else {
                    res.statusCode = 401;
                    res.json({ status: 'invalid_email' });
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

module.exports = login;