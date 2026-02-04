const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db_query
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate_auth_header
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate_access_token

const fetch_class_details = async (req, res) => {
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

                //Filter and sanitize the access token
                let access_token = sanitize_data(form_data.access_token);

                //Check if the access token is empty or only contains white spaces
                if (/^ *$/.test(access_token)){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    let refresh_token = validate_auth_header(req.headers['authorization']); //Validate the auth header to get the refresh token

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
                                                            let result = await db_query.check_if_teacher_account(user_id);

                                                            if (result.status === false){
                                                                res.statusCode = 500;
                                                                res.json({ status: 'error_occured' });
                                                            } else if (result.status === true){
                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                    let result = await db_query.fetch_created_classes_by_teacher(user_id);

                                                                    if (result.status === false){
                                                                        res.statusCode = 500;
                                                                        res.json({ status: 'error_occured' });
                                                                    } else if (result.status === true){
                                                                        if (result.data.length > 0){
                                                                            var created_classes = result.data;
                                                                            var active_classes = [];

                                                                            for (let [i, record] of created_classes.entries()){
                                                                                let class_code = record.class_code;

                                                                                let result = await db_query.fetch_class_details(class_code);

                                                                                if (result.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (result.status === true){
                                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                                        var class_data = result.data[0];
                                                                                        let teacher_id = class_data.creators_user_id;

                                                                                        let result2 = await db_query.check_if_teacher_account(teacher_id);

                                                                                        if (result2.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (result2.status === true){
                                                                                            if (result2.data.length > 0 && result2.data.length === 1){
                                                                                                var teacher_name = result2.data[0].name;
                                                                                                class_data['teacher_name'] = teacher_name;
                                                                                                class_data['id'] = i;
                                                                                                class_data['creators_user_id'] = user_id;
                                                                                                active_classes.push(class_data);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }

                                                                            if (active_classes.length > 0){
                                                                                for (let [i, record] of active_classes.entries()) {
                                                                                    record['id'] = i;
                                                                                }
                                                                                res.statusCode = 200;
                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                res.json({ status: 'details_fetched_successfully', token_info: 'token_available', new_accessToken: new_access_token, details: active_classes });
                                                                            } else {
                                                                                res.statusCode = 200;
                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                res.json({ status: 'details_fetched_successfully', token_info: 'token_available', new_accessToken: new_access_token, details: [] });
                                                                            }
                                                                        } else {
                                                                            res.statusCode = 200;
                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                            res.json({ status: 'details_fetched_successfully', token_info: 'token_available', new_accessToken: new_access_token, details: [] });
                                                                        }
                                                                    }
                                                                } else {
                                                                    res.statusCode = 401;
                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                    res.json({ status: 'role_error'});
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

                                                        let result = await db_query.check_if_teacher_account(user_auth_id);

                                                        if (result.status === false){
                                                            res.statusCode = 500;
                                                            res.json({ status: 'error_occured' });
                                                        } else if (result.status === true){
                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                let result = await db_query.fetch_created_classes_by_teacher(user_auth_id);

                                                                if (result.status === false){
                                                                    res.statusCode = 500;
                                                                    res.json({ status: 'error_occured' });
                                                                } else if (result.status === true){
                                                                    if (result.data.length > 0){
                                                                        var created_classes = result.data;
                                                                        var active_classes = [];

                                                                        for (let [i, record] of created_classes.entries()){
                                                                            let class_code = record.class_code;

                                                                            let result = await db_query.fetch_class_details(class_code);

                                                                            if (result.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (result.status === true){
                                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                                    var class_data = result.data[0];
                                                                                    let teacher_id = class_data.creators_user_id;

                                                                                    let result2 = await db_query.check_if_teacher_account(teacher_id);

                                                                                    if (result2.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (result2.status === true){
                                                                                        if (result2.data.length > 0 && result2.data.length === 1){
                                                                                            var teacher_name = result2.data[0].name;
                                                                                            class_data['teacher_name'] = teacher_name;
                                                                                            class_data['id'] = i;
                                                                                            class_data['creators_user_id'] = user_auth_id;
                                                                                            active_classes.push(class_data);
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }

                                                                        if (active_classes.length > 0){
                                                                            for (let [i, record] of active_classes.entries()) {
                                                                                record['id'] = i;
                                                                            }
                                                                            res.statusCode = 200;
                                                                            res.json({ status: 'details_fetched_successfully', token_info: 'no_token', details: active_classes });
                                                                        } else {
                                                                            res.statusCode = 200;
                                                                            res.json({ status: 'details_fetched_successfully', token_info: 'no_token', details: [] });
                                                                        }
                                                                    } else {
                                                                        res.statusCode = 200;
                                                                        res.json({ status: 'details_fetched_successfully', token_info: 'no_token', details: [] });
                                                                    }
                                                                }
                                                            } else {
                                                                res.statusCode = 401;
                                                                res.json({ status: 'role_error'});
                                                            }
                                                        }
                                                    } else {
                                                        res.statusCode = 401;
                                                        res.json({ status: 'invalid_token' });
                                                    }
                                                }
                                            });
                                        } else {
                                            res.statusCode = 401;
                                            res.json({ status: 'invalid_token' });
                                        }
                                    }
                                })
                            } else {
                                res.statusCode = 401;
                                res.json({ status: 'missing_credentials' });
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
                                                            let result = await db_query.check_if_teacher_account(user_id);

                                                            if (result.status === false){
                                                                res.statusCode = 500;
                                                                res.json({ status: 'error_occured' });
                                                            } else if (result.status === true){
                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                    let result = await db_query.fetch_created_classes_by_teacher(user_id);

                                                                    if (result.status === false){
                                                                        res.statusCode = 500;
                                                                        res.json({ status: 'error_occured' });
                                                                    } else if (result.status === true){
                                                                        if (result.data.length > 0){
                                                                            var created_classes = result.data;
                                                                            var active_classes = [];

                                                                            for (let [i, record] of created_classes.entries()){
                                                                                let class_code = record.class_code;

                                                                                let result = await db_query.fetch_class_details(class_code);

                                                                                if (result.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (result.status === true){
                                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                                        var class_data = result.data[0];
                                                                                        let teacher_id = class_data.creators_user_id;

                                                                                        let result2 = await db_query.check_if_teacher_account(teacher_id);

                                                                                        if (result2.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (result2.status === true){
                                                                                            if (result2.data.length > 0 && result2.data.length === 1){
                                                                                                var teacher_name = result2.data[0].name;
                                                                                                class_data['teacher_name'] = teacher_name;
                                                                                                class_data['id'] = i;
                                                                                                class_data['creators_user_id'] = user_id;
                                                                                                active_classes.push(class_data);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }

                                                                            if (active_classes.length > 0){
                                                                                for (let [i, record] of active_classes.entries()) {
                                                                                    record['id'] = i;
                                                                                }
                                                                                res.statusCode = 200;
                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                res.json({ status: 'details_fetched_successfully', token_info: 'token_available', new_accessToken: new_access_token, details: active_classes });
                                                                            } else {
                                                                                res.statusCode = 200;
                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                res.json({ status: 'details_fetched_successfully', token_info: 'token_available', new_accessToken: new_access_token, details: [] });
                                                                            }
                                                                        } else {
                                                                            res.statusCode = 200;
                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                            res.json({ status: 'details_fetched_successfully', token_info: 'token_available', new_accessToken: new_access_token, details: [] });
                                                                        }
                                                                    }
                                                                } else {
                                                                    res.statusCode = 401;
                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                    res.json({ status: 'role_error'});
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

                                                        let result = await db_query.check_if_teacher_account(user_auth_id);

                                                        if (result.status === false){
                                                            res.statusCode = 500;
                                                            res.json({ status: 'error_occured' });
                                                        } else if (result.status === true){
                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                let result = await db_query.fetch_created_classes_by_teacher(user_auth_id);

                                                                if (result.status === false){
                                                                    res.statusCode = 500;
                                                                    res.json({ status: 'error_occured' });
                                                                } else if (result.status === true){
                                                                    if (result.data.length > 0){
                                                                        var created_classes = result.data;
                                                                        var active_classes = [];

                                                                        for (let [i, record] of created_classes.entries()){
                                                                            let class_code = record.class_code;

                                                                            let result = await db_query.fetch_class_details(class_code);

                                                                            if (result.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (result.status === true){
                                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                                    var class_data = result.data[0];
                                                                                    let teacher_id = class_data.creators_user_id;

                                                                                    let result2 = await db_query.check_if_teacher_account(teacher_id);

                                                                                    if (result2.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (result2.status === true){
                                                                                        if (result2.data.length > 0 && result2.data.length === 1){
                                                                                            var teacher_name = result2.data[0].name;
                                                                                            class_data['teacher_name'] = teacher_name;
                                                                                            class_data['id'] = i;
                                                                                            class_data['creators_user_id'] = user_auth_id
                                                                                            active_classes.push(class_data);
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }

                                                                        if (active_classes.length > 0){
                                                                            for (let [i, record] of active_classes.entries()) {
                                                                                record['id'] = i;
                                                                            }
                                                                            res.statusCode = 200;
                                                                            res.json({ status: 'details_fetched_successfully', token_info: 'no_token', details: active_classes });
                                                                        } else {
                                                                            res.statusCode = 200;
                                                                            res.json({ status: 'details_fetched_successfully', token_info: 'no_token', details: [] });
                                                                        }
                                                                    } else {
                                                                        res.statusCode = 200;
                                                                        res.json({ status: 'details_fetched_successfully', token_info: 'no_token', details: [] });
                                                                    }
                                                                }
                                                            } else {
                                                                res.statusCode = 401;
                                                                res.json({ status: 'role_error'});
                                                            }
                                                        }
                                                    } else {
                                                        res.statusCode = 401;
                                                        res.json({ status: 'invalid_token' });
                                                    }
                                                }
                                            });
                                        } else {
                                            res.statusCode = 401;
                                            res.json({ status: 'invalid_token' });
                                        }
                                    }
                                })
                            } else {
                                res.statusCode = 401;
                                res.json({ status: 'missing_credentials' });
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
        //----------------------------------------------
    }
}

module.exports = fetch_class_details;