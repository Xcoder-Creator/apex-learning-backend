const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db model
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token

//Logged in module
const logged_in = async (req, res) => {
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
            if (form_data.access_token){
                let access_token = sanitize_data(form_data.access_token);

                if (/^ *$/.test(access_token)){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    let refresh_token = validate_auth_header(req.headers['authorization']);

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
                                                        if (result.data.length > 0 && result.data.length === 1){
                                                            res.statusCode = 200;
                                                            var user_name = result.data[0].name;
                                                            var user_email = result.data[0].email;
                                                            var role = result.data[0].role;
                                                            var user_id_value = result.data[0].id;
                                                            var profile_img = result.data[0].profile_image;

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

                                                                    res.statusCode = 200;
                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                    res.json({ status: true, token_info: 'token_available', user_settings: user_settings, details: { user_name: user_name, user_email: user_email, user_role: role, user_id: user_id_value, user_profile_image: profile_img, value: true }, new_accessToken: new_access_token });
                                                                } else {
                                                                    res.statusCode = 401;
                                                                    res.json({ status: 'error_occured' });
                                                                }
                                                            }
                                                        } else {
                                                            res.statusCode = 404;
                                                            res.json({ status: false });
                                                        }
                                                    }
                                                } else {
                                                    let status = user.status;

                                                    if (status === 'user_direct_access_token'){
                                                        let result = await db_query.check_if_account_verified(user_id);

                                                        if (result.status === false){
                                                            res.statusCode = 500;
                                                            res.json({ status: 'error_occured' });
                                                        } else if (result.status === true){
                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                res.statusCode = 200;
                                                                var user_name = result.data[0].name;
                                                                var user_email = result.data[0].email;
                                                                var role = result.data[0].role;
                                                                var profile_img = result.data[0].profile_image;
                                                                var user_id_value = result.data[0].id;

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

                                                                        res.statusCode = 200;
                                                                        res.json({ status: true, token_info: 'no_token', user_settings: user_settings, details: { user_name: user_name, user_email: user_email, user_role: role, user_id: user_id_value, user_profile_image: profile_img, value: true } });
                                                                    } else {
                                                                        res.statusCode = 401;
                                                                        res.json({ status: 'error_occured' });
                                                                    }
                                                                }
                                                            } else {
                                                                res.statusCode = 404;
                                                                res.json({ status: false });
                                                            }
                                                        }
                                                    } else {
                                                        res.statusCode = 401;
                                                        res.json({ status: 'no_access' });
                                                    }
                                                }
                                            });
                                        } else {
                                            res.statusCode = 401;
                                            res.json({ status: 'no_access' });
                                        }
                                    }
                                });
                            } else {
                                res.statusCode = 401;
                                res.json({ status: 'no_access' });
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
                                            res.clearCookie('apex_auth');
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
                                                        if (result.data.length > 0 && result.data.length === 1){
                                                            res.statusCode = 200;
                                                            var user_name = result.data[0].name;
                                                            var user_email = result.data[0].email;
                                                            var role = result.data[0].role;
                                                            var user_id_value = result.data[0].id;
                                                            var profile_img = result.data[0].profile_image;

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

                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                    res.json({ status: true, token_info: 'token_available', user_settings: user_settings, details: { user_name: user_name, user_email: user_email, user_role: role, user_id: user_id_value, user_profile_image: profile_img, value: true }, new_accessToken: new_access_token });
                                                                } else {
                                                                    res.statusCode = 401;
                                                                    res.json({ status: 'error_occured' });
                                                                }
                                                            }
                                                        } else {
                                                            res.statusCode = 404;
                                                            res.json({ status: false });
                                                        }
                                                    }
                                                } else {
                                                    let status = user.status;

                                                    if (status === 'user_direct_access_token'){
                                                        let result = await db_query.check_if_account_verified(user_id);

                                                        if (result.status === false){
                                                            res.statusCode = 500;
                                                            res.json({ status: 'error_occured' });
                                                        } else if (result.status === true){
                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                res.statusCode = 200;
                                                                var user_name = result.data[0].name;
                                                                var user_email = result.data[0].email;
                                                                var role = result.data[0].role;
                                                                var profile_img = result.data[0].profile_image;
                                                                var user_id_value = result.data[0].id;

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

                                                                        res.statusCode = 200;
                                                                        res.json({ status: true, token_info: 'no_token', user_settings: user_settings, details: { user_name: user_name, user_email: user_email, user_role: role, user_id: user_id_value, user_profile_image: profile_img, value: true } });
                                                                    } else {
                                                                        res.statusCode = 401;
                                                                        res.json({ status: 'error_occured' });
                                                                    }
                                                                }        
                                                            } else {
                                                                res.statusCode = 404;
                                                                res.json({ status: false });
                                                            }
                                                        }
                                                    } else {
                                                        res.statusCode = 401;
                                                        res.json({ status: 'no_access' });
                                                    }
                                                }
                                            });
                                        } else {
                                            res.statusCode = 401;
                                            res.json({ status: 'no_access' });
                                        }
                                    }
                                });
                            } else {
                                res.statusCode = 401;
                                res.json({ status: 'no_access' });
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
            res.json({ status: 'error_occured' });
        }
    }
}

module.exports = logged_in;