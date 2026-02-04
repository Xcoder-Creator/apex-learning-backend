const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db model
const mail_service = require('../../utility/mail_service.util'); //Import mail service
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header

const unenroll = async (req, res) => {
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
                                            let status = user.status;
                                            let user_id = user.user_id;

                                            if (status === 'user_direct_access_refresh_token'){
                                                jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
                                                    if (err) {
                                                        let result = await db_query.check_if_account_verified(user_id);

                                                        if (result.status === false){
                                                            res.statusCode = 500;
                                                            res.json({ status: 'error_occured' });
                                                        } else if (result.status === true){
                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                let result = await db_query.check_if_class_exists(class_code);

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
                                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                                let result = await db_query.unenroll_from_class(user_id, class_code);

                                                                                if (result.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (result.status === true){
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

                                                                                            let result1 = await db_query.fetch_class_details(class_code);

                                                                                            if (result1.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result1.status === true){
                                                                                                var class_name = result1.data[0].class_name;
                                                                                                var teacher_user_id = result1.data[0].creators_user_id;

                                                                                                let result2 = await db_query.get_user_by_id(user_id);

                                                                                                if (result2.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result2.status === true){
                                                                                                    var student_name = result2.data[0].name;

                                                                                                    let result3 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                    if (result3.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result3.status === true){
                                                                                                        var teacher_name_x = result3.data[0].name;
                                                                                                        var teacher_email = result3.data[0].email;

                                                                                                        let result4 = await db_query.get_user_settings(teacher_user_id);
            
                                                                                                        if (result4.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result4.status === true){
                                                                                                            let allow_email_notif = result4.data[0].allow_email_notif;

                                                                                                            if (allow_email_notif === 'true'){
                                                                                                                mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `Your student ${student_name} has just unenrolled from your class: "${class_name}"`, teacher_name_x, `Your student ${student_name} has just unenrolled from your class: "${class_name}".`, null, null); //Send mail
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }

                                                                                            if (active_classes.length > 0){
                                                                                                res.statusCode = 200;
                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                res.json({ status: 'unenrolled_from_class_successfully', token_info: 'token_available', new_accessToken: new_access_token, details: active_classes });
                                                                                            } else if (active_classes.length === 0){
                                                                                                res.statusCode = 200;
                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                res.json({ status: 'unenrolled_from_class_successfully', token_info: 'token_available', new_accessToken: new_access_token, details: [] });
                                                                                            }
                                                                                        } else {
                                                                                            let result1 = await db_query.fetch_class_details(class_code);

                                                                                            if (result1.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result1.status === true){
                                                                                                var class_name = result1.data[0].class_name;
                                                                                                var teacher_user_id = result1.data[0].creators_user_id;

                                                                                                let result2 = await db_query.get_user_by_id(user_id);

                                                                                                if (result2.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result2.status === true){
                                                                                                    var student_name = result2.data[0].name;

                                                                                                    let result3 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                    if (result3.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result3.status === true){
                                                                                                        var teacher_name_x = result3.data[0].name;
                                                                                                        var teacher_email = result3.data[0].email;

                                                                                                        let result4 = await db_query.get_user_settings(teacher_user_id);
            
                                                                                                        if (result4.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result4.status === true){
                                                                                                            let allow_email_notif = result4.data[0].allow_email_notif;

                                                                                                            if (allow_email_notif === 'true'){
                                                                                                                mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `Your student ${student_name} has just unenrolled from your class: "${class_name}"`, teacher_name_x, `Your student ${student_name} has just unenrolled from your class: "${class_name}".`, null, null); //Send mail

                                                                                                                res.statusCode = 200;
                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                res.json({ status: 'unenrolled_from_class_successfully', token_info: 'token_available', new_accessToken: new_access_token, details: [] });
                                                                                                            } else {
                                                                                                                res.statusCode = 200;
                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                res.json({ status: 'unenrolled_from_class_successfully', token_info: 'token_available', new_accessToken: new_access_token, details: [] });
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                res.statusCode = 401;
                                                                                res.json({ status: 'not_member_of_class' });
                                                                            }
                                                                        }
                                                                    } else {
                                                                        res.statusCode = 404;
                                                                        res.json({ status: 'class_does_not_exist' });
                                                                    }
                                                                }
                                                            } else {
                                                                res.statusCode = 404;
                                                                res.json({ status: 'user_does_not_exist' });
                                                            }
                                                        }
                                                    } else {
                                                        let result = await db_query.check_if_account_verified(user_id);

                                                        if (result.status === false){
                                                            res.statusCode = 500;
                                                            res.json({ status: 'error_occured' });
                                                        } else if (result.status === true){
                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                let result = await db_query.check_if_class_exists(class_code);

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
                                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                                let result = await db_query.unenroll_from_class(user_id, class_code);

                                                                                if (result.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (result.status === true){
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

                                                                                            let result1 = await db_query.fetch_class_details(class_code);

                                                                                            if (result1.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result1.status === true){
                                                                                                var class_name = result1.data[0].class_name;
                                                                                                var teacher_user_id = result1.data[0].creators_user_id;

                                                                                                let result2 = await db_query.get_user_by_id(user_id);

                                                                                                if (result2.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result2.status === true){
                                                                                                    var student_name = result2.data[0].name;

                                                                                                    let result3 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                    if (result3.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result3.status === true){
                                                                                                        var teacher_name_x = result3.data[0].name;
                                                                                                        var teacher_email = result3.data[0].email;
                                                                                                        
                                                                                                        let result4 = await db_query.get_user_settings(teacher_user_id);
            
                                                                                                        if (result4.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result4.status === true){
                                                                                                            let allow_email_notif = result4.data[0].allow_email_notif;

                                                                                                            if (allow_email_notif === 'true'){
                                                                                                                mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `Your student ${student_name} has just unenrolled from your class: "${class_name}"`, teacher_name_x, `Your student ${student_name} has just unenrolled from your class: "${class_name}".`, null, null); //Send mail
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }

                                                                                            if (active_classes.length > 0){
                                                                                                res.statusCode = 200;
                                                                                                res.json({ status: 'unenrolled_from_class_successfully', token_info: 'no_token', details: active_classes });
                                                                                            } else if (active_classes.length === 0){
                                                                                                res.statusCode = 200;
                                                                                                res.json({ status: 'unenrolled_from_class_successfully', token_info: 'no_token', details: [] });
                                                                                            }
                                                                                        } else {
                                                                                            let result1 = await db_query.fetch_class_details(class_code);

                                                                                            if (result1.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result1.status === true){
                                                                                                var class_name = result1.data[0].class_name;
                                                                                                var teacher_user_id = result1.data[0].creators_user_id;

                                                                                                let result2 = await db_query.get_user_by_id(user_id);

                                                                                                if (result2.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result2.status === true){
                                                                                                    var student_name = result2.data[0].name;

                                                                                                    let result3 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                    if (result3.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result3.status === true){
                                                                                                        var teacher_name_x = result3.data[0].name;
                                                                                                        var teacher_email = result3.data[0].email;
                                                                                                        
                                                                                                        let result4 = await db_query.get_user_settings(teacher_user_id);
            
                                                                                                        if (result4.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result4.status === true){
                                                                                                            let allow_email_notif = result4.data[0].allow_email_notif;

                                                                                                            if (allow_email_notif === 'true'){
                                                                                                                mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `Your student ${student_name} has just unenrolled from your class: "${class_name}"`, teacher_name_x, `Your student ${student_name} has just unenrolled from your class: "${class_name}".`, null, null); //Send mail

                                                                                                                res.statusCode = 200;
                                                                                                                res.json({ status: 'unenrolled_from_class_successfully', token_info: 'no_token', details: [] });
                                                                                                            } else {
                                                                                                                res.statusCode = 200;
                                                                                                                res.json({ status: 'unenrolled_from_class_successfully', token_info: 'no_token', details: [] });
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                res.statusCode = 401;
                                                                                res.json({ status: 'not_member_of_class' });
                                                                            }
                                                                        }
                                                                    } else {
                                                                        res.statusCode = 404;
                                                                        res.json({ status: 'class_does_not_exist' });
                                                                    }
                                                                }
                                                            } else {
                                                                res.statusCode = 404;
                                                                res.json({ status: 'user_does_not_exist' });
                                                            }
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
            res.json({ status: 'missing_credentials' });
        }
    } else if (environment === 'production'){
        //Validate the request form body data
        if (req.body){
            let form_data = req.body; //Form data from the frontend

            //Check if the appropriate request parameters are set
            if (form_data.class_code){
                //Filter and sanitize the class code
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
                                                    res.clearCookie('apex_auth'); // Clear apex auth cookie
                                                    res.json({ status: 'token_expired' });
                                                }
                                            } else {
                                                let status = user.status;
                                                let user_id = user.user_id;

                                                if (status === 'user_direct_access_refresh_token'){
                                                    jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
                                                        if (err) {
                                                            let result = await db_query.check_if_account_verified(user_id);

                                                            if (result.status === false){
                                                                res.statusCode = 500;
                                                                res.json({ status: 'error_occured' });
                                                            } else if (result.status === true){
                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                    let result = await db_query.check_if_class_exists(class_code);

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
                                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                                    let result = await db_query.unenroll_from_class(user_id, class_code);

                                                                                    if (result.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (result.status === true){
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

                                                                                                let result1 = await db_query.fetch_class_details(class_code);

                                                                                                if (result1.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result1.status === true){
                                                                                                    var class_name = result1.data[0].class_name;
                                                                                                    var teacher_user_id = result1.data[0].creators_user_id;

                                                                                                    let result2 = await db_query.get_user_by_id(user_id);

                                                                                                    if (result2.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result2.status === true){
                                                                                                        var student_name = result2.data[0].name;

                                                                                                        let result3 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                        if (result3.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result3.status === true){
                                                                                                            var teacher_name_x = result3.data[0].name;
                                                                                                            var teacher_email = result3.data[0].email;
                                                                                                            
                                                                                                            let result4 = await db_query.get_user_settings(teacher_user_id);
            
                                                                                                            if (result4.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result4.status === true){
                                                                                                                let allow_email_notif = result4.data[0].allow_email_notif;

                                                                                                                if (allow_email_notif === 'true'){
                                                                                                                    mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `Your student ${student_name} has just unenrolled from your class: "${class_name}"`, teacher_name_x, `Your student ${student_name} has just unenrolled from your class: "${class_name}".`, null, null); //Send mail
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }

                                                                                                if (active_classes.length > 0){
                                                                                                    res.statusCode = 200;
                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                    res.json({ status: 'unenrolled_from_class_successfully', token_info: 'token_available', new_accessToken: new_access_token, details: active_classes });
                                                                                                } else if (active_classes.length === 0){
                                                                                                    res.statusCode = 200;
                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                    res.json({ status: 'unenrolled_from_class_successfully', token_info: 'token_available', new_accessToken: new_access_token, details: [] });
                                                                                                }
                                                                                            } else {
                                                                                                let result1 = await db_query.fetch_class_details(class_code);

                                                                                                if (result1.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result1.status === true){
                                                                                                    var class_name = result1.data[0].class_name;
                                                                                                    var teacher_user_id = result1.data[0].creators_user_id;

                                                                                                    let result2 = await db_query.get_user_by_id(user_id);

                                                                                                    if (result2.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result2.status === true){
                                                                                                        var student_name = result2.data[0].name;

                                                                                                        let result3 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                        if (result3.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result3.status === true){
                                                                                                            var teacher_name_x = result3.data[0].name;
                                                                                                            var teacher_email = result3.data[0].email;
                                                                                                            
                                                                                                            let result4 = await db_query.get_user_settings(teacher_user_id);
            
                                                                                                            if (result4.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result4.status === true){
                                                                                                                let allow_email_notif = result4.data[0].allow_email_notif;

                                                                                                                if (allow_email_notif === 'true'){
                                                                                                                    mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `Your student ${student_name} has just unenrolled from your class: "${class_name}"`, teacher_name_x, `Your student ${student_name} has just unenrolled from your class: "${class_name}".`, null, null); //Send mail

                                                                                                                    res.statusCode = 200;
                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                    res.json({ status: 'unenrolled_from_class_successfully', token_info: 'token_available', new_accessToken: new_access_token, details: [] });
                                                                                                                } else {
                                                                                                                    res.statusCode = 200;
                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                    res.json({ status: 'unenrolled_from_class_successfully', token_info: 'token_available', new_accessToken: new_access_token, details: [] });
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    res.statusCode = 401;
                                                                                    res.json({ status: 'not_member_of_class' });
                                                                                }
                                                                            }
                                                                        } else {
                                                                            res.statusCode = 404;
                                                                            res.json({ status: 'class_does_not_exist' });
                                                                        }
                                                                    }
                                                                } else {
                                                                    res.statusCode = 404;
                                                                    res.json({ status: 'user_does_not_exist' });
                                                                }
                                                            }
                                                        } else {
                                                            let result = await db_query.check_if_account_verified(user_id);

                                                            if (result.status === false){
                                                                res.statusCode = 500;
                                                                res.json({ status: 'error_occured' });
                                                            } else if (result.status === true){
                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                    let result = await db_query.check_if_class_exists(class_code);

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
                                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                                    let result = await db_query.unenroll_from_class(user_id, class_code);

                                                                                    if (result.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (result.status === true){
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

                                                                                                let result1 = await db_query.fetch_class_details(class_code);

                                                                                                if (result1.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result1.status === true){
                                                                                                    var class_name = result1.data[0].class_name;
                                                                                                    var teacher_user_id = result1.data[0].creators_user_id;

                                                                                                    let result2 = await db_query.get_user_by_id(user_id);

                                                                                                    if (result2.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result2.status === true){
                                                                                                        var student_name = result2.data[0].name;

                                                                                                        let result3 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                        if (result3.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result3.status === true){
                                                                                                            var teacher_name_x = result3.data[0].name;
                                                                                                            var teacher_email = result3.data[0].email;
                                                                                                            
                                                                                                            let result4 = await db_query.get_user_settings(teacher_user_id);
            
                                                                                                            if (result4.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result4.status === true){
                                                                                                                let allow_email_notif = result4.data[0].allow_email_notif;

                                                                                                                if (allow_email_notif === 'true'){
                                                                                                                    mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `Your student ${student_name} has just unenrolled from your class: "${class_name}"`, teacher_name_x, `Your student ${student_name} has just unenrolled from your class: "${class_name}".`, null, null); //Send mail
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }

                                                                                                if (active_classes.length > 0){
                                                                                                    res.statusCode = 200;
                                                                                                    res.json({ status: 'unenrolled_from_class_successfully', token_info: 'no_token', details: active_classes });
                                                                                                } else if (active_classes.length === 0){
                                                                                                    res.statusCode = 200;
                                                                                                    res.json({ status: 'unenrolled_from_class_successfully', token_info: 'no_token', details: [] });
                                                                                                }
                                                                                            } else {
                                                                                                let result1 = await db_query.fetch_class_details(class_code);

                                                                                                if (result1.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result1.status === true){
                                                                                                    var class_name = result1.data[0].class_name;
                                                                                                    var teacher_user_id = result1.data[0].creators_user_id;

                                                                                                    let result2 = await db_query.get_user_by_id(user_id);

                                                                                                    if (result2.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result2.status === true){
                                                                                                        var student_name = result2.data[0].name;

                                                                                                        let result3 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                        if (result3.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result3.status === true){
                                                                                                            var teacher_name_x = result3.data[0].name;
                                                                                                            var teacher_email = result3.data[0].email;
                                                                                                            
                                                                                                            let result4 = await db_query.get_user_settings(teacher_user_id);
            
                                                                                                            if (result4.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result4.status === true){
                                                                                                                let allow_email_notif = result4.data[0].allow_email_notif;

                                                                                                                if (allow_email_notif === 'true'){
                                                                                                                    mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `Your student ${student_name} has just unenrolled from your class: "${class_name}"`, teacher_name_x, `Your student ${student_name} has just unenrolled from your class: "${class_name}".`, null, null); //Send mail

                                                                                                                    res.statusCode = 200;
                                                                                                                    res.json({ status: 'unenrolled_from_class_successfully', token_info: 'no_token', details: [] });
                                                                                                                } else {
                                                                                                                    res.statusCode = 200;
                                                                                                                    res.json({ status: 'unenrolled_from_class_successfully', token_info: 'no_token', details: [] });
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    res.statusCode = 401;
                                                                                    res.json({ status: 'not_member_of_class' });
                                                                                }
                                                                            }
                                                                        } else {
                                                                            res.statusCode = 404;
                                                                            res.json({ status: 'class_does_not_exist' });
                                                                        }
                                                                    }
                                                                } else {
                                                                    res.statusCode = 404;
                                                                    res.json({ status: 'user_does_not_exist' });
                                                                }
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

module.exports = unenroll;