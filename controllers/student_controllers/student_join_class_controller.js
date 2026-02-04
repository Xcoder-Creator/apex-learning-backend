const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db model
const mail_service = require('../../utility/mail_service.util'); //Import mail service
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header
const fs = require('fs');

const join_class = async (req, res) => {
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

                //Filter and sanitize the access token and class code
                let access_token = sanitize_data(form_data.access_token);
                let class_code = sanitize_data(form_data.class_code);

                //Check if the access token is empty or only contains white spaces
                if (/^ *$/.test(access_token)){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    if (/^ *$/.test(class_code)){
                        res.statusCode = 401;
                        res.json({ status: 'missing_class_code' });
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
                                                                let result = await db_query.check_if_student_account(user_id);

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
                                                                                let result = await db_query.check_if_user_part_of_class(user_id, class_code);

                                                                                if (result.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (result.status === true){
                                                                                    if (result.data.length > 0){
                                                                                        res.statusCode = 401;
                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                        res.json({ status: 'already_joined_class', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                    } else if (result.data.length === 0){
                                                                                        let result = await db_query.join_class(user_id, class_code);

                                                                                        if (result.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (result.status === true){
                                                                                            if (fs.existsSync(`public/class_folders/${class_code}/public/attachments/${user_id}`)){
                                                                                                // Nothing
                                                                                            } else {
                                                                                                fs.mkdirSync(`public/class_folders/${class_code}/public/attachments/${user_id}`);
                                                                                            }

                                                                                            let result = await db_query.fetch_joined_classes(user_id);

                                                                                            if (result.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result.status === true){
                                                                                                if (result.data.length > 0){
                                                                                                    var joined_classes = result.data;
                                                                                                    var active_classes = [];

                                                                                                    for (let [i, record] of joined_classes.entries()){
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
                                                                                                                        delete class_data['creators_user_id'];
                                                                                                                        class_data['id'] = i;
                                                                                                                        active_classes.push(class_data);
                                                                                                                    }
                                                                                                                }
                                                                                                            } else {
                                                                                                                //Do nothing
                                                                                                            }
                                                                                                        }
                                                                                                    }

                                                                                                    if (active_classes.length > 0){
                                                                                                        for (let [i, record] of active_classes.entries()) {
                                                                                                            record['id'] = i;
                                                                                                        }

                                                                                                        let result1 = await db_query.fetch_class_details(class_code);

                                                                                                        if (result1.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result1.status === true){
                                                                                                            var teacher_user_id = result1.data[0].creators_user_id;
                                                                                                            var class_name = result1.data[0].class_name;

                                                                                                            let result2 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                            if (result2.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result2.status === true){
                                                                                                                var teacher_email = result2.data[0].email;
                                                                                                                var teacher_name = result2.data[0].name;

                                                                                                                let result3 = await db_query.get_user_settings(teacher_user_id);

                                                                                                                if (result3.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result3.status === true){
                                                                                                                    let allow_email_notif = result3.data[0].allow_email_notif;

                                                                                                                    if (allow_email_notif === 'true'){
                                                                                                                        mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `A new student has joined your class: "${class_name}"`, teacher_name, `<p style="font-weight: 400;"><b>A new student has joined your class: "${class_name}". Click the link below to view all the students of your class:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/teacher/people?class_code=${class_code}">${process.env.URL}/teacher/people?class_code=${class_code}</a></p>`, null, null); //Send mail

                                                                                                                        res.statusCode = 200;
                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                        res.json({ status: 'joined_class_successfully', token_info: 'token_available', class_code: class_code, details: active_classes, new_accessToken: new_access_token });
                                                                                                                    } else if (allow_email_notif === 'false'){
                                                                                                                        res.statusCode = 200;
                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                        res.json({ status: 'joined_class_successfully', token_info: 'token_available', class_code: class_code, details: active_classes, new_accessToken: new_access_token });
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
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

                                                            let result = await db_query.check_if_account_verified(user_auth_id);

                                                            if (result.status === false){
                                                                res.statusCode = 500;
                                                                res.json({ status: 'error_occured' });
                                                            } else if (result.status === true){
                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                    let result = await db_query.check_if_student_account(user_auth_id);

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
                                                                                    let result = await db_query.check_if_user_part_of_class(user_auth_id, class_code);

                                                                                    if (result.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (result.status === true){
                                                                                        if (result.data.length > 0){
                                                                                            res.statusCode = 401;
                                                                                            res.json({ status: 'already_joined_class', token_info: 'no_token' });
                                                                                        } else if (result.data.length === 0){
                                                                                            let result = await db_query.join_class(user_auth_id, class_code);

                                                                                            if (result.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result.status === true){
                                                                                                if (fs.existsSync(`public/class_folders/${class_code}/public/attachments/${user_auth_id}`)){
                                                                                                    // Nothing
                                                                                                } else {
                                                                                                    fs.mkdirSync(`public/class_folders/${class_code}/public/attachments/${user_auth_id}`);
                                                                                                }

                                                                                                let result = await db_query.fetch_joined_classes(user_auth_id);

                                                                                                if (result.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result.status === true){
                                                                                                    if (result.data.length > 0){
                                                                                                        var joined_classes = result.data;
                                                                                                        var active_classes = [];

                                                                                                        for (let [i, record] of joined_classes.entries()){
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
                                                                                                                            delete class_data['creators_user_id'];
                                                                                                                            class_data['id'] = i;
                                                                                                                            active_classes.push(class_data);
                                                                                                                        }
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    //Do nothing
                                                                                                                }
                                                                                                            }
                                                                                                        }

                                                                                                        if (active_classes.length > 0){
                                                                                                            for (let [i, record] of active_classes.entries()) {
                                                                                                                record['id'] = i;
                                                                                                            }

                                                                                                            let result1 = await db_query.fetch_class_details(class_code);

                                                                                                            if (result1.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result1.status === true){
                                                                                                                var teacher_user_id = result1.data[0].creators_user_id;
                                                                                                                var class_name = result1.data[0].class_name;

                                                                                                                let result2 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                                if (result2.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result2.status === true){
                                                                                                                    var teacher_email = result2.data[0].email;
                                                                                                                    var teacher_name = result2.data[0].name;

                                                                                                                    let result3 = await db_query.get_user_settings(teacher_user_id);

                                                                                                                    if (result3.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result3.status === true){
                                                                                                                        let allow_email_notif = result3.data[0].allow_email_notif;

                                                                                                                        if (allow_email_notif === 'true'){
                                                                                                                            mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `A new student has joined your class: "${class_name}"`, teacher_name, `<p style="font-weight: 400;"><b>A new student has joined your class: "${class_name}". Click the link below to view all the students of your class:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/teacher/people?class_code=${class_code}">${process.env.URL}/teacher/people?class_code=${class_code}</a></p>`, null, null); //Send mail

                                                                                                                            res.statusCode = 200;
                                                                                                                            res.json({ status: 'joined_class_successfully', token_info: 'no_token', class_code: class_code, details: active_classes });
                                                                                                                        } else if (allow_email_notif === 'false'){
                                                                                                                            res.statusCode = 200;
                                                                                                                            res.json({ status: 'joined_class_successfully', token_info: 'no_token', class_code: class_code, details: active_classes });
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
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
                                                });
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

                //Filter and sanitize class code
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
                                res.json({ status: 'missing_class_code' });
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
                                                                    let result = await db_query.check_if_student_account(user_id);

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
                                                                                    let result = await db_query.check_if_user_part_of_class(user_id, class_code);

                                                                                    if (result.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (result.status === true){
                                                                                        if (result.data.length > 0){
                                                                                            res.statusCode = 401;
                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                            res.json({ status: 'already_joined_class', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                        } else if (result.data.length === 0){
                                                                                            let result = await db_query.join_class(user_id, class_code);

                                                                                            if (result.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result.status === true){
                                                                                                if (fs.existsSync(`public/class_folders/${class_code}/public/attachments/${user_id}`)){
                                                                                                    // Nothing
                                                                                                } else {
                                                                                                    fs.mkdirSync(`public/class_folders/${class_code}/public/attachments/${user_id}`);
                                                                                                }

                                                                                                let result = await db_query.fetch_joined_classes(user_id);

                                                                                                if (result.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result.status === true){
                                                                                                    if (result.data.length > 0){
                                                                                                        var joined_classes = result.data;
                                                                                                        var active_classes = [];

                                                                                                        for (let [i, record] of joined_classes.entries()){
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
                                                                                                                            delete class_data['creators_user_id'];
                                                                                                                            class_data['id'] = i;
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
                                                                                                            
                                                                                                            let result1 = await db_query.fetch_class_details(class_code);

                                                                                                            if (result1.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result1.status === true){
                                                                                                                var teacher_user_id = result1.data[0].creators_user_id;
                                                                                                                var class_name = result1.data[0].class_name;

                                                                                                                let result2 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                                if (result2.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result2.status === true){
                                                                                                                    var teacher_email = result2.data[0].email;
                                                                                                                    var teacher_name = result2.data[0].name;

                                                                                                                    let result3 = await db_query.get_user_settings(teacher_user_id);

                                                                                                                    if (result3.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result3.status === true){
                                                                                                                        let allow_email_notif = result3.data[0].allow_email_notif;

                                                                                                                        if (allow_email_notif === 'true'){
                                                                                                                            mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `A new student has joined your class: "${class_name}"`, teacher_name, `<p style="font-weight: 400;"><b>A new student has joined your class: "${class_name}". Click the link below to view all the students of your class:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/teacher/people?class_code=${class_code}">${process.env.URL}/teacher/people?class_code=${class_code}</a></p>`, null, null); //Send mail

                                                                                                                            res.statusCode = 200;
                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                            res.json({ status: 'joined_class_successfully', token_info: 'token_available', class_code: class_code, details: active_classes, new_accessToken: new_access_token });
                                                                                                                        } else if (allow_email_notif === 'false'){
                                                                                                                            res.statusCode = 200;
                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                            res.json({ status: 'joined_class_successfully', token_info: 'token_available', class_code: class_code, details: active_classes, new_accessToken: new_access_token });
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
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

                                                                let result = await db_query.check_if_account_verified(user_auth_id);

                                                                if (result.status === false){
                                                                    res.statusCode = 500;
                                                                    res.json({ status: 'error_occured' });
                                                                } else if (result.status === true){
                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                        let result = await db_query.check_if_student_account(user_auth_id);

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
                                                                                        let result = await db_query.check_if_user_part_of_class(user_auth_id, class_code);

                                                                                        if (result.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (result.status === true){
                                                                                            if (result.data.length > 0){
                                                                                                res.statusCode = 401;
                                                                                                res.json({ status: 'already_joined_class', token_info: 'no_token' });
                                                                                            } else if (result.data.length === 0){
                                                                                                let result = await db_query.join_class(user_auth_id, class_code);

                                                                                                if (result.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result.status === true){
                                                                                                    if (fs.existsSync(`public/class_folders/${class_code}/public/attachments/${user_auth_id}`)){
                                                                                                        // Nothing
                                                                                                    } else {
                                                                                                        fs.mkdirSync(`public/class_folders/${class_code}/public/attachments/${user_auth_id}`);
                                                                                                    }

                                                                                                    let result = await db_query.fetch_joined_classes(user_auth_id);

                                                                                                    if (result.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result.status === true){
                                                                                                        if (result.data.length > 0){
                                                                                                            var joined_classes = result.data;
                                                                                                            var active_classes = [];

                                                                                                            for (let [i, record] of joined_classes.entries()){
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
                                                                                                                                delete class_data['creators_user_id'];
                                                                                                                                class_data['id'] = i;
                                                                                                                                active_classes.push(class_data);
                                                                                                                            }
                                                                                                                        }
                                                                                                                    } else {
                                                                                                                        //Do nothing
                                                                                                                    }
                                                                                                                }
                                                                                                            }

                                                                                                            if (active_classes.length > 0){
                                                                                                                for (let [i, record] of active_classes.entries()) {
                                                                                                                    record['id'] = i;
                                                                                                                }
                                                                                                                
                                                                                                                let result1 = await db_query.fetch_class_details(class_code);

                                                                                                                if (result1.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result1.status === true){
                                                                                                                    var teacher_user_id = result1.data[0].creators_user_id;
                                                                                                                    var class_name = result1.data[0].class_name;

                                                                                                                    let result2 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                                    if (result2.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result2.status === true){
                                                                                                                        var teacher_email = result2.data[0].email;
                                                                                                                        var teacher_name = result2.data[0].name;

                                                                                                                        let result3 = await db_query.get_user_settings(teacher_user_id);

                                                                                                                        if (result3.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result3.status === true){
                                                                                                                            let allow_email_notif = result3.data[0].allow_email_notif;

                                                                                                                            if (allow_email_notif === 'true'){
                                                                                                                                mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `A new student has joined your class: "${class_name}"`, teacher_name, `<p style="font-weight: 400;"><b>A new student has joined your class: "${class_name}". Click the link below to view all the students of your class:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/teacher/people?class_code=${class_code}">${process.env.URL}/teacher/people?class_code=${class_code}</a></p>`, null, null); //Send mail

                                                                                                                                res.statusCode = 200;
                                                                                                                                res.json({ status: 'joined_class_successfully', token_info: 'no_token', class_code: class_code, details: active_classes });
                                                                                                                            } else if (allow_email_notif === 'false'){
                                                                                                                                res.statusCode = 200;
                                                                                                                                res.json({ status: 'joined_class_successfully', token_info: 'no_token', class_code: class_code, details: active_classes });
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
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
                                                                res.clearCookie('apex_auth');
                                                                res.json({ status: 'invalid_token' });
                                                            }
                                                        }
                                                    });
                                                } else {
                                                    res.statusCode = 401;
                                                    res.clearCookie('apex_auth');
                                                    res.json({ status: 'invalid_token' });
                                                }
                                            }
                                        });
                                    } else {
                                        res.statusCode = 401;
                                        res.clearCookie('apex_auth');
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

module.exports = join_class;