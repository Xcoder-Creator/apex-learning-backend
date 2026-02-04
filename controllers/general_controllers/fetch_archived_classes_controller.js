const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db_query
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header

const fetch_archived_classes = async (req, res) => {
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
                //Filter and sanitize the request parameters
                let access_token = sanitize_data(form_data.access_token);

                //Validate the request parameters
                if (/^ *$/.test(access_token)){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
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
                                                        if (result.data.length > 0 && result.data.length === 1){
                                                            let user_details = result.data;

                                                            if (user_details[0].role === 'Student'){
                                                                let result1 = await db_query.fetch_records_of_joined_classes(user_id);

                                                                if (result1.status === false){
                                                                    res.statusCode = 500;
                                                                    res.json({ status: 'error_occured' });
                                                                } else if (result1.status === true){
                                                                    if (result1.data.length > 0){
                                                                        let joined_classes = result1.data;
                                                                        let class_codes = [];

                                                                        for (let [i, record] of joined_classes.entries()){
                                                                            let class_code = record.class_code;
                                                                            class_codes.push(class_code);
                                                                        }

                                                                        let archived_classes = [];

                                                                        for (let [i, class_code] of class_codes.entries()){
                                                                            let result2 = await db_query.fetch_archived_classes(class_code);

                                                                            if (result2.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (result2.status === true){
                                                                                if (result2.data.length > 0 && result2.data.length === 1){
                                                                                    let archived_class = result2.data[0];
                                                                                    archived_class['id'] = i;
                                                                                    archived_classes.push(archived_class);
                                                                                }
                                                                            }
                                                                        }

                                                                        if (archived_classes.length > 0){
                                                                            res.statusCode = 200;
                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                            res.json({ status: true, archived_classes: archived_classes, token_info: 'token_available', new_accessToken: new_access_token });
                                                                        } else {
                                                                            res.statusCode = 200;
                                                                            res.json({ status: false });
                                                                        }
                                                                    } else {
                                                                        res.statusCode = 200;
                                                                        res.json({ status: false });
                                                                    }
                                                                }
                                                            } else if (user_details[0].role === 'Teacher'){
                                                                let result1 = await db_query.fetch_archived_classes_for_teacher(user_id);

                                                                if (result1.status === false){
                                                                    res.statusCode = 500;
                                                                    res.json({ status: 'error_occured' });
                                                                } else if (result1.status === true){
                                                                    if (result1.data.length > 0){
                                                                        let archived_classes_array = result1.data;
                                                                        let class_codes = [];

                                                                        for (let [i, record] of archived_classes_array.entries()){
                                                                            let class_code = record.class_code;
                                                                            class_codes.push(class_code);
                                                                        }

                                                                        let archived_classes = [];

                                                                        for (let [i, class_code] of class_codes.entries()){
                                                                            let result2 = await db_query.fetch_archived_classes(class_code);

                                                                            if (result2.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (result2.status === true){
                                                                                if (result2.data.length > 0 && result2.data.length === 1){
                                                                                    let archived_class = result2.data[0];
                                                                                    archived_class['id'] = i;
                                                                                    archived_classes.push(archived_class);
                                                                                }
                                                                            }
                                                                        }

                                                                        if (archived_classes.length > 0){
                                                                            res.statusCode = 200;
                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                            res.json({ status: true, archived_classes: archived_classes, token_info: 'token_available', new_accessToken: new_access_token });
                                                                        } else {
                                                                            res.statusCode = 200;
                                                                            res.json({ status: false });
                                                                        }
                                                                    } else {
                                                                        res.statusCode = 200;
                                                                        res.json({ status: false });
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
                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                let user_details = result.data;

                                                                if (user_details[0].role === 'Student'){
                                                                    let result1 = await db_query.fetch_records_of_joined_classes(user_auth_id);

                                                                    if (result1.status === false){
                                                                        res.statusCode = 500;
                                                                        res.json({ status: 'error_occured' });
                                                                    } else if (result1.status === true){
                                                                        if (result1.data.length > 0){
                                                                            let joined_classes = result1.data;
                                                                            let class_codes = [];

                                                                            for (let [i, record] of joined_classes.entries()){
                                                                                let class_code = record.class_code;
                                                                                class_codes.push(class_code);
                                                                            }

                                                                            let archived_classes = [];

                                                                            for (let [i, class_code] of class_codes.entries()){
                                                                                let result2 = await db_query.fetch_archived_classes(class_code);

                                                                                if (result2.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (result2.status === true){
                                                                                    if (result2.data.length > 0 && result2.data.length === 1){
                                                                                        let archived_class = result2.data[0];
                                                                                        archived_class['id'] = i;
                                                                                        archived_classes.push(archived_class);
                                                                                    }
                                                                                }
                                                                            }

                                                                            if (archived_classes.length > 0){
                                                                                res.statusCode = 200;
                                                                                res.json({ status: true, archived_classes: archived_classes, token_info: 'no_token' });
                                                                            } else {
                                                                                res.statusCode = 200;
                                                                                res.json({ status: false });
                                                                            }
                                                                        } else {
                                                                            res.statusCode = 200;
                                                                            res.json({ status: false });
                                                                        }
                                                                    }
                                                                } else if (user_details[0].role === 'Teacher'){
                                                                    let result1 = await db_query.fetch_archived_classes_for_teacher(user_auth_id);

                                                                    if (result1.status === false){
                                                                        res.statusCode = 500;
                                                                        res.json({ status: 'error_occured' });
                                                                    } else if (result1.status === true){
                                                                        if (result1.data.length > 0){
                                                                            let archived_classes_array = result1.data;
                                                                            let class_codes = [];

                                                                            for (let [i, record] of archived_classes_array.entries()){
                                                                                let class_code = record.class_code;
                                                                                class_codes.push(class_code);
                                                                            }

                                                                            let archived_classes = [];

                                                                            for (let [i, class_code] of class_codes.entries()){
                                                                                let result2 = await db_query.fetch_archived_classes(class_code);

                                                                                if (result2.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (result2.status === true){
                                                                                    if (result2.data.length > 0 && result2.data.length === 1){
                                                                                        let archived_class = result2.data[0];
                                                                                        archived_class['id'] = i;
                                                                                        archived_classes.push(archived_class);
                                                                                    }
                                                                                }
                                                                            }

                                                                            if (archived_classes.length > 0){
                                                                                res.statusCode = 200;
                                                                                res.json({ status: true, archived_classes: archived_classes, token_info: 'no_token' });
                                                                            } else {
                                                                                res.statusCode = 200;
                                                                                res.json({ status: false });
                                                                            }
                                                                        } else {
                                                                            res.statusCode = 200;
                                                                            res.json({ status: false });
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
                                                    if (result.data.length > 0 && result.data.length === 1){
                                                        let user_details = result.data;

                                                        if (user_details[0].role === 'Student'){
                                                            let result1 = await db_query.fetch_records_of_joined_classes(user_id);

                                                            if (result1.status === false){
                                                                res.statusCode = 500;
                                                                res.json({ status: 'error_occured' });
                                                            } else if (result1.status === true){
                                                                if (result1.data.length > 0){
                                                                    let joined_classes = result1.data;
                                                                    let class_codes = [];

                                                                    for (let [i, record] of joined_classes.entries()){
                                                                        let class_code = record.class_code;
                                                                        class_codes.push(class_code);
                                                                    }

                                                                    let archived_classes = [];

                                                                    for (let [i, class_code] of class_codes.entries()){
                                                                        let result2 = await db_query.fetch_archived_classes(class_code);

                                                                        if (result2.status === false){
                                                                            res.statusCode = 500;
                                                                            res.json({ status: 'error_occured' });
                                                                        } else if (result2.status === true){
                                                                            if (result2.data.length > 0 && result2.data.length === 1){
                                                                                let archived_class = result2.data[0];
                                                                                archived_class['id'] = i;
                                                                                archived_classes.push(archived_class);
                                                                            }
                                                                        }
                                                                    }

                                                                    if (archived_classes.length > 0){
                                                                        res.statusCode = 200;
                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                        res.json({ status: true, archived_classes: archived_classes, token_info: 'token_available', new_accessToken: new_access_token });
                                                                    } else {
                                                                        res.statusCode = 200;
                                                                        res.json({ status: false });
                                                                    }
                                                                } else {
                                                                    res.statusCode = 200;
                                                                    res.json({ status: false });
                                                                }
                                                            }    
                                                        } else if (user_details[0].role === 'Teacher'){
                                                            let result1 = await db_query.fetch_archived_classes_for_teacher(user_id);

                                                            if (result1.status === false){
                                                                res.statusCode = 500;
                                                                res.json({ status: 'error_occured' });
                                                            } else if (result1.status === true){
                                                                if (result1.data.length > 0){
                                                                    let archived_classes_array = result1.data;
                                                                    let class_codes = [];

                                                                    for (let [i, record] of archived_classes_array.entries()){
                                                                        let class_code = record.class_code;
                                                                        class_codes.push(class_code);
                                                                    }

                                                                    let archived_classes = [];

                                                                    for (let [i, class_code] of class_codes.entries()){
                                                                        let result2 = await db_query.fetch_archived_classes(class_code);

                                                                        if (result2.status === false){
                                                                            res.statusCode = 500;
                                                                            res.json({ status: 'error_occured' });
                                                                        } else if (result2.status === true){
                                                                            if (result2.data.length > 0 && result2.data.length === 1){
                                                                                let archived_class = result2.data[0];
                                                                                archived_class['id'] = i;
                                                                                archived_classes.push(archived_class);
                                                                            }
                                                                        }
                                                                    }

                                                                    if (archived_classes.length > 0){
                                                                        res.statusCode = 200;
                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                        res.json({ status: true, archived_classes: archived_classes, token_info: 'token_available', new_accessToken: new_access_token });
                                                                    } else {
                                                                        res.statusCode = 200;
                                                                        res.json({ status: false });
                                                                    }
                                                                } else {
                                                                    res.statusCode = 200;
                                                                    res.json({ status: false });
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
                                                        if (result.data.length > 0 && result.data.length === 1){
                                                            let user_details = result.data;

                                                            if (user_details[0].role === 'Student'){
                                                                let result1 = await db_query.fetch_records_of_joined_classes(user_auth_id);

                                                                if (result1.status === false){
                                                                    res.statusCode = 500;
                                                                    res.json({ status: 'error_occured' });
                                                                } else if (result1.status === true){
                                                                    if (result1.data.length > 0){
                                                                        let joined_classes = result1.data;
                                                                        let class_codes = [];

                                                                        for (let [i, record] of joined_classes.entries()){
                                                                            let class_code = record.class_code;
                                                                            class_codes.push(class_code);
                                                                        }

                                                                        let archived_classes = [];

                                                                        for (let [i, class_code] of class_codes.entries()){
                                                                            let result2 = await db_query.fetch_archived_classes(class_code);

                                                                            if (result2.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (result2.status === true){
                                                                                if (result2.data.length > 0 && result2.data.length === 1){
                                                                                    let archived_class = result2.data[0];
                                                                                    archived_class['id'] = i;
                                                                                    archived_classes.push(archived_class);
                                                                                }
                                                                            }
                                                                        }

                                                                        if (archived_classes.length > 0){
                                                                            res.statusCode = 200;
                                                                            res.json({ status: true, archived_classes: archived_classes, token_info: 'no_token' });
                                                                        } else {
                                                                            res.statusCode = 200;
                                                                            res.json({ status: false });
                                                                        }
                                                                    } else {
                                                                        res.statusCode = 200;
                                                                        res.json({ status: false });
                                                                    }
                                                                }
                                                            } else if (user_details[0].role === 'Teacher'){
                                                                let result1 = await db_query.fetch_archived_classes_for_teacher(user_auth_id);

                                                                if (result1.status === false){
                                                                    res.statusCode = 500;
                                                                    res.json({ status: 'error_occured' });
                                                                } else if (result1.status === true){
                                                                    if (result1.data.length > 0){
                                                                        let archived_classes_array = result1.data;
                                                                        let class_codes = [];

                                                                        for (let [i, record] of archived_classes_array.entries()){
                                                                            let class_code = record.class_code;
                                                                            class_codes.push(class_code);
                                                                        }

                                                                        let archived_classes = [];

                                                                        for (let [i, class_code] of class_codes.entries()){
                                                                            let result2 = await db_query.fetch_archived_classes(class_code);

                                                                            if (result2.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (result2.status === true){
                                                                                if (result2.data.length > 0 && result2.data.length === 1){
                                                                                    let archived_class = result2.data[0];
                                                                                    archived_class['id'] = i;
                                                                                    archived_classes.push(archived_class);
                                                                                }
                                                                            }
                                                                        }

                                                                        if (archived_classes.length > 0){
                                                                            res.statusCode = 200;
                                                                            res.json({ status: true, archived_classes: archived_classes, token_info: 'no_token' });
                                                                        } else {
                                                                            res.statusCode = 200;
                                                                            res.json({ status: false });
                                                                        }
                                                                    } else {
                                                                        res.statusCode = 200;
                                                                        res.json({ status: false });
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
    }
}

module.exports = fetch_archived_classes;