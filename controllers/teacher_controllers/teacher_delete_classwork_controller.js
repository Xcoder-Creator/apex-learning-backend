const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db_query
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header

const delete_classwork = async (req, res) => {
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
            if (form_data.access_token && form_data.class_code && form_data.classwork_id){
                //Filter and sanitize the request parameters
                let access_token = sanitize_data(form_data.access_token);
                let class_code = sanitize_data(form_data.class_code);
                let classwork_id = parseInt(form_data.classwork_id, 10);

                //Check if the request parameters are empty or only contains white spaces
                if (/^ *$/.test(access_token)){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    if (/^ *$/.test(class_code)){
                        res.statusCode = 401;
                        res.json({ status: 'missing_credentials' });
                    } else {
                        if (/^ *$/.test(classwork_id)){
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
                                                                    let result = await db_query.check_if_teacher_account(user_id);

                                                                    if (result.status === false){
                                                                        res.statusCode = 500;
                                                                        res.json({ status: 'error_occured' });
                                                                    } else if (result.status === true){
                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                            let result = await db_query.fetch_all_active_class_details(class_code);

                                                                            if (result.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (result.status === true){
                                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                                    let result = await db_query.check_if_teacher_of_class(user_id, class_code);

                                                                                    if (result.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (result.status === true){
                                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                                            let result1 = await db_query.check_if_classwork_exists(classwork_id, class_code);

                                                                                            if (result1.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result1.status === true){
                                                                                                if (result1.data.length > 0 && result1.data.length === 1){
                                                                                                    let result2 = await db_query.delete_classwork(classwork_id, class_code);

                                                                                                    if (result2.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result2.status === true){
                                                                                                        let result3 = await db_query.delete_student_classwork_response(classwork_id, class_code);

                                                                                                        if (result3.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result3.status === true){
                                                                                                            let result3a = await db_query.delete_all_private_comments_for_classwork(classwork_id);

                                                                                                            if (result3a.status === false){
                                                                                                                res.statusCode = 500
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result3a.status === true){
                                                                                                                let result4 = await db_query.fetch_all_classworks(class_code);

                                                                                                                if (result4.status === false){
                                                                                                                    res.statusCode = 500
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result4.status === true){
                                                                                                                    let all_classworks = result4.data;
                                                                                                                    let available_classworks = [];

                                                                                                                    if (all_classworks.length > 0){
                                                                                                                        for (let [i, record] of all_classworks.entries()){
                                                                                                                            let data = {
                                                                                                                                id: i,
                                                                                                                                classwork_id: record.id,
                                                                                                                                title: record.title,
                                                                                                                                date_time: `${record.date_created}, ${record.time_created}`,
                                                                                                                                due_date: `${record.due_date}, ${record.due_time}`,
                                                                                                                                class_code: record.class_code,
                                                                                                                                classwork_type: record.classwork_type,
                                                                                                                                creators_id: record.user_id,
                                                                                                                                is_done: null
                                                                                                                            }

                                                                                                                            available_classworks.push(data);
                                                                                                                        }

                                                                                                                        res.statusCode = 200;
                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                        res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                    } else {
                                                                                                                        res.statusCode = 200;
                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                        res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'token_available', class_code: class_code, new_accessToken: new_access_token });
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                } else {
                                                                                                    res.statusCode = 401;
                                                                                                    res.json({ status: 'classwork_does_not_exist' });
                                                                                                }
                                                                                            }
                                                                                        } else {
                                                                                            res.statusCode = 401;
                                                                                            res.json({ status: 'not_teacher_of_class' });
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    res.statusCode = 404;
                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                    res.json({ status: 'class_does_not_exist', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                }
                                                                            }
                                                                        } else {
                                                                            res.statusCode = 401;
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

                                                                let result = await db_query.check_if_account_verified(user_auth_id);

                                                                if (result.status === false){
                                                                    res.statusCode = 500;
                                                                    res.json({ status: 'error_occured' });
                                                                } else if (result.status === true){
                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                        let result = await db_query.check_if_teacher_account(user_auth_id);

                                                                        if (result.status === false){
                                                                            res.statusCode = 500;
                                                                            res.json({ status: 'error_occured' });
                                                                        } else if (result.status === true){
                                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                                let result = await db_query.fetch_all_active_class_details(class_code);

                                                                                if (result.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (result.status === true){
                                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                                        let result = await db_query.check_if_teacher_of_class(user_id, class_code);

                                                                                        if (result.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (result.status === true){
                                                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                                                let result1 = await db_query.check_if_classwork_exists(classwork_id, class_code);

                                                                                                if (result1.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result1.status === true){
                                                                                                    if (result1.data.length > 0 && result1.data.length === 1){
                                                                                                        let result2 = await db_query.delete_classwork(classwork_id, class_code);

                                                                                                        if (result2.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result2.status === true){
                                                                                                            let result3 = await db_query.delete_student_classwork_response(classwork_id, class_code);

                                                                                                            if (result3.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result3.status === true){
                                                                                                                let result3a = await db_query.delete_all_private_comments_for_classwork(classwork_id);

                                                                                                                if (result3a.status === false){
                                                                                                                    res.statusCode = 500
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result3a.status === true){
                                                                                                                    let result4 = await db_query.fetch_all_classworks(class_code);

                                                                                                                    if (result4.status === false){
                                                                                                                        res.statusCode = 500
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result4.status === true){
                                                                                                                        let all_classworks = result4.data;
                                                                                                                        let available_classworks = [];

                                                                                                                        if (all_classworks.length > 0){
                                                                                                                            for (let [i, record] of all_classworks.entries()){
                                                                                                                                let data = {
                                                                                                                                    id: i,
                                                                                                                                    classwork_id: record.id,
                                                                                                                                    title: record.title,
                                                                                                                                    date_time: `${record.date_created}, ${record.time_created}`,
                                                                                                                                    due_date: `${record.due_date}, ${record.due_time}`,
                                                                                                                                    class_code: record.class_code,
                                                                                                                                    classwork_type: record.classwork_type,
                                                                                                                                    creators_id: record.user_id,
                                                                                                                                    is_done: null
                                                                                                                                }

                                                                                                                                available_classworks.push(data);
                                                                                                                            }

                                                                                                                            res.statusCode = 200;
                                                                                                                            res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'no_token' });
                                                                                                                        } else {
                                                                                                                            res.statusCode = 200;
                                                                                                                            res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'no_token', class_code: class_code });
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    } else {
                                                                                                        res.statusCode = 401;
                                                                                                        res.json({ status: 'classwork_does_not_exist' });
                                                                                                    }
                                                                                                }
                                                                                            } else {
                                                                                                res.statusCode = 401;
                                                                                                res.json({ status: 'not_teacher_of_class' });
                                                                                            }
                                                                                        }
                                                                                    } else {
                                                                                        res.statusCode = 404;
                                                                                        res.json({ status: 'class_does_not_exist', token_info: 'no_token' });
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                res.statusCode = 401;
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
            if (form_data.class_code && form_data.classwork_id){
                //Filter and sanitize the request parameters
                let class_code = sanitize_data(form_data.class_code);
                let classwork_id = parseInt(form_data.classwork_id, 10);

                let access_token = validate_auth_header(req.headers['authorization']);

                if (access_token == null){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    const raw_cookies = JSON.parse(JSON.stringify(req.cookies));

                    if (raw_cookies){
                        if (raw_cookies.hasOwnProperty('apex_auth')){
                            let refresh_token = raw_cookies['apex_auth'];

                            if (/^ *$/.test(class_code)){
                                res.statusCode = 401;
                                res.json({ status: 'missing_credentials' });
                            } else {
                                if (/^ *$/.test(classwork_id)){
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
                                                                        let result = await db_query.check_if_teacher_account(user_id);

                                                                        if (result.status === false){
                                                                            res.statusCode = 500;
                                                                            res.json({ status: 'error_occured' });
                                                                        } else if (result.status === true){
                                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                                let result = await db_query.fetch_all_active_class_details(class_code);

                                                                                if (result.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (result.status === true){
                                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                                        let result = await db_query.check_if_teacher_of_class(user_id, class_code);

                                                                                        if (result.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (result.status === true){
                                                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                                                let result1 = await db_query.check_if_classwork_exists(classwork_id, class_code);

                                                                                                if (result1.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result1.status === true){
                                                                                                    if (result1.data.length > 0 && result1.data.length === 1){
                                                                                                        let result2 = await db_query.delete_classwork(classwork_id, class_code);

                                                                                                        if (result2.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result2.status === true){
                                                                                                            let result3 = await db_query.delete_student_classwork_response(classwork_id, class_code);

                                                                                                            if (result3.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result3.status === true){
                                                                                                                let result3a = await db_query.delete_all_private_comments_for_classwork(classwork_id);

                                                                                                                if (result3a.status === false){
                                                                                                                    res.statusCode = 500
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result3a.status === true){
                                                                                                                    let result4 = await db_query.fetch_all_classworks(class_code);

                                                                                                                    if (result4.status === false){
                                                                                                                        res.statusCode = 500
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result4.status === true){
                                                                                                                        let all_classworks = result4.data;
                                                                                                                        let available_classworks = [];

                                                                                                                        if (all_classworks.length > 0){
                                                                                                                            for (let [i, record] of all_classworks.entries()){
                                                                                                                                let data = {
                                                                                                                                    id: i,
                                                                                                                                    classwork_id: record.id,
                                                                                                                                    title: record.title,
                                                                                                                                    date_time: `${record.date_created}, ${record.time_created}`,
                                                                                                                                    due_date: `${record.due_date}, ${record.due_time}`,
                                                                                                                                    class_code: record.class_code,
                                                                                                                                    classwork_type: record.classwork_type,
                                                                                                                                    creators_id: record.user_id,
                                                                                                                                    is_done: null
                                                                                                                                }

                                                                                                                                available_classworks.push(data);
                                                                                                                            }

                                                                                                                            res.statusCode = 200;
                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                            res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                        } else {
                                                                                                                            res.statusCode = 200;
                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                            res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'token_available', class_code: class_code, new_accessToken: new_access_token });
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    } else {
                                                                                                        res.statusCode = 401;
                                                                                                        res.json({ status: 'classwork_does_not_exist' });
                                                                                                    }
                                                                                                }
                                                                                            } else {
                                                                                                res.statusCode = 401;
                                                                                                res.json({ status: 'not_teacher_of_class' });
                                                                                            }
                                                                                        }
                                                                                    } else {
                                                                                        res.statusCode = 404;
                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                        res.json({ status: 'class_does_not_exist', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                res.statusCode = 401;
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

                                                                    let result = await db_query.check_if_account_verified(user_auth_id);

                                                                    if (result.status === false){
                                                                        res.statusCode = 500;
                                                                        res.json({ status: 'error_occured' });
                                                                    } else if (result.status === true){
                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                            let result = await db_query.check_if_teacher_account(user_auth_id);

                                                                            if (result.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (result.status === true){
                                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                                    let result = await db_query.fetch_all_active_class_details(class_code);

                                                                                    if (result.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (result.status === true){
                                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                                            let result = await db_query.check_if_teacher_of_class(user_id, class_code);

                                                                                            if (result.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result.status === true){
                                                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                                                    let result1 = await db_query.check_if_classwork_exists(classwork_id, class_code);

                                                                                                    if (result1.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result1.status === true){
                                                                                                        if (result1.data.length > 0 && result1.data.length === 1){
                                                                                                            let result2 = await db_query.delete_classwork(classwork_id, class_code);

                                                                                                            if (result2.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result2.status === true){
                                                                                                                let result3 = await db_query.delete_student_classwork_response(classwork_id, class_code);

                                                                                                                if (result3.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result3.status === true){
                                                                                                                    let result3a = await db_query.delete_all_private_comments_for_classwork(classwork_id);

                                                                                                                    if (result3a.status === false){
                                                                                                                        res.statusCode = 500
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result3a.status === true){
                                                                                                                        let result4 = await db_query.fetch_all_classworks(class_code);

                                                                                                                        if (result4.status === false){
                                                                                                                            res.statusCode = 500
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result4.status === true){
                                                                                                                            let all_classworks = result4.data;
                                                                                                                            let available_classworks = [];

                                                                                                                            if (all_classworks.length > 0){
                                                                                                                                for (let [i, record] of all_classworks.entries()){
                                                                                                                                    let data = {
                                                                                                                                        id: i,
                                                                                                                                        classwork_id: record.id,
                                                                                                                                        title: record.title,
                                                                                                                                        date_time: `${record.date_created}, ${record.time_created}`,
                                                                                                                                        due_date: `${record.due_date}, ${record.due_time}`,
                                                                                                                                        class_code: record.class_code,
                                                                                                                                        classwork_type: record.classwork_type,
                                                                                                                                        creators_id: record.user_id,
                                                                                                                                        is_done: null
                                                                                                                                    }

                                                                                                                                    available_classworks.push(data);
                                                                                                                                }

                                                                                                                                res.statusCode = 200;
                                                                                                                                res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'no_token' });
                                                                                                                            } else {
                                                                                                                                res.statusCode = 200;
                                                                                                                                res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'no_token', class_code: class_code });
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        } else {
                                                                                                            res.statusCode = 401;
                                                                                                            res.json({ status: 'classwork_does_not_exist' });
                                                                                                        }
                                                                                                    }
                                                                                                } else {
                                                                                                    res.statusCode = 401;
                                                                                                    res.json({ status: 'not_teacher_of_class' });
                                                                                                }
                                                                                            }
                                                                                        } else {
                                                                                            res.statusCode = 404;
                                                                                            res.json({ status: 'class_does_not_exist', token_info: 'no_token' });
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    res.statusCode = 401;
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
                        res.json({ status: 'missing_credentials' });
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

module.exports = delete_classwork;