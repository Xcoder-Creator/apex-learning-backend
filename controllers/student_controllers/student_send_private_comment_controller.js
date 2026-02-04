const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db_query
const mail_service = require('../../utility/mail_service.util'); //Import mail service
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header
const list_months = require('../../utility/months_list.util'); //Import months list
const format_date = require('../../utility/format_date.util'); //Import format date

const send_private_comment = async (req, res) => {
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
            if (form_data.access_token && form_data.class_code && form_data.classwork_id && form_data.comment && form_data.teacher_user_id){
                //Filter and sanitize the request parameters
                let access_token = sanitize_data(form_data.access_token);
                let class_code = sanitize_data(form_data.class_code);
                let classwork_id = sanitize_data(form_data.classwork_id);
                let comment = sanitize_data(form_data.comment);
                let teacher_user_id = sanitize_data(form_data.teacher_user_id);

                //Validate the request parameters
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
                            if (/^ *$/.test(teacher_user_id)){
                                res.statusCode = 401;
                                res.json({ status: 'missing_credentials' });
                            } else {
                                if (/^ *$/.test(comment)){
                                    res.statusCode = 401;
                                    res.json({ status: 'missing_comment' });
                                } else {
                                    if (comment.length <= 500 && comment.length !== 0){
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
                                                                                let name = result.data[0].name;
                                                                                let profile_image = result.data[0].profile_image;
                                                                                var months = list_months;
                                                                                var date = new Date();
                                                                                var formated_date = format_date(months, date);

                                                                                let resultxx = await db_query.fetch_all_active_class_details(class_code);

                                                                                if (resultxx.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (resultxx.status === true){
                                                                                    if (resultxx.data.length > 0 && resultxx.data.length === 1){
                                                                                        let resultxc = await db_query.check_if_user_part_of_class(user_id, class_code);

                                                                                        if (resultxc.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (resultxc.status === true){
                                                                                            if (resultxc.data.length > 0 && resultxc.data.length === 1){
                                                                                                let resultxc = await db_query.check_if_teacher_of_class(teacher_user_id, class_code);

                                                                                                if (resultxc.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (resultxc.status === true){
                                                                                                    if (resultxc.data.length > 0 && resultxc.data.length === 1){
                                                                                                        let resultz = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                        if (resultz.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (resultz.status === true){
                                                                                                            if (resultz.data.length === 1){
                                                                                                                let classwork_type = resultz.data[0].classwork_type;
                                                                                                                let resultx = await db_query.create_private_comment(classwork_id, user_id, class_code, comment, formated_date, user_id);

                                                                                                                if (resultx.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (resultx.status === true){
                                                                                                                    if (resultx.data.length === 1){
                                                                                                                        let data = {
                                                                                                                            name: name,
                                                                                                                            classwork_id: classwork_id,
                                                                                                                            user_id: user_id,
                                                                                                                            profile_img: profile_image,
                                                                                                                            date: formated_date,
                                                                                                                            comment_data: comment,
                                                                                                                            class_code: class_code
                                                                                                                        }

                                                                                                                        var comment_data = {
                                                                                                                            profile_image: profile_image,
                                                                                                                            name: name,
                                                                                                                            date: formated_date,
                                                                                                                            comment: comment,
                                                                                                                            classwork_id: classwork_id
                                                                                                                        }

                                                                                                                        let result3 = await db_query.fetch_class_details(class_code);

                                                                                                                        if (result3.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result3.status === true){
                                                                                                                            var class_name = result3.data[0].class_name;
                                                                                                                            

                                                                                                                            let result4 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                                            if (result4.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (result4.status === true){
                                                                                                                                var teacher_name = result4.data[0].name;
                                                                                                                                var teacher_email = result4.data[0].email;

                                                                                                                                let result5 = await db_query.get_user_settings(teacher_user_id);
            
                                                                                                                                if (result5.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result5.status === true){
                                                                                                                                    let allow_email_notif = result5.data[0].allow_email_notif;

                                                                                                                                    if (allow_email_notif === 'true'){
                                                                                                                                        mail_service('private_comments_mail', teacher_email, false, false, false, null, null, null, null, class_name, null, null, null, null, class_code, null, `Your student ${name} just added a new private comment to the ${classwork_type} that you assigned to your class: ${class_name}`, teacher_name, `Your student ${name} just added a new private comment to the ${classwork_type} that you assigned to your class: "${class_name}"`, null, comment_data); //Send mail
                                                                                                                                
                                                                                                                                        res.statusCode = 200;
                                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                        res.json({ status: 'comment_created', details: data, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                    } else {
                                                                                                                                        res.statusCode = 200;
                                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                        res.json({ status: 'comment_created', details: data, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            } else {
                                                                                                                res.statusCode = 404;
                                                                                                                res.json({ status: 'classwork_not_found' });
                                                                                                            }
                                                                                                        }
                                                                                                    } else {
                                                                                                        res.statusCode = 401;
                                                                                                        res.json({ status: 'not_teacher_of_class' });
                                                                                                    }
                                                                                                }
                                                                                            } else {
                                                                                                res.statusCode = 401;
                                                                                                res.json({ status: 'student_not_part_of_class' });
                                                                                            }
                                                                                        }
                                                                                    } else {
                                                                                        res.statusCode = 401;
                                                                                        res.json({ status: 'class_not_active' });
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
                                                                                    let name = result.data[0].name;
                                                                                    let profile_image = result.data[0].profile_image;
                                                                                    var months = list_months;
                                                                                    var date = new Date();
                                                                                    var formated_date = format_date(months, date);

                                                                                    let resultxx = await db_query.fetch_all_active_class_details(class_code);

                                                                                    if (resultxx.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (resultxx.status === true){
                                                                                        if (resultxx.data.length > 0 && resultxx.data.length === 1){
                                                                                            let resultxc = await db_query.check_if_user_part_of_class(user_auth_id, class_code);

                                                                                            if (resultxc.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (resultxc.status === true){
                                                                                                if (resultxc.data.length > 0 && resultxc.data.length === 1){
                                                                                                    let resultxc = await db_query.check_if_teacher_of_class(teacher_user_id, class_code);

                                                                                                    if (resultxc.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (resultxc.status === true){
                                                                                                        if (resultxc.data.length > 0 && resultxc.data.length === 1){
                                                                                                            let resultz = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                            if (resultz.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (resultz.status === true){
                                                                                                                if (resultz.data.length === 1){
                                                                                                                    let classwork_type = resultz.data[0].classwork_type;
                                                                                                                    let resultx = await db_query.create_private_comment(classwork_id, user_auth_id, class_code, comment, formated_date, user_auth_id);

                                                                                                                    if (resultx.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (resultx.status === true){
                                                                                                                        if (resultx.data.length === 1){
                                                                                                                            let data = {
                                                                                                                                name: name,
                                                                                                                                classwork_id: classwork_id,
                                                                                                                                user_id: user_auth_id,
                                                                                                                                profile_img: profile_image,
                                                                                                                                date: formated_date,
                                                                                                                                comment_data: comment,
                                                                                                                                class_code: class_code
                                                                                                                            }

                                                                                                                            var comment_data = {
                                                                                                                                profile_image: profile_image,
                                                                                                                                name: name,
                                                                                                                                date: formated_date,
                                                                                                                                comment: comment,
                                                                                                                                classwork_id: classwork_id
                                                                                                                            }
    
                                                                                                                            let result3 = await db_query.fetch_class_details(class_code);
    
                                                                                                                            if (result3.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (result3.status === true){
                                                                                                                                var class_name = result3.data[0].class_name;
                                                                                                                                
    
                                                                                                                                let result4 = await db_query.get_user_by_id(teacher_user_id);
    
                                                                                                                                if (result4.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result4.status === true){
                                                                                                                                    var teacher_name = result4.data[0].name;
                                                                                                                                    var teacher_email = result4.data[0].email;

                                                                                                                                    let result5 = await db_query.get_user_settings(teacher_user_id);
            
                                                                                                                                    if (result5.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result5.status === true){
                                                                                                                                        let allow_email_notif = result5.data[0].allow_email_notif;

                                                                                                                                        if (allow_email_notif === 'true'){
                                                                                                                                            mail_service('private_comments_mail', teacher_email, false, false, false, null, null, null, null, class_name, null, null, null, null, class_code, null, `Your student ${name} just added a new private comment to the ${classwork_type} that you assigned to your class: ${class_name}`, teacher_name, `Your student ${name} just added a new private comment to the ${classwork_type} that you assigned to your class: "${class_name}"`, null, comment_data); //Send mail
                                                                                                                                    
                                                                                                                                            res.statusCode = 200;
                                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                            res.json({ status: 'comment_created', details: data, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                        } else {
                                                                                                                                            res.statusCode = 200;
                                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                            res.json({ status: 'comment_created', details: data, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    res.statusCode = 404;
                                                                                                                    res.json({ status: 'classwork_not_found' });
                                                                                                                }
                                                                                                            }
                                                                                                        } else {
                                                                                                            res.statusCode = 401;
                                                                                                            res.json({ status: 'not_teacher_of_class' });
                                                                                                        }
                                                                                                    }
                                                                                                } else {
                                                                                                    res.statusCode = 401;
                                                                                                    res.json({ status: 'student_not_part_of_class' });
                                                                                                }
                                                                                            }
                                                                                        } else {
                                                                                            res.statusCode = 401;
                                                                                            res.json({ status: 'class_not_active' });
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
                                        res.json({ status: 'invalid_comment' });
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
            if (form_data.class_code && form_data.classwork_id && form_data.comment && form_data.teacher_user_id){
                //Filter and sanitize the request parameters
                let class_code = sanitize_data(form_data.class_code);
                let classwork_id = sanitize_data(form_data.classwork_id);
                let comment = sanitize_data(form_data.comment);
                let teacher_user_id = sanitize_data(form_data.teacher_user_id);

                if (/^ *$/.test(class_code)){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    if (/^ *$/.test(classwork_id)){
                        res.statusCode = 401;
                        res.json({ status: 'missing_credentials' });
                    } else {
                        if (/^ *$/.test(teacher_user_id)){
                            res.statusCode = 401;
                            res.json({ status: 'missing_credentials' });
                        } else {
                            if (/^ *$/.test(comment)){
                                res.statusCode = 401;
                                res.json({ status: 'missing_comment' });
                            } else {
                                if (comment.length <= 500 && comment.length !== 0){
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
                                                                                    let name = result.data[0].name;
                                                                                    let profile_image = result.data[0].profile_image;
                                                                                    var months = list_months;
                                                                                    var date = new Date();
                                                                                    var formated_date = format_date(months, date);

                                                                                    let resultxx = await db_query.fetch_all_active_class_details(class_code);

                                                                                    if (resultxx.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (resultxx.status === true){
                                                                                        if (resultxx.data.length > 0 && resultxx.data.length === 1){
                                                                                            let resultxc = await db_query.check_if_user_part_of_class(user_id, class_code);

                                                                                            if (resultxc.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (resultxc.status === true){
                                                                                                if (resultxc.data.length > 0 && resultxc.data.length === 1){
                                                                                                    let resultxc = await db_query.check_if_teacher_of_class(teacher_user_id, class_code);

                                                                                                    if (resultxc.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (resultxc.status === true){
                                                                                                        if (resultxc.data.length > 0 && resultxc.data.length === 1){
                                                                                                            let resultz = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                            if (resultz.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (resultz.status === true){
                                                                                                                if (resultz.data.length === 1){
                                                                                                                    let classwork_type = resultz.data[0].classwork_type;
                                                                                                                    let resultx = await db_query.create_private_comment(classwork_id, user_id, class_code, comment, formated_date, user_id);

                                                                                                                    if (resultx.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (resultx.status === true){
                                                                                                                        if (resultx.data.length === 1){
                                                                                                                            let data = {
                                                                                                                                name: name,
                                                                                                                                classwork_id: classwork_id,
                                                                                                                                user_id: user_id,
                                                                                                                                profile_img: profile_image,
                                                                                                                                date: formated_date,
                                                                                                                                comment_data: comment,
                                                                                                                                class_code: class_code
                                                                                                                            }

                                                                                                                            var comment_data = {
                                                                                                                                profile_image: profile_image,
                                                                                                                                name: name,
                                                                                                                                date: formated_date,
                                                                                                                                comment: comment,
                                                                                                                                classwork_id: classwork_id
                                                                                                                            }
    
                                                                                                                            let result3 = await db_query.fetch_class_details(class_code);
    
                                                                                                                            if (result3.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (result3.status === true){
                                                                                                                                var class_name = result3.data[0].class_name;
                                                                                                                                
    
                                                                                                                                let result4 = await db_query.get_user_by_id(teacher_user_id);
    
                                                                                                                                if (result4.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result4.status === true){
                                                                                                                                    var teacher_name = result4.data[0].name;
                                                                                                                                    var teacher_email = result4.data[0].email;

                                                                                                                                    let result5 = await db_query.get_user_settings(teacher_user_id);
            
                                                                                                                                    if (result5.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result5.status === true){
                                                                                                                                        let allow_email_notif = result5.data[0].allow_email_notif;

                                                                                                                                        if (allow_email_notif === 'true'){
                                                                                                                                            mail_service('private_comments_mail', teacher_email, false, false, false, null, null, null, null, class_name, null, null, null, null, class_code, null, `Your student ${name} just added a new private comment to the ${classwork_type} that you assigned to your class: ${class_name}`, teacher_name, `Your student ${name} just added a new private comment to the ${classwork_type} that you assigned to your class: "${class_name}"`, null, comment_data); //Send mail
                                                                                                                                    
                                                                                                                                            res.statusCode = 200;
                                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                            res.json({ status: 'comment_created', details: data, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                        } else {
                                                                                                                                            res.statusCode = 200;
                                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                            res.json({ status: 'comment_created', details: data, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    res.statusCode = 404;
                                                                                                                    res.json({ status: 'classwork_not_found' });
                                                                                                                }
                                                                                                            }
                                                                                                        } else {
                                                                                                            res.statusCode = 401;
                                                                                                            res.json({ status: 'not_teacher_of_class' });
                                                                                                        }
                                                                                                    }
                                                                                                } else {
                                                                                                    res.statusCode = 401;
                                                                                                    res.json({ status: 'student_not_part_of_class' });
                                                                                                }
                                                                                            }
                                                                                        } else {
                                                                                            res.statusCode = 401;
                                                                                            res.json({ status: 'class_not_active' });
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
                                                                                        let name = result.data[0].name;
                                                                                        let profile_image = result.data[0].profile_image;
                                                                                        var months = list_months;
                                                                                        var date = new Date();
                                                                                        var formated_date = format_date(months, date);

                                                                                        let resultxx = await db_query.fetch_all_active_class_details(class_code);

                                                                                        if (resultxx.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (resultxx.status === true){
                                                                                            if (resultxx.data.length > 0 && resultxx.data.length === 1){
                                                                                                let resultxc = await db_query.check_if_user_part_of_class(user_auth_id, class_code);

                                                                                                if (resultxc.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (resultxc.status === true){
                                                                                                    if (resultxc.data.length > 0 && resultxc.data.length === 1){
                                                                                                        let resultxc = await db_query.check_if_teacher_of_class(teacher_user_id, class_code);

                                                                                                        if (resultxc.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (resultxc.status === true){
                                                                                                            if (resultxc.data.length > 0 && resultxc.data.length === 1){
                                                                                                                let resultz = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                                if (resultz.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (resultz.status === true){
                                                                                                                    if (resultz.data.length === 1){
                                                                                                                        let classwork_type = resultz.data[0].classwork_type;
                                                                                                                        let resultx = await db_query.create_private_comment(classwork_id, user_auth_id, class_code, comment, formated_date, user_auth_id);

                                                                                                                        if (resultx.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (resultx.status === true){
                                                                                                                            if (resultx.data.length === 1){
                                                                                                                                let data = {
                                                                                                                                    name: name,
                                                                                                                                    classwork_id: classwork_id,
                                                                                                                                    user_id: user_auth_id,
                                                                                                                                    profile_img: profile_image,
                                                                                                                                    date: formated_date,
                                                                                                                                    comment_data: comment,
                                                                                                                                    class_code: class_code
                                                                                                                                }

                                                                                                                                var comment_data = {
                                                                                                                                    profile_image: profile_image,
                                                                                                                                    name: name,
                                                                                                                                    date: formated_date,
                                                                                                                                    comment: comment,
                                                                                                                                    classwork_id: classwork_id
                                                                                                                                }
        
                                                                                                                                let result3 = await db_query.fetch_class_details(class_code);
        
                                                                                                                                if (result3.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result3.status === true){
                                                                                                                                    var class_name = result3.data[0].class_name;
                                                                                                                                    
        
                                                                                                                                    let result4 = await db_query.get_user_by_id(teacher_user_id);
        
                                                                                                                                    if (result4.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result4.status === true){
                                                                                                                                        var teacher_name = result4.data[0].name;
                                                                                                                                        var teacher_email = result4.data[0].email;

                                                                                                                                        let result5 = await db_query.get_user_settings(teacher_user_id);
            
                                                                                                                                        if (result5.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result5.status === true){
                                                                                                                                            let allow_email_notif = result5.data[0].allow_email_notif;

                                                                                                                                            if (allow_email_notif === 'true'){
                                                                                                                                                mail_service('private_comments_mail', teacher_email, false, false, false, null, null, null, null, class_name, null, null, null, null, class_code, null, `Your student ${name} just added a new private comment to the ${classwork_type} that you assigned to your class: ${class_name}`, teacher_name, `Your student ${name} just added a new private comment to the ${classwork_type} that you assigned to your class: "${class_name}"`, null, comment_data); //Send mail
                                                                                                                                        
                                                                                                                                                res.statusCode = 200;
                                                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                res.json({ status: 'comment_created', details: data, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                            } else {
                                                                                                                                                res.statusCode = 200;
                                                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                res.json({ status: 'comment_created', details: data, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    } else {
                                                                                                                        res.statusCode = 404;
                                                                                                                        res.json({ status: 'classwork_not_found' });
                                                                                                                    }
                                                                                                                }
                                                                                                            } else {
                                                                                                                res.statusCode = 401;
                                                                                                                res.json({ status: 'not_teacher_of_class' });
                                                                                                            }
                                                                                                        }
                                                                                                    } else {
                                                                                                        res.statusCode = 401;
                                                                                                        res.json({ status: 'student_not_part_of_class' });
                                                                                                    }
                                                                                                }
                                                                                            } else {
                                                                                                res.statusCode = 401;
                                                                                                res.json({ status: 'class_not_active' });
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
                                    res.json({ status: 'invalid_comment' });
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
    }
}

module.exports = send_private_comment;