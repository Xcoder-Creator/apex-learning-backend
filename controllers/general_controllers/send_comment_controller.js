const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db_query
const mail_service = require('../../utility/mail_service.util'); //Import mail service
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header
const list_months = require('../../utility/months_list.util'); //Import months list
const format_date = require('../../utility/format_date.util'); //Import format date

const send_comment = async (req, res) => {
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
            if (form_data.access_token && form_data.class_code && form_data.post_id && form_data.comment){
                //Filter and sanitize the request parameters
                let access_token = sanitize_data(form_data.access_token);
                let class_code = sanitize_data(form_data.class_code);
                let post_id = sanitize_data(form_data.post_id);
                let comment = sanitize_data(form_data.comment);

                //Validate the request parameters
                if (/^ *$/.test(access_token)){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    if (/^ *$/.test(class_code)){
                        res.statusCode = 401;
                        res.json({ status: 'missing_credentials' });
                    } else {
                        if (/^ *$/.test(post_id)){
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
                                                                                    let resultz = await db_query.fetch_a_particular_post(post_id);

                                                                                    if (resultz.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured3' });
                                                                                    } else if (resultz.status === true){
                                                                                        if (resultz.data.length === 1){
                                                                                            let resultx = await db_query.create_comment(post_id, user_id, class_code, comment, formated_date);

                                                                                            if (resultx.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured3' });
                                                                                            } else if (resultx.status === true){
                                                                                                if (resultx.data.length === 1){
                                                                                                    let data = {
                                                                                                        name: name,
                                                                                                        post_id: post_id,
                                                                                                        user_id: user_id,
                                                                                                        profile_img: profile_image,
                                                                                                        date: formated_date,
                                                                                                        comment_data: comment,
                                                                                                        class_code: class_code
                                                                                                    }

                                                                                                    let result2 = await db_query.fetch_all_students_of_joined_class_except_one(class_code, user_id);

                                                                                                    if (result2.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result2.status === true){
                                                                                                        var students_of_class = result2.data;

                                                                                                        if (students_of_class.length > 0){
                                                                                                            let result3 = await db_query.fetch_class_details(class_code);

                                                                                                            if (result3.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result3.status === true){
                                                                                                                var class_name = result3.data[0].class_name;
                                                                                                                var teacher_user_id = result3.data[0].creators_user_id;

                                                                                                                let result4 = await db_query.get_user_by_id(user_id);

                                                                                                                if (result4.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result4.status === true){
                                                                                                                    var student_name_x = result4.data[0].name;
                                                                                                                    var student_profile_img = result4.data[0].profile_image;
                                                                                                                    var user_role = result4.data[0].role;

                                                                                                                    let resultvcx = await db_query.fetch_particular_post(post_id);

                                                                                                                    if (resultvcx.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (resultvcx.status === true){
                                                                                                                        let resultvcy = await db_query.get_user_by_id(resultvcx.data[0].creators_user_id);

                                                                                                                        if (resultvcy.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (resultvcy.status === true){
                                                                                                                            var post_data = {
                                                                                                                                profile_image: resultvcy.data[0].profile_image,
                                                                                                                                name: resultvcy.data[0].name,
                                                                                                                                date: resultvcx.data[0].post_creation_date,
                                                                                                                                time: resultvcx.data[0].post_creation_time,
                                                                                                                                post_data: resultvcx.data[0].post_data,
                                                                                                                                post_type: resultvcx.data[0].post_type
                                                                                                                            }

                                                                                                                            var comment_data = {
                                                                                                                                profile_image: profile_image,
                                                                                                                                name: name,
                                                                                                                                date: formated_date,
                                                                                                                                comment: comment
                                                                                                                            }
    
                                                                                                                            if (user_role === 'Student'){
                                                                                                                                for ([i, record] of students_of_class.entries()){
                                                                                                                                    let student_user_id = record.user_id;
                        
                                                                                                                                    let result5 = await db_query.get_user_settings(student_user_id);
            
                                                                                                                                    if (result5.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result5.status === true){
                                                                                                                                        let allow_email_notif = result5.data[0].allow_email_notif;
            
                                                                                                                                        let result6 = await db_query.get_user_by_id(student_user_id);
            
                                                                                                                                        if (result6.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result6.status === true){
                                                                                                                                            var student_email = result6.data[0].email;
                                                                                                                                            var student_name = result6.data[0].name;
            
                                                                                                                                            if (allow_email_notif === 'true'){
                                                                                                                                                mail_service('public_comments_mail', student_email, false, false, false, student_name_x, student_name, post_data.name, post_data.profile_image, class_name, post_data.date, post_data.time, post_data.post_data, post_data.post_type, class_code, null, `${name} just added a new comment to a post in your class: ${class_name}`, student_name, `${name} just added a new comment to a post in your class: "${class_name}"`, post_data, comment_data); //Send mail
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
    
                                                                                                                                let result6xx = await db_query.get_user_by_id(teacher_user_id);
            
                                                                                                                                if (result6xx.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result6xx.status === true){
                                                                                                                                    var teacher_email = result6xx.data[0].email;
                                                                                                                                    var teacher_name = result6xx.data[0].name;
                                                                                                                                    mail_service('public_comments_mail', teacher_email, false, false, false, student_name_x, student_name, post_data.name, post_data.profile_image, class_name, post_data.date, post_data.time, post_data.post_data, post_data.post_type, class_code, null, `Your student ${name} just added a new comment to a post in your class: ${class_name}`, teacher_name, `Your student ${name} just added a new comment to a post in your class: "${class_name}"`, post_data, comment_data); //Send mail
                                                                                                                                    
                                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                    res.statusCode = 200;
                                                                                                                                    res.json({ status: 'comment_created', details: data, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                }
                                                                                                                            } else if (user_role === 'Teacher'){
                                                                                                                                for ([i, record] of students_of_class.entries()){
                                                                                                                                    let student_user_id = record.user_id;
                        
                                                                                                                                    let result5 = await db_query.get_user_settings(student_user_id);
            
                                                                                                                                    if (result5.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result5.status === true){
                                                                                                                                        let allow_email_notif = result5.data[0].allow_email_notif;
            
                                                                                                                                        let result6 = await db_query.get_user_by_id(student_user_id);
            
                                                                                                                                        if (result6.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result6.status === true){
                                                                                                                                            var student_email = result6.data[0].email;
                                                                                                                                            var student_name = result6.data[0].name;
            
                                                                                                                                            if (allow_email_notif === 'true'){
                                                                                                                                                mail_service('public_comments_mail', student_email, false, false, false, student_name_x, student_name, post_data.name, post_data.profile_image, class_name, post_data.date, post_data.time, post_data.post_data, post_data.post_type, class_code, null, `Your teacher just added a new comment to a post in your class: ${class_name}`, student_name, `Your teacher just added a new comment to a post in your class: "${class_name}"`, post_data, comment_data); //Send mail
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
    
                                                                                                                                let result6xx = await db_query.get_user_by_id(teacher_user_id);
            
                                                                                                                                if (result6xx.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result6xx.status === true){
                                                                                                                                    var teacher_email = result6xx.data[0].email;
                                                                                                                                    var teacher_name = result6xx.data[0].name;
                                                                                                                                    mail_service('public_comments_mail', teacher_email, false, false, false, student_name_x, student_name, post_data.name, post_data.profile_image, class_name, post_data.date, post_data.time, post_data.post_data, post_data.post_type, class_code, null, `Your student ${name} just added a new comment to a post in your class: ${class_name}`, teacher_name, `Your student ${name} just added a new comment to a post in your class: "${class_name}"`, post_data, comment_data); //Send mail
                                                                                                                                    
                                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                    res.statusCode = 200;
                                                                                                                                    res.json({ status: 'comment_created', details: data, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        } else {
                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                            res.statusCode = 200;
                                                                                                            res.json({ status: 'comment_created', details: data, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        } else {
                                                                                            res.statusCode = 404;
                                                                                            res.json({ status: 'post_not_found' });
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
                                                                                        let resultz = await db_query.fetch_a_particular_post(post_id);

                                                                                        if (resultz.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured3' });
                                                                                        } else if (resultz.status === true){
                                                                                            if (resultz.data.length === 1){
                                                                                                let resultx = await db_query.create_comment(post_id, user_id, class_code, comment, formated_date);

                                                                                                if (resultx.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured5' });
                                                                                                } else if (resultx.status === true){
                                                                                                    if (resultx.data.length === 1){
                                                                                                        let data = {
                                                                                                            name: name,
                                                                                                            post_id: post_id,
                                                                                                            user_id: user_id,
                                                                                                            profile_img: profile_image,
                                                                                                            date: formated_date,
                                                                                                            comment_data: comment,
                                                                                                            class_code: class_code
                                                                                                        }


                                                                                                        let result2 = await db_query.fetch_all_students_of_joined_class_except_one(class_code, user_id);

                                                                                                        if (result2.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result2.status === true){
                                                                                                            var students_of_class = result2.data;

                                                                                                            if (students_of_class.length > 0){
                                                                                                                let result3 = await db_query.fetch_class_details(class_code);

                                                                                                                if (result3.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result3.status === true){
                                                                                                                    var class_name = result3.data[0].class_name;
                                                                                                                    var teacher_user_id = result3.data[0].creators_user_id;

                                                                                                                    let result4 = await db_query.get_user_by_id(user_id);

                                                                                                                    if (result4.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result4.status === true){
                                                                                                                        var student_name_x = result4.data[0].name;
                                                                                                                        var student_profile_img = result4.data[0].profile_image;
                                                                                                                        var user_role = result4.data[0].role;

                                                                                                                        let resultvcx = await db_query.fetch_particular_post(post_id);

                                                                                                                        if (resultvcx.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (resultvcx.status === true){
                                                                                                                            let resultvcy = await db_query.get_user_by_id(resultvcx.data[0].creators_user_id);

                                                                                                                            if (resultvcy.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (resultvcy.status === true){
                                                                                                                                var post_data = {
                                                                                                                                    profile_image: resultvcy.data[0].profile_image,
                                                                                                                                    name: resultvcy.data[0].name,
                                                                                                                                    date: resultvcx.data[0].post_creation_date,
                                                                                                                                    time: resultvcx.data[0].post_creation_time,
                                                                                                                                    post_data: resultvcx.data[0].post_data,
                                                                                                                                    post_type: resultvcx.data[0].post_type
                                                                                                                                }

                                                                                                                                var comment_data = {
                                                                                                                                    profile_image: profile_image,
                                                                                                                                    name: name,
                                                                                                                                    date: formated_date,
                                                                                                                                    comment: comment
                                                                                                                                }

                                                                                                                                if (user_role === 'Student'){
                                                                                                                                    for ([i, record] of students_of_class.entries()){
                                                                                                                                        let student_user_id = record.user_id;
                            
                                                                                                                                        let result5 = await db_query.get_user_settings(student_user_id);
                
                                                                                                                                        if (result5.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result5.status === true){
                                                                                                                                            let allow_email_notif = result5.data[0].allow_email_notif;
                
                                                                                                                                            let result6 = await db_query.get_user_by_id(student_user_id);
                
                                                                                                                                            if (result6.status === false){
                                                                                                                                                res.statusCode = 500;
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (result6.status === true){
                                                                                                                                                var student_email = result6.data[0].email;
                                                                                                                                                var student_name = result6.data[0].name;
                
                                                                                                                                                if (allow_email_notif === 'true'){
                                                                                                                                                    mail_service('public_comments_mail', student_email, false, false, false, student_name_x, student_name, post_data.name, post_data.profile_image, class_name, post_data.date, post_data.time, post_data.post_data, post_data.post_type, class_code, null, `${name} just added a new comment to a post in your class: ${class_name}`, student_name, `${name} just added a new comment to a post in your class: "${class_name}"`, post_data, comment_data); //Send mail
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
    
                                                                                                                                    let result6xx = await db_query.get_user_by_id(teacher_user_id);
                
                                                                                                                                    if (result6xx.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result6xx.status === true){
                                                                                                                                        var teacher_email = result6xx.data[0].email;
                                                                                                                                        var teacher_name = result6xx.data[0].name;
                                                                                                                                        mail_service('public_comments_mail', teacher_email, false, false, false, student_name_x, student_name, post_data.name, post_data.profile_image, class_name, post_data.date, post_data.time, post_data.post_data, post_data.post_type, class_code, null, `Your student ${name} just added a new comment to a post in your class: ${class_name}`, teacher_name, `Your student ${name} just added a new comment to a post in your class: "${class_name}"`, post_data, comment_data); //Send mail
                                                                                                                                        
                                                                                                                                        res.statusCode = 200;
                                                                                                                                        res.json({ status: 'comment_created', details: data, token_info: 'no_token' });
                                                                                                                                    }
                                                                                                                                } else if (user_role === 'Teacher'){
                                                                                                                                    for ([i, record] of students_of_class.entries()){
                                                                                                                                        let student_user_id = record.user_id;
                            
                                                                                                                                        let result5 = await db_query.get_user_settings(student_user_id);
                
                                                                                                                                        if (result5.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result5.status === true){
                                                                                                                                            let allow_email_notif = result5.data[0].allow_email_notif;
                
                                                                                                                                            let result6 = await db_query.get_user_by_id(student_user_id);
                
                                                                                                                                            if (result6.status === false){
                                                                                                                                                res.statusCode = 500;
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (result6.status === true){
                                                                                                                                                var student_email = result6.data[0].email;
                                                                                                                                                var student_name = result6.data[0].name;
                
                                                                                                                                                if (allow_email_notif === 'true'){
                                                                                                                                                    mail_service('public_comments_mail', student_email, false, false, false, student_name_x, student_name, post_data.name, post_data.profile_image, class_name, post_data.date, post_data.time, post_data.post_data, post_data.post_type, class_code, null, `Your teacher just added a new comment to a post in your class: ${class_name}`, student_name, `Your teacher just added a new comment to a post in your class: "${class_name}"`, post_data, comment_data); //Send mail
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
    
                                                                                                                                    let result6xx = await db_query.get_user_by_id(teacher_user_id);
                
                                                                                                                                    if (result6xx.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result6xx.status === true){
                                                                                                                                        var teacher_email = result6xx.data[0].email;
                                                                                                                                        var teacher_name = result6xx.data[0].name;
                                                                                                                                        mail_service('public_comments_mail', teacher_email, false, false, false, student_name_x, student_name, post_data.name, post_data.profile_image, class_name, post_data.date, post_data.time, post_data.post_data, post_data.post_type, class_code, null, `Your student ${name} just added a new comment to a post in your class: ${class_name}`, teacher_name, `Your student ${name} just added a new comment to a post in your class: "${class_name}"`, post_data, comment_data); //Send mail
                                                                                                                                        res.statusCode = 200;
                                                                                                                                        res.json({ status: 'comment_created', details: data, token_info: 'no_token' });
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            } else {
                                                                                                                res.statusCode = 200;
                                                                                                                res.json({ status: 'comment_created', details: data, token_info: 'no_token' });
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            } else {
                                                                                                res.statusCode = 404;
                                                                                                res.json({ status: 'post_not_found' });
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
            if (form_data.class_code && form_data.post_id && form_data.comment){
                //Filter and sanitize the request parameters
                let class_code = sanitize_data(form_data.class_code);
                let post_id = sanitize_data(form_data.post_id);
                let comment = sanitize_data(form_data.comment);

                if (/^ *$/.test(class_code)){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    if (/^ *$/.test(post_id)){
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
                                                                                        let resultz = await db_query.fetch_a_particular_post(post_id);

                                                                                        if (resultz.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured3' });
                                                                                        } else if (resultz.status === true){
                                                                                            if (resultz.data.length === 1){
                                                                                                let resultx = await db_query.create_comment(post_id, user_id, class_code, comment, formated_date);

                                                                                                if (resultx.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (resultx.status === true){
                                                                                                    console.log('sdwe2');
                                                                                                    if (resultx.data.length === 1){
                                                                                                        console.log('sdds');
                                                                                                        let data = {
                                                                                                            name: name,
                                                                                                            post_id: post_id,
                                                                                                            user_id: user_id,
                                                                                                            profile_img: profile_image,
                                                                                                            date: formated_date,
                                                                                                            comment_data: comment,
                                                                                                            class_code: class_code
                                                                                                        }

                                                                                                        let result2 = await db_query.fetch_all_students_of_joined_class_except_one(class_code, user_id);

                                                                                                        if (result2.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result2.status === true){
                                                                                                            var students_of_class = result2.data;

                                                                                                            if (students_of_class.length > 0){
                                                                                                                let result3 = await db_query.fetch_class_details(class_code);

                                                                                                                if (result3.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result3.status === true){
                                                                                                                    var class_name = result3.data[0].class_name;
                                                                                                                    var teacher_user_id = result3.data[0].creators_user_id;

                                                                                                                    let result4 = await db_query.get_user_by_id(user_id);

                                                                                                                    if (result4.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result4.status === true){
                                                                                                                        var student_name_x = result4.data[0].name;
                                                                                                                        var student_profile_img = result4.data[0].profile_image;
                                                                                                                        var user_role = result4.data[0].role;

                                                                                                                        let resultvcx = await db_query.fetch_particular_post(post_id);

                                                                                                                        if (resultvcx.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (resultvcx.status === true){
                                                                                                                            let resultvcy = await db_query.get_user_by_id(resultvcx.data[0].creators_user_id);

                                                                                                                            if (resultvcy.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (resultvcy.status === true){
                                                                                                                                var post_data = {
                                                                                                                                    profile_image: resultvcy.data[0].profile_image,
                                                                                                                                    name: resultvcy.data[0].name,
                                                                                                                                    date: resultvcx.data[0].post_creation_date,
                                                                                                                                    time: resultvcx.data[0].post_creation_time,
                                                                                                                                    post_data: resultvcx.data[0].post_data,
                                                                                                                                    post_type: resultvcx.data[0].post_type
                                                                                                                                }

                                                                                                                                var comment_data = {
                                                                                                                                    profile_image: profile_image,
                                                                                                                                    name: name,
                                                                                                                                    date: formated_date,
                                                                                                                                    comment: comment
                                                                                                                                }

                                                                                                                                if (user_role === 'Student'){
                                                                                                                                    for ([i, record] of students_of_class.entries()){
                                                                                                                                        let student_user_id = record.user_id;
                            
                                                                                                                                        let result5 = await db_query.get_user_settings(student_user_id);
                
                                                                                                                                        if (result5.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result5.status === true){
                                                                                                                                            let allow_email_notif = result5.data[0].allow_email_notif;
                
                                                                                                                                            let result6 = await db_query.get_user_by_id(student_user_id);
                
                                                                                                                                            if (result6.status === false){
                                                                                                                                                res.statusCode = 500;
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (result6.status === true){
                                                                                                                                                var student_email = result6.data[0].email;
                                                                                                                                                var student_name = result6.data[0].name;
                
                                                                                                                                                if (allow_email_notif === 'true'){
                                                                                                                                                    mail_service('public_comments_mail', student_email, false, false, false, student_name_x, student_name, post_data.name, post_data.profile_image, class_name, post_data.date, post_data.time, post_data.post_data, post_data.post_type, class_code, null, `${name} just added a new comment to a post in your class: ${class_name}`, student_name, `${name} just added a new comment to a post in your class: "${class_name}"`, post_data, comment_data); //Send mail
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }

                                                                                                                                    let result6xx = await db_query.get_user_by_id(teacher_user_id);
                
                                                                                                                                    if (result6xx.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result6xx.status === true){
                                                                                                                                        var teacher_email = result6xx.data[0].email;
                                                                                                                                        var teacher_name = result6xx.data[0].name;
                                                                                                                                        mail_service('public_comments_mail', teacher_email, false, false, false, student_name_x, student_name, post_data.name, post_data.profile_image, class_name, post_data.date, post_data.time, post_data.post_data, post_data.post_type, class_code, null, `Your student ${name} just added a new comment to a post in your class: ${class_name}`, teacher_name, `Your student ${name} just added a new comment to a post in your class: "${class_name}"`, post_data, comment_data); //Send mail
                                                                                                                                        
                                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                        res.statusCode = 200;
                                                                                                                                        res.json({ status: 'comment_created', details: data, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                    }
                                                                                                                                } else if (user_role === 'Teacher'){
                                                                                                                                    for ([i, record] of students_of_class.entries()){
                                                                                                                                        let student_user_id = record.user_id;
                            
                                                                                                                                        let result5 = await db_query.get_user_settings(student_user_id);
                
                                                                                                                                        if (result5.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result5.status === true){
                                                                                                                                            let allow_email_notif = result5.data[0].allow_email_notif;
                
                                                                                                                                            let result6 = await db_query.get_user_by_id(student_user_id);
                
                                                                                                                                            if (result6.status === false){
                                                                                                                                                res.statusCode = 500;
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (result6.status === true){
                                                                                                                                                var student_email = result6.data[0].email;
                                                                                                                                                var student_name = result6.data[0].name;
                
                                                                                                                                                if (allow_email_notif === 'true'){
                                                                                                                                                    mail_service('public_comments_mail', student_email, false, false, false, student_name_x, student_name, post_data.name, post_data.profile_image, class_name, post_data.date, post_data.time, post_data.post_data, post_data.post_type, class_code, null, `Your teacher just added a new comment to a post in your class: ${class_name}`, student_name, `Your teacher just added a new comment to a post in your class: "${class_name}"`, post_data, comment_data); //Send mail
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }

                                                                                                                                    let result6xx = await db_query.get_user_by_id(teacher_user_id);
                
                                                                                                                                    if (result6xx.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result6xx.status === true){
                                                                                                                                        var teacher_email = result6xx.data[0].email;
                                                                                                                                        var teacher_name = result6xx.data[0].name;
                                                                                                                                        mail_service('public_comments_mail', teacher_email, false, false, false, student_name_x, student_name, post_data.name, post_data.profile_image, class_name, post_data.date, post_data.time, post_data.post_data, post_data.post_type, class_code, null, `Your student ${name} just added a new comment to a post in your class: ${class_name}`, teacher_name, `Your student ${name} just added a new comment to a post in your class: "${class_name}"`, post_data, comment_data); //Send mail
                                                                                                                                        
                                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                        res.statusCode = 200;
                                                                                                                                        res.json({ status: 'comment_created', details: data, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            } else {
                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                res.statusCode = 200;
                                                                                                                res.json({ status: 'comment_created', details: data, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            } else {
                                                                                                res.statusCode = 404;
                                                                                                res.json({ status: 'post_not_found' });
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
                                                                                            let resultz = await db_query.fetch_a_particular_post(post_id);

                                                                                            if (resultz.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured3' });
                                                                                            } else if (resultz.status === true){
                                                                                                if (resultz.data.length === 1){
                                                                                                    let resultx = await db_query.create_comment(post_id, user_id, class_code, comment, formated_date);

                                                                                                    if (resultx.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (resultx.status === true){
                                                                                                        console.log('sdwe2ww');
                                                                                                        if (resultx.data.length === 1){
                                                                                                            console.log('sdwe2mmkk');
                                                                                                            let data = {
                                                                                                                name: name,
                                                                                                                post_id: post_id,
                                                                                                                user_id: user_id,
                                                                                                                profile_img: profile_image,
                                                                                                                date: formated_date,
                                                                                                                comment_data: comment,
                                                                                                                class_code: class_code
                                                                                                            }

                                                                                                            let result2 = await db_query.fetch_all_students_of_joined_class_except_one(class_code, user_id);

                                                                                                            if (result2.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result2.status === true){
                                                                                                                var students_of_class = result2.data;

                                                                                                                if (students_of_class.length > 0){
                                                                                                                    let result3 = await db_query.fetch_class_details(class_code);

                                                                                                                    if (result3.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result3.status === true){
                                                                                                                        var class_name = result3.data[0].class_name;
                                                                                                                        var teacher_user_id = result3.data[0].creators_user_id;

                                                                                                                        let result4 = await db_query.get_user_by_id(user_id);

                                                                                                                        if (result4.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result4.status === true){
                                                                                                                            var student_name_x = result4.data[0].name;
                                                                                                                            var student_profile_img = result4.data[0].profile_image;
                                                                                                                            var user_role = result4.data[0].role;

                                                                                                                            let resultvcx = await db_query.fetch_particular_post(post_id);

                                                                                                                            if (resultvcx.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (resultvcx.status === true){
                                                                                                                                let resultvcy = await db_query.get_user_by_id(resultvcx.data[0].creators_user_id);

                                                                                                                                if (resultvcy.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (resultvcy.status === true){
                                                                                                                                    var post_data = {
                                                                                                                                        profile_image: resultvcy.data[0].profile_image,
                                                                                                                                        name: resultvcy.data[0].name,
                                                                                                                                        date: resultvcx.data[0].post_creation_date,
                                                                                                                                        time: resultvcx.data[0].post_creation_time,
                                                                                                                                        post_data: resultvcx.data[0].post_data,
                                                                                                                                        post_type: resultvcx.data[0].post_type
                                                                                                                                    }

                                                                                                                                    var comment_data = {
                                                                                                                                        profile_image: profile_image,
                                                                                                                                        name: name,
                                                                                                                                        date: formated_date,
                                                                                                                                        comment: comment
                                                                                                                                    }

                                                                                                                                    if (user_role === 'Student'){
                                                                                                                                        for ([i, record] of students_of_class.entries()){
                                                                                                                                            let student_user_id = record.user_id;
                                
                                                                                                                                            let result5 = await db_query.get_user_settings(student_user_id);
                    
                                                                                                                                            if (result5.status === false){
                                                                                                                                                res.statusCode = 500;
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (result5.status === true){
                                                                                                                                                let allow_email_notif = result5.data[0].allow_email_notif;
                    
                                                                                                                                                let result6 = await db_query.get_user_by_id(student_user_id);
                    
                                                                                                                                                if (result6.status === false){
                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                } else if (result6.status === true){
                                                                                                                                                    var student_email = result6.data[0].email;
                                                                                                                                                    var student_name = result6.data[0].name;
                    
                                                                                                                                                    if (allow_email_notif === 'true'){
                                                                                                                                                        mail_service('public_comments_mail', student_email, false, false, false, student_name_x, student_name, post_data.name, post_data.profile_image, class_name, post_data.date, post_data.time, post_data.post_data, post_data.post_type, class_code, null, `${name} just added a new comment to a post in your class: ${class_name}`, student_name, `${name} just added a new comment to a post in your class: "${class_name}"`, post_data, comment_data); //Send mail
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
    
                                                                                                                                        let result6xx = await db_query.get_user_by_id(teacher_user_id);
                    
                                                                                                                                        if (result6xx.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result6xx.status === true){
                                                                                                                                            var teacher_email = result6xx.data[0].email;
                                                                                                                                            var teacher_name = result6xx.data[0].name;
                                                                                                                                            mail_service('public_comments_mail', teacher_email, false, false, false, student_name_x, student_name, post_data.name, post_data.profile_image, class_name, post_data.date, post_data.time, post_data.post_data, post_data.post_type, class_code, null, `Your student ${name} just added a new comment to a post in your class: ${class_name}`, teacher_name, `Your student ${name} just added a new comment to a post in your class: "${class_name}"`, post_data, comment_data); //Send mail
                                                                                                                                            res.statusCode = 200;
                                                                                                                                            res.json({ status: 'comment_created', details: data, token_info: 'no_token' });
                                                                                                                                        }
                                                                                                                                    } else if (user_role === 'Teacher'){
                                                                                                                                        for ([i, record] of students_of_class.entries()){
                                                                                                                                            let student_user_id = record.user_id;
                                
                                                                                                                                            let result5 = await db_query.get_user_settings(student_user_id);
                    
                                                                                                                                            if (result5.status === false){
                                                                                                                                                res.statusCode = 500;
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (result5.status === true){
                                                                                                                                                let allow_email_notif = result5.data[0].allow_email_notif;
                    
                                                                                                                                                let result6 = await db_query.get_user_by_id(student_user_id);
                    
                                                                                                                                                if (result6.status === false){
                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                } else if (result6.status === true){
                                                                                                                                                    var student_email = result6.data[0].email;
                                                                                                                                                    var student_name = result6.data[0].name;
                    
                                                                                                                                                    if (allow_email_notif === 'true'){
                                                                                                                                                        mail_service('public_comments_mail', student_email, false, false, false, student_name_x, student_name, post_data.name, post_data.profile_image, class_name, post_data.date, post_data.time, post_data.post_data, post_data.post_type, class_code, null, `Your teacher just added a new comment to a post in your class: ${class_name}`, student_name, `Your teacher just added a new comment to a post in your class: "${class_name}"`, post_data, comment_data); //Send mail
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
    
                                                                                                                                        let result6xx = await db_query.get_user_by_id(teacher_user_id);
                    
                                                                                                                                        if (result6xx.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result6xx.status === true){
                                                                                                                                            var teacher_email = result6xx.data[0].email;
                                                                                                                                            var teacher_name = result6xx.data[0].name;
                                                                                                                                            mail_service('public_comments_mail', teacher_email, false, false, false, student_name_x, student_name, post_data.name, post_data.profile_image, class_name, post_data.date, post_data.time, post_data.post_data, post_data.post_type, class_code, null, `Your student ${name} just added a new comment to a post in your class: ${class_name}`, teacher_name, `Your student ${name} just added a new comment to a post in your class: "${class_name}"`, post_data, comment_data); //Send mail
                                                                                                                                            res.statusCode = 200;
                                                                                                                                            res.json({ status: 'comment_created', details: data, token_info: 'no_token' });
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    res.statusCode = 200;
                                                                                                                    res.json({ status: 'comment_created', details: data, token_info: 'no_token' });
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                } else {
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'post_not_found' });
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

module.exports = send_comment;