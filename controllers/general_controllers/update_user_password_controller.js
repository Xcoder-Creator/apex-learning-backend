const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db_query
const mail_service = require('../../utility/mail_service.util'); //Import mail service
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header
const bcrypt = require('bcrypt'); //Import bcrypt module

const update_user_password = async (req, res) => {
    //Appropriate response headers
    res.setHeader('Access-Control-Allow-Origin', process.env.URL);
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader("Access-Control-Allow-Headers", 'Origin, X-Requested-With, Content-Type, Authorization, Accept');

    let environment = process.env.ENVIRONMENT;

    if (environment === 'development'){
        //Validate the request form body data
        if (req.body){
            let form_data = req.body; //Form data from the frontend

            //Check if the appropriate request parameters are set
            if (form_data.access_token && form_data.password){
                //Filter and sanitize the request parameters
                let access_token = sanitize_data(form_data.access_token);
                let password = sanitize_data(form_data.password);

                //Validate the request parameters
                if (/^ *$/.test(access_token)){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    if (/^ *$/.test(password)){
                        res.statusCode = 401;
                        res.json({ status: 'missing_password' });
                    } else {
                        if (password.length > 10 || password.length < 10 || password.length === 0){
                            res.statusCode = 401;
                            res.json({ status: 'password_length_error' });
                        } else {
                            if (!!(password || '').match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*(_|[^\w])).+$/) === true){
                                let refresh_token = validate_auth_header(req.headers['authorization']); //Validate the authorization header

                                if (refresh_token == null){
                                    res.statusCode = 401;
                                    res.json({ status: 'missing_credentials' });
                                } else {
                                    let result = await db_query.check_refresh_token(refresh_token);

                                    if (result.status === false){
                                        res.statusCode = 500;
                                        res.json({ status: 'error_occured' });
                                    } else if (result.status === true){
                                        if (result.data.length > 0){
                                            jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
                                                if (err){
                                                    let result = await db_query.delete_refresh_token(refresh_token);

                                                    if (result.status === false){
                                                        res.statusCode = 500;
                                                        res.json({ status: 'error_occured' });
                                                    } else if (result.status === true){
                                                        res.statusCode = 401;
                                                        res.json({ status: 'token_expired' });
                                                    }
                                                } else {
                                                    let user_id = user.user_id;
                                                    let status = user.status;

                                                    if (status === 'user_direct_access_refresh_token'){
                                                        jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
                                                            if (err) {
                                                                let result = await db_query.check_if_account_verified(user_id);

                                                                if (result.status === false){
                                                                    res.statusCode = 500;
                                                                    res.json({ status: 'error_occured' });
                                                                } else if (result.status === true){
                                                                    var user_name = result.data[0].name;
                                                                    var user_email = result.data[0].email;

                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                        let result1 = await db_query.fetch_all_account_details();

                                                                        if (result1.status === false){
                                                                            res.statusCode = 500;
                                                                            res.json({ status: 'error_occured' });
                                                                        } else if (result1.status === true){
                                                                            if (result1.data.length > 0){
                                                                                let password_exist_count = 0;

                                                                                result1.data.forEach(async data_value => {
                                                                                    let hashed_password_from_db = data_value.password;
                                                                                    let password_from_request = password;
                                                                                    let compare_passwords = bcrypt.compareSync(password_from_request, hashed_password_from_db);

                                                                                    if (compare_passwords === true){
                                                                                        password_exist_count += 1;
                                                                                    }
                                                                                });

                                                                                if (password_exist_count > 0){
                                                                                    res.statusCode = 401;
                                                                                    res.json({ status: 'try_a_different_password' });
                                                                                } else if (password_exist_count === 0){
                                                                                    let hashed_password = bcrypt.hashSync(password, 10);

                                                                                    let resultx = await db_query.update_password(hashed_password, user_id);

                                                                                    if (resultx.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (resultx.status === true){
                                                                                        let result = await db_query.get_user_settings(user_id);

                                                                                        if (result.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (result.status === true){
                                                                                            let allow_email_notif = result.data[0].allow_email_notif;
                                                                                            
                                                                                            if (allow_email_notif === 'false'){
                                                                                                res.statusCode = 200;
                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                res.json({ status: 'password_updated', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                            } else if (allow_email_notif === 'true'){
                                                                                                mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Password Updated', 'Your password has been changed successfully!', user_name, 'Your password has been changed successfully!', null, null); //Send mail

                                                                                                res.statusCode = 200;
                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                res.json({ status: 'password_updated', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                let hashed_password = bcrypt.hashSync(password, 10);
                                                                                
                                                                                let resultx = await db_query.update_password(hashed_password, user_id);

                                                                                if (resultx.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (resultx.status === true){
                                                                                    let result = await db_query.get_user_settings(user_id);

                                                                                    if (result.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (result.status === true){
                                                                                        let allow_email_notif = result.data[0].allow_email_notif;
                                                                                        
                                                                                        if (allow_email_notif === 'false'){
                                                                                            res.statusCode = 200;
                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                            res.json({ status: 'password_updated', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                        } else if (allow_email_notif === 'true'){
                                                                                            mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Password Updated', 'Your password has been changed successfully!', user_name, 'Your password has been changed successfully!', null, null); //Send mail

                                                                                            res.statusCode = 200;
                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                            res.json({ status: 'password_updated', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    } else {
                                                                        //User does not exist
                                                                        res.statusCode = 404;
                                                                        res.json({ status: 'user_not_found' });
                                                                    }
                                                                }
                                                            } else {
                                                                let status = user.status;

                                                                if (status === 'user_direct_access_token'){
                                                                    let user_auth_id = user.user_id; //Users authentication id

                                                                    let result = await db_query.check_if_account_verified(user_auth_id);

                                                                    if (result.status === false){
                                                                        res.statusCode = 500;
                                                                        res.json({ status: 'error_occured' });
                                                                    } else if (result.status === true){
                                                                        var user_name = result.data[0].name;
                                                                        var user_email = result.data[0].email;

                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                            let result1 = await db_query.fetch_all_account_details();

                                                                            if (result1.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (result1.status === true){
                                                                                if (result1.data.length > 0){
                                                                                    let password_exist_count = 0;

                                                                                    result1.data.forEach(async data_value => {
                                                                                        let hashed_password_from_db = data_value.password;
                                                                                        let password_from_request = password;
                                                                                        let compare_passwords = bcrypt.compareSync(password_from_request, hashed_password_from_db);

                                                                                        if (compare_passwords === true){
                                                                                            password_exist_count += 1;
                                                                                        }
                                                                                    });

                                                                                    if (password_exist_count > 0){
                                                                                        res.statusCode = 401;
                                                                                        res.json({ status: 'try_a_different_password' });
                                                                                    } else if (password_exist_count === 0){
                                                                                        let hashed_password = bcrypt.hashSync(password, 10);

                                                                                        let resultx = await db_query.update_password(hashed_password, user_id);

                                                                                        if (resultx.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (resultx.status === true){
                                                                                            let result = await db_query.get_user_settings(user_id);

                                                                                            if (result.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result.status === true){
                                                                                                let allow_email_notif = result.data[0].allow_email_notif;
                                                                                                
                                                                                                if (allow_email_notif === 'false'){
                                                                                                    res.statusCode = 200;
                                                                                                    res.json({ status: 'password_updated', token_info: 'no_token' });
                                                                                                } else if (allow_email_notif === 'true'){
                                                                                                    mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Password Updated', 'Your password has been changed successfully!', user_name, 'Your password has been changed successfully!', null, null); //Send mail

                                                                                                    res.statusCode = 200;
                                                                                                    res.json({ status: 'password_updated', token_info: 'no_token' });
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    let hashed_password = bcrypt.hashSync(password, 10);
                                                                                    
                                                                                    let resultx = await db_query.update_password(hashed_password, user_id);

                                                                                    if (resultx.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (resultx.status === true){
                                                                                        let result = await db_query.get_user_settings(user_id);

                                                                                        if (result.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (result.status === true){
                                                                                            let allow_email_notif = result.data[0].allow_email_notif;
                                                                                            
                                                                                            if (allow_email_notif === 'false'){
                                                                                                res.statusCode = 200;
                                                                                                res.json({ status: 'password_updated', token_info: 'no_token' });
                                                                                            } else if (allow_email_notif === 'true'){
                                                                                                mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Password Updated', 'Your password has been changed successfully!', user_name, 'Your password has been changed successfully!', null, null); //Send mail

                                                                                                res.statusCode = 200;
                                                                                                res.json({ status: 'password_updated', token_info: 'no_token' });
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        } else {
                                                                            //User does not exist
                                                                            res.statusCode = 404;
                                                                            res.json({ status: 'user_not_found' });
                                                                        }
                                                                    }
                                                                } else {
                                                                    res.statusCode = 401;
                                                                    res.json({ status: 'invalid_token' });
                                                                }
                                                            }
                                                        })
                                                    } else {
                                                        res.statusCode = 401;
                                                        res.json({ status: 'invalid_token' });
                                                    }
                                                }
                                            })
                                        } else {
                                            res.statusCode = 401;
                                            res.json({ status: 'invalid_token' });
                                        }
                                    }
                                }
                            } else {
                                res.statusCode = 401;
                                res.json({ status: 'invalid_password' });
                            }
                        }
                    }
                }
            } else {
                res.statusCode = 401;
                res.json({ status: 'missing_credentials' });
            }
        } else {
            res.statusCode = 401;
            res.json({ status: 'error_occured' });
        }
    } else if (environment === 'production'){
        //Validate the request form body data
        if (req.body){
            let form_data = req.body; //Form data from the frontend

            //Check if the appropriate request parameters are set
            if (form_data.password){
                //Filter and sanitize the request parameters
                let password = sanitize_data(form_data.password);

                if (/^ *$/.test(password)){
                    res.statusCode = 401;
                    res.json({ status: 'missing_password' });
                } else {
                    if (password.length > 10 || password.length < 10 || password.length === 0){
                        res.statusCode = 401;
                        res.json({ status: 'password_length_error' });
                    } else {
                        if (!!(password || '').match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*(_|[^\w])).+$/) === true){
                            let access_token = validate_auth_header(req.headers['authorization']);

                            if (access_token == null){
                                res.statusCode = 401;
                                res.json({ status: 'missing_credentials' });
                            } else {
                                const raw_cookies = JSON.parse(JSON.stringify(req.cookies));

                                if (raw_cookies){
                                    if (raw_cookies.hasOwnProperty('apex_auth')){
                                        let refresh_token = raw_cookies['apex_auth'];

                                        let result = await db_query.check_refresh_token(refresh_token);

                                        if (result.status === false){
                                            res.statusCode = 500;
                                            res.json({ status: 'error_occured' });
                                        } else if (result.status === true){
                                            if (result.data.length > 0){
                                                jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
                                                    if (err){
                                                        let result = await db_query.delete_refresh_token(refresh_token);

                                                        if (result.status === false){
                                                            res.statusCode = 500;
                                                            res.json({ status: 'error_occured' });
                                                        } else if (result.status === true){
                                                            res.statusCode = 401;
                                                            res.clearCookie('apex_auth'); // Clear apex auth cookie
                                                            res.json({ status: 'token_expired' });
                                                        }
                                                    } else {
                                                        let user_id = user.user_id;
                                                        let status = user.status;

                                                        if (status === 'user_direct_access_refresh_token'){
                                                            jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
                                                                if (err) {
                                                                    let result = await db_query.check_if_account_verified(user_id);

                                                                    if (result.status === false){
                                                                        res.statusCode = 500;
                                                                        res.json({ status: 'error_occured' });
                                                                    } else if (result.status === true){
                                                                        var user_name = result.data[0].name;
                                                                        var user_email = result.data[0].email;

                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                            let result1 = await db_query.fetch_all_account_details();

                                                                            if (result1.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (result1.status === true){
                                                                                if (result1.data.length > 0){
                                                                                    let password_exist_count = 0;

                                                                                    result1.data.forEach(async data_value => {
                                                                                        let hashed_password_from_db = data_value.password;
                                                                                        let password_from_request = password;
                                                                                        let compare_passwords = bcrypt.compareSync(password_from_request, hashed_password_from_db);

                                                                                        if (compare_passwords === true){
                                                                                            password_exist_count += 1;
                                                                                        }
                                                                                    });

                                                                                    if (password_exist_count > 0){
                                                                                        res.statusCode = 401;
                                                                                        res.json({ status: 'try_a_different_password' });
                                                                                    } else if (password_exist_count === 0){
                                                                                        let hashed_password = bcrypt.hashSync(password, 10);

                                                                                        let resultx = await db_query.update_password(hashed_password, user_id);

                                                                                        if (resultx.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (resultx.status === true){
                                                                                            let result = await db_query.get_user_settings(user_id);

                                                                                            if (result.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result.status === true){
                                                                                                let allow_email_notif = result.data[0].allow_email_notif;
                                                                                                
                                                                                                if (allow_email_notif === 'false'){
                                                                                                    res.statusCode = 200;
                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                    res.json({ status: 'password_updated', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                } else if (allow_email_notif === 'true'){
                                                                                                    mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Password Updated', 'Your password has been changed successfully!', user_name, 'Your password has been changed successfully!', null, null); //Send mail

                                                                                                    res.statusCode = 200;
                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                    res.json({ status: 'password_updated', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    let hashed_password = bcrypt.hashSync(password, 10);
                                                                                    
                                                                                    let resultx = await db_query.update_password(hashed_password, user_id);

                                                                                    if (resultx.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (resultx.status === true){
                                                                                        let result = await db_query.get_user_settings(user_id);

                                                                                        if (result.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (result.status === true){
                                                                                            let allow_email_notif = result.data[0].allow_email_notif;
                                                                                            
                                                                                            if (allow_email_notif === 'false'){
                                                                                                res.statusCode = 200;
                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                res.json({ status: 'password_updated', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                            } else if (allow_email_notif === 'true'){
                                                                                                mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Password Updated', 'Your password has been changed successfully!', user_name, 'Your password has been changed successfully!', null, null); //Send mail

                                                                                                res.statusCode = 200;
                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                res.json({ status: 'password_updated', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        } else {
                                                                            //User does not exist
                                                                            res.statusCode = 404;
                                                                            res.json({ status: 'user_not_found' });
                                                                        }
                                                                    }
                                                                } else {
                                                                    let status = user.status;

                                                                    if (status === 'user_direct_access_token'){
                                                                        let user_auth_id = user.user_id; //Users authentication id

                                                                        let result = await db_query.check_if_account_verified(user_auth_id);

                                                                        if (result.status === false){
                                                                            res.statusCode = 500;
                                                                            res.json({ status: 'error_occured' });
                                                                        } else if (result.status === true){
                                                                            var user_name = result.data[0].name;
                                                                            var user_email = result.data[0].email;

                                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                                let result1 = await db_query.fetch_all_account_details();

                                                                                if (result1.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (result1.status === true){
                                                                                    if (result1.data.length > 0){
                                                                                        let password_exist_count = 0;

                                                                                        result1.data.forEach(async data_value => {
                                                                                            let hashed_password_from_db = data_value.password;
                                                                                            let password_from_request = password;
                                                                                            let compare_passwords = bcrypt.compareSync(password_from_request, hashed_password_from_db);

                                                                                            if (compare_passwords === true){
                                                                                                password_exist_count += 1;
                                                                                            }
                                                                                        });

                                                                                        if (password_exist_count > 0){
                                                                                            res.statusCode = 401;
                                                                                            res.json({ status: 'try_a_different_password' });
                                                                                        } else if (password_exist_count === 0){
                                                                                            let hashed_password = bcrypt.hashSync(password, 10);

                                                                                            let resultx = await db_query.update_password(hashed_password, user_id);

                                                                                            if (resultx.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (resultx.status === true){
                                                                                                let result = await db_query.get_user_settings(user_id);

                                                                                                if (result.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result.status === true){
                                                                                                    let allow_email_notif = result.data[0].allow_email_notif;
                                                                                                    
                                                                                                    if (allow_email_notif === 'false'){
                                                                                                        res.statusCode = 200;
                                                                                                        res.json({ status: 'password_updated', token_info: 'no_token' });
                                                                                                    } else if (allow_email_notif === 'true'){
                                                                                                        mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Password Updated', 'Your password has been changed successfully!', user_name, 'Your password has been changed successfully!', null, null); //Send mail

                                                                                                        res.statusCode = 200;
                                                                                                        res.json({ status: 'password_updated', token_info: 'no_token' });
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    } else {
                                                                                        let hashed_password = bcrypt.hashSync(password, 10);
                                                                                        
                                                                                        let resultx = await db_query.update_password(hashed_password, user_id);

                                                                                        if (resultx.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (resultx.status === true){
                                                                                            let result = await db_query.get_user_settings(user_id);

                                                                                            if (result.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result.status === true){
                                                                                                let allow_email_notif = result.data[0].allow_email_notif;
                                                                                                
                                                                                                if (allow_email_notif === 'false'){
                                                                                                    res.statusCode = 200;
                                                                                                    res.json({ status: 'password_updated', token_info: 'no_token' });
                                                                                                } else if (allow_email_notif === 'true'){
                                                                                                    mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Password Updated', 'Your password has been changed successfully!', user_name, 'Your password has been changed successfully!', null, null); //Send mail

                                                                                                    res.statusCode = 200;
                                                                                                    res.json({ status: 'password_updated', token_info: 'no_token' });
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                //User does not exist
                                                                                res.statusCode = 404;
                                                                                res.json({ status: 'user_not_found' });
                                                                            }
                                                                        }
                                                                    } else {
                                                                        res.statusCode = 401;
                                                                        res.json({ status: 'invalid_token' });
                                                                    }
                                                                }
                                                            })
                                                        } else {
                                                            res.statusCode = 401;
                                                            res.json({ status: 'invalid_token' });
                                                        }
                                                    }
                                                })
                                            } else {
                                                res.statusCode = 401;
                                                res.json({ status: 'invalid_token' });
                                            }
                                        }
                                    } else {
                                        res.statusCode = 401;
                                        res.json({ status: 'missing_credentials' });
                                    }
                                } else {
                                    res.statusCode = 401;
                                    res.json({ status: 'missing_credentials' });
                                }
                            }
                        } else {
                            res.statusCode = 401;
                            res.json({ status: 'invalid_password' });
                        }
                    }
                }
            } else {
                res.statusCode = 401;
                res.json({ status: 'missing_credentials' });
            }
        } else {
            res.statusCode = 401;
            res.json({ status: 'error_occured' });
        }
    }
}

module.exports = update_user_password;