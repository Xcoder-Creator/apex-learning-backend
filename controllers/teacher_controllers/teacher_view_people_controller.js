const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db_query
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header

const view_people = async (req, res) => {
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
            if (form_data.access_token && form_data.class_code){
                //Filter and sanitize the request parameters
                let access_token = sanitize_data(form_data.access_token);
                let class_code = sanitize_data(form_data.class_code);

                //Check if the request parameters are empty or only contains white spaces
                if (/^ *$/.test(access_token)){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    if (/^ *$/.test(class_code)){
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
                                                                                        let result2 = await db_query.get_all_students_of_a_class(class_code, user_id);

                                                                                        if (result2.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (result2.status === true){
                                                                                            if (result2.data.length > 0){
                                                                                                let records = result2.data;
                                                                                                let students = [];

                                                                                                for (let [i, record] of records.entries()){
                                                                                                    let student_user_id = record['user_id'];

                                                                                                    let result3 = await db_query.fetch_user_details_using_id(student_user_id);

                                                                                                    if (result3.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result3.status === true){
                                                                                                        if (result3.data.length > 0 && result3.data.length === 1){
                                                                                                            let user_details = result3.data[0];
                                                                                                            user_details['id'] = i;
                                                                                                            students.push(user_details);
                                                                                                        }
                                                                                                    }
                                                                                                }

                                                                                                let result4 = await db_query.get_creator_of_class(class_code);

                                                                                                if (result4.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result4.status === true){
                                                                                                    if (result4.data.length > 0 && result4.data.length === 1){
                                                                                                        let creators_user_id = result4.data[0].creators_user_id;

                                                                                                        let result5 = await db_query.fetch_user_details_using_id(creators_user_id);

                                                                                                        if (result5.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result5.status === true){
                                                                                                            if (result5.data.length > 0 && result5.data.length === 1){
                                                                                                                let details = result5.data[0];

                                                                                                                res.statusCode = 200;
                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                res.json({ status: 'data_available', students: students, teacher: details, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            } else {
                                                                                                let result = await db_query.get_creator_of_class(class_code);

                                                                                                if (result.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result.status === true){
                                                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                                                        let creators_user_id = result.data[0].creators_user_id;

                                                                                                        let result2 = await db_query.fetch_user_details_using_id(creators_user_id);

                                                                                                        if (result2.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result2.status === true){
                                                                                                            if (result2.data.length > 0 && result2.data.length === 1){
                                                                                                                let details = result2.data[0];

                                                                                                                res.statusCode = 200;
                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                res.json({ status: 'no_data', teacher: details, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    } else {
                                                                                        res.statusCode = 401;
                                                                                        res.json({ status: 'not_teacher_of_class' });
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                res.statusCode = 404;
                                                                                res.json({ status: 'class_does_not_exist' });
                                                                            }
                                                                        }
                                                                    } else {
                                                                        res.statusCode = 401;
                                                                        res.json({ status: 'role_error' });
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
                                                            let user_id = user.user_id; //Users authentication id

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
                                                                                            let result2 = await db_query.get_all_students_of_a_class(class_code, user_id);

                                                                                            if (result2.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result2.status === true){
                                                                                                if (result2.data.length > 0){
                                                                                                    let records = result2.data;
                                                                                                    let students = [];

                                                                                                    for (let [i, record] of records.entries()){
                                                                                                        let student_user_id = record['user_id'];

                                                                                                        let result3 = await db_query.fetch_user_details_using_id(student_user_id);

                                                                                                        if (result3.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result3.status === true){
                                                                                                            if (result3.data.length > 0 && result3.data.length === 1){
                                                                                                                let user_details = result3.data[0];
                                                                                                                user_details['id'] = i;
                                                                                                                students.push(user_details);
                                                                                                            }
                                                                                                        }
                                                                                                    }

                                                                                                    let result4 = await db_query.get_creator_of_class(class_code);

                                                                                                    if (result4.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result4.status === true){
                                                                                                        if (result4.data.length > 0 && result4.data.length === 1){
                                                                                                            let creators_user_id = result4.data[0].creators_user_id;

                                                                                                            let result5 = await db_query.fetch_user_details_using_id(creators_user_id);

                                                                                                            if (result5.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result5.status === true){
                                                                                                                if (result5.data.length > 0 && result5.data.length === 1){
                                                                                                                    let details = result5.data[0];

                                                                                                                    res.statusCode = 200;
                                                                                                                    res.json({ status: 'data_available', students: students, teacher: details, token_info: 'no_token' });
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                } else {
                                                                                                    let result = await db_query.get_creator_of_class(class_code);

                                                                                                    if (result.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result.status === true){
                                                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                                                            let creators_user_id = result.data[0].creators_user_id;

                                                                                                            let result2 = await db_query.fetch_user_details_using_id(creators_user_id);

                                                                                                            if (result2.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result2.status === true){
                                                                                                                if (result2.data.length > 0 && result2.data.length === 1){
                                                                                                                    let details = result2.data[0];

                                                                                                                    res.statusCode = 200;
                                                                                                                    res.json({ status: 'no_data', teacher: details, token_info: 'no_token' });
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        } else {
                                                                                            res.statusCode = 401;
                                                                                            res.json({ status: 'not_teacher_of_class' });
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    res.statusCode = 404;
                                                                                    res.json({ status: 'class_does_not_exist' });
                                                                                }
                                                                            }
                                                                        } else {
                                                                            res.statusCode = 401;
                                                                            res.json({ status: 'role_error' });
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
            if (form_data.class_code){
                //Filter and sanitize the request parameters
                let class_code = sanitize_data(form_data.class_code);

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
                                                                                            let result2 = await db_query.get_all_students_of_a_class(class_code, user_id);

                                                                                            if (result2.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result2.status === true){
                                                                                                if (result2.data.length > 0){
                                                                                                    let records = result2.data;
                                                                                                    let students = [];

                                                                                                    for (let [i, record] of records.entries()){
                                                                                                        let student_user_id = record['user_id'];

                                                                                                        let result3 = await db_query.fetch_user_details_using_id(student_user_id);

                                                                                                        if (result3.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result3.status === true){
                                                                                                            if (result3.data.length > 0 && result3.data.length === 1){
                                                                                                                let user_details = result3.data[0];
                                                                                                                user_details['id'] = i;
                                                                                                                students.push(user_details);
                                                                                                            }
                                                                                                        }
                                                                                                    }

                                                                                                    let result4 = await db_query.get_creator_of_class(class_code);

                                                                                                    if (result4.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result4.status === true){
                                                                                                        if (result4.data.length > 0 && result4.data.length === 1){
                                                                                                            let creators_user_id = result4.data[0].creators_user_id;

                                                                                                            let result5 = await db_query.fetch_user_details_using_id(creators_user_id);

                                                                                                            if (result5.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result5.status === true){
                                                                                                                if (result5.data.length > 0 && result5.data.length === 1){
                                                                                                                    let details = result5.data[0];

                                                                                                                    res.statusCode = 200;
                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                    res.json({ status: 'data_available', students: students, teacher: details, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                } else {
                                                                                                    let result = await db_query.get_creator_of_class(class_code);

                                                                                                    if (result.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result.status === true){
                                                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                                                            let creators_user_id = result.data[0].creators_user_id;

                                                                                                            let result2 = await db_query.fetch_user_details_using_id(creators_user_id);

                                                                                                            if (result2.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result2.status === true){
                                                                                                                if (result2.data.length > 0 && result2.data.length === 1){
                                                                                                                    let details = result2.data[0];

                                                                                                                    res.statusCode = 200;
                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                    res.json({ status: 'no_data', teacher: details, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        } else {
                                                                                            res.statusCode = 401;
                                                                                            res.json({ status: 'not_teacher_of_class' });
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    res.statusCode = 404;
                                                                                    res.json({ status: 'class_does_not_exist' });
                                                                                }
                                                                            }
                                                                        } else {
                                                                            res.statusCode = 401;
                                                                            res.json({ status: 'role_error' });
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
                                                                let user_id = user.user_id; //Users authentication id

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
                                                                                                let result2 = await db_query.get_all_students_of_a_class(class_code, user_id);

                                                                                                if (result2.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result2.status === true){
                                                                                                    if (result2.data.length > 0){
                                                                                                        let records = result2.data;
                                                                                                        let students = [];

                                                                                                        for (let [i, record] of records.entries()){
                                                                                                            let student_user_id = record['user_id'];

                                                                                                            let result3 = await db_query.fetch_user_details_using_id(student_user_id);

                                                                                                            if (result3.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result3.status === true){
                                                                                                                if (result3.data.length > 0 && result3.data.length === 1){
                                                                                                                    let user_details = result3.data[0];
                                                                                                                    user_details['id'] = i;
                                                                                                                    students.push(user_details);
                                                                                                                }
                                                                                                            }
                                                                                                        }

                                                                                                        let result4 = await db_query.get_creator_of_class(class_code);

                                                                                                        if (result4.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result4.status === true){
                                                                                                            if (result4.data.length > 0 && result4.data.length === 1){
                                                                                                                let creators_user_id = result4.data[0].creators_user_id;

                                                                                                                let result5 = await db_query.fetch_user_details_using_id(creators_user_id);

                                                                                                                if (result5.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result5.status === true){
                                                                                                                    if (result5.data.length > 0 && result5.data.length === 1){
                                                                                                                        let details = result5.data[0];

                                                                                                                        res.statusCode = 200;
                                                                                                                        res.json({ status: 'data_available', students: students, teacher: details, token_info: 'no_token' });
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    } else {
                                                                                                        let result = await db_query.get_creator_of_class(class_code);

                                                                                                        if (result.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result.status === true){
                                                                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                                                                let creators_user_id = result.data[0].creators_user_id;

                                                                                                                let result2 = await db_query.fetch_user_details_using_id(creators_user_id);

                                                                                                                if (result2.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result2.status === true){
                                                                                                                    if (result2.data.length > 0 && result2.data.length === 1){
                                                                                                                        let details = result2.data[0];

                                                                                                                        res.statusCode = 200;
                                                                                                                        res.json({ status: 'no_data', teacher: details, token_info: 'no_token' });
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            } else {
                                                                                                res.statusCode = 401;
                                                                                                res.json({ status: 'not_teacher_of_class' });
                                                                                            }
                                                                                        }
                                                                                    } else {
                                                                                        res.statusCode = 404;
                                                                                        res.json({ status: 'class_does_not_exist' });
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                res.statusCode = 401;
                                                                                res.json({ status: 'role_error' });
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

module.exports = view_people;