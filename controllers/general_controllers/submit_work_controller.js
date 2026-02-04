const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db_query
const mail_service = require('../../utility/mail_service.util'); //Import mail service
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header
const moment = require('moment'); //Import moment module

const submit_work = async (req, res) => {
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
            if (form_data.access_token && form_data.class_code && form_data.classwork_id && form_data.student_answers){

                //Filter and sanitize the request parameters
                let access_token = sanitize_data(form_data.access_token);
                let class_code = sanitize_data(form_data.class_code);
                let classwork_id = sanitize_data(form_data.classwork_id);

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
                                                                var student_name = result.data[0].name;

                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                    let resultz = await db_query.check_if_student_account(user_id);

                                                                    if (resultz.status === false){
                                                                        res.statusCode = 500;
                                                                        res.json({ status: 'error_occured' });
                                                                    } else if (resultz.status === true){
                                                                        if (resultz.data.length > 0 && resultz.data.length === 1){
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
                                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                                            let result3 = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                            if (result3.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result3.status === true){
                                                                                                if (result3.data.length > 0 && result3.data.length === 1){
                                                                                                    let classwork_data = result3.data[0];
                                                                                                    let classwork_due_date = classwork_data.date_format;
                                                                                                    let classwork_due_time = classwork_data.due_time;
                                                                                                    let classwork_type = classwork_data.classwork_type;
                                                                                                    let q_a = JSON.parse(classwork_data.q_a);
                                                                                                    let points = classwork_data.points;
                                                                                                    let condition = null;

                                                                                                    let resultx = await db_query.fetch_classwork_result(classwork_id, class_code, user_id);

                                                                                                    if (resultx.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (resultx.status === true){
                                                                                                        if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                                            res.statusCode = 200;
                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                            res.json({ status: 'work_submitted', classwork_type: classwork_type, msg: 'work_has_been_submitted_already', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                        } else {
                                                                                                            let current_date = moment().format("YYYY-MM-DD");
                                                                                                            let current_time = moment().format('h:mm a');

                                                                                                            if (moment(current_date).isSame(classwork_due_date)){
                                                                                                                condition = 1;
                                                                                                            } else if (moment(current_date).isBefore(classwork_due_date)){
                                                                                                                condition = 2;
                                                                                                            } else {
                                                                                                                condition = 3;
                                                                                                            }

                                                                                                            let valid_status = null;
        
                                                                                                            if (condition === 1){
                                                                                                                if (moment(current_time, 'h:mm a').isBefore(moment(classwork_due_time, 'h:mm a'))){
                                                                                                                    valid_status = true;
                                                                                                                } else {
                                                                                                                    valid_status = false;
                                                                                                                }
                                                                                                            } else if (condition === 2){
                                                                                                                valid_status = true;
                                                                                                            } else if (condition === 3){
                                                                                                                valid_status = false;
                                                                                                            }

                                                                                                            if (valid_status === true){
                                                                                                                if (classwork_type === 'assignment' || classwork_type === 'classwork'){
                                                                                                                    let v_check = true;

                                                                                                                    try {
                                                                                                                        JSON.parse(form_data.student_answers);
                                                                                                                    } catch (error) {
                                                                                                                        v_check = false;
                                                                                                                    }

                                                                                                                    if (v_check === true){
                                                                                                                        let student_answers = JSON.parse(form_data.student_answers);

                                                                                                                        if (Array.isArray(student_answers)){
                                                                                                                            let total_questions = q_a.length;
                                                                                                                            let no_of_questions_answered_by_student = student_answers.length;
                                                                                                                            let total_score = 0;
                                                                                                                            let err_count = 0;
    
                                                                                                                            if (no_of_questions_answered_by_student === total_questions){
                                                                                                                                for (let [i, question] of student_answers.entries()) {
                                                                                                                                    let real_answer = q_a[i].answer;
    
                                                                                                                                    if (typeof question === 'object'){
                                                                                                                                        if (question.hasOwnProperty("answer")){
                                                                                                                                            let student_answer = question.answer;
    
                                                                                                                                            if (student_answer === real_answer){
                                                                                                                                                total_score += points;
                                                                                                                                            }
                                                                                                                                        } else {
                                                                                                                                            err_count += 1;
                                                                                                                                        }
                                                                                                                                    } else {
                                                                                                                                        err_count += 1;
                                                                                                                                    }
                                                                                                                                }
    
                                                                                                                                if (err_count >= 1){
                                                                                                                                    res.statusCode = 401;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (err_count === 0){
                                                                                                                                    let real_total_score = total_score / total_questions;
    
                                                                                                                                    for (let [i, question] of student_answers.entries()){
                                                                                                                                        question["correct_answer"] = q_a[i].answer;
                                                                                                                                    }
    
                                                                                                                                    let resultzc = await db_query.insert_student_response(classwork_id, user_id, null, JSON.stringify(student_answers), class_code, real_total_score);
    
                                                                                                                                    if (resultzc.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (resultzc.status === true){
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
                                                                                                                                                        mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `A student of your class: "${class_name}" named ${student_name}, has submitted the ${classwork_type} that you assigned`, teacher_name, `<p style="font-weight: 400;"><b>A student of your class: "${class_name}" named <span style="font-weight: 700;">${student_name}</span>, has submitted the ${classwork_type} that you assigned. Click the link below to view the students scores:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/teacher/view_classwork?class_code=${class_code}&id=${classwork_id}">${process.env.URL}/teacher/view_classwork?class_code=${class_code}&id=${classwork_id}</a></p>`, null, null); //Send mail

                                                                                                                                                        res.statusCode = 200;
                                                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                        res.json({ status: true, msg: 'work_submitted_successfully', classwork_type: classwork_type, token_info: 'token_available', new_accessToken: new_access_token });   
                                                                                                                                                    } else if (allow_email_notif === 'false'){
                                                                                                                                                        res.statusCode = 200;
                                                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                        res.json({ status: true, msg: 'work_submitted_successfully', classwork_type: classwork_type, token_info: 'token_available', new_accessToken: new_access_token });   
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            } else {
                                                                                                                                res.statusCode = 401;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            }
                                                                                                                        } else {
                                                                                                                            res.statusCode = 401;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        }
                                                                                                                    } else if (v_check === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    }   
                                                                                                                } else if (classwork_type === 'attendance'){
                                                                                                                    let resultzc = await db_query.insert_student_response(classwork_id, user_id, points, null, class_code, points);

                                                                                                                    if (resultzc.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (resultzc.status === true){
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
                                                                                                                                        mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `A student of your class: "${class_name}" named ${student_name}, has submitted the ${classwork_type} that you assigned`, teacher_name, `<p style="font-weight: 400;"><b>A student of your class: "${class_name}" named <span style="font-weight: 700;">${student_name}</span>, has submitted the ${classwork_type} that you assigned. Click the link below to view the students scores:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/teacher/view_classwork?class_code=${class_code}&id=${classwork_id}">${process.env.URL}/teacher/view_classwork?class_code=${class_code}&id=${classwork_id}</a></p>`, null, null); //Send mail

                                                                                                                                        res.statusCode = 200;
                                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                        res.json({ status: true, msg: 'work_submitted_successfully', classwork_type: classwork_type, token_info: 'token_available', new_accessToken: new_access_token });   
                                                                                                                                    } else if (allow_email_notif === 'false'){
                                                                                                                                        res.statusCode = 200;
                                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                        res.json({ status: true, msg: 'work_submitted_successfully', classwork_type: classwork_type, token_info: 'token_available', new_accessToken: new_access_token });     
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            } else {
                                                                                                                res.statusCode = 200;
                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                res.json({ status: false, msg: 'classwork_expired', classwork_type: classwork_type, token_info: 'token_available', new_accessToken: new_access_token });
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
                                                                                            res.json({ status: 'not_part_of_class' });
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
                                                                    var student_name = result.data[0].name;

                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                        let resultz = await db_query.check_if_student_account(user_id);

                                                                        if (resultz.status === false){
                                                                            res.statusCode = 500;
                                                                            res.json({ status: 'error_occured' });
                                                                        } else if (resultz.status === true){
                                                                            if (resultz.data.length > 0 && resultz.data.length === 1){
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
                                                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                                                let result3 = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                if (result3.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result3.status === true){
                                                                                                    if (result3.data.length > 0 && result3.data.length === 1){
                                                                                                        let classwork_data = result3.data[0];
                                                                                                        let classwork_due_date = classwork_data.date_format;
                                                                                                        let classwork_due_time = classwork_data.due_time;
                                                                                                        let classwork_type = classwork_data.classwork_type;
                                                                                                        let q_a = JSON.parse(classwork_data.q_a);
                                                                                                        let points = classwork_data.points;
                                                                                                        let condition = null;

                                                                                                        let resultx = await db_query.fetch_classwork_result(classwork_id, class_code, user_id);

                                                                                                        if (resultx.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (resultx.status === true){
                                                                                                            if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                                                res.statusCode = 200;
                                                                                                                res.json({ status: 'work_submitted', classwork_type: classwork_type, msg: 'work_has_been_submitted_already', token_info: 'no_token' });
                                                                                                            } else {
                                                                                                                let current_date = moment().format("YYYY-MM-DD");
                                                                                                                let current_time = moment().format('h:mm a');

                                                                                                                if (moment(current_date).isSame(classwork_due_date)){
                                                                                                                    condition = 1;
                                                                                                                } else if (moment(current_date).isBefore(classwork_due_date)){
                                                                                                                    condition = 2;
                                                                                                                } else {
                                                                                                                    condition = 3;
                                                                                                                }

                                                                                                                let valid_status = null;
            
                                                                                                                if (condition === 1){
                                                                                                                    if (moment(current_time, 'h:mm a').isBefore(moment(classwork_due_time, 'h:mm a'))){
                                                                                                                        valid_status = true;
                                                                                                                    } else {
                                                                                                                        valid_status = false;
                                                                                                                    }
                                                                                                                } else if (condition === 2){
                                                                                                                    valid_status = true;
                                                                                                                } else if (condition === 3){
                                                                                                                    valid_status = false;
                                                                                                                }

                                                                                                                if (valid_status === true){
                                                                                                                    if (classwork_type === 'assignment' || classwork_type === 'classwork'){
                                                                                                                        let v_check = true;

                                                                                                                        try {
                                                                                                                            JSON.parse(form_data.student_answers);
                                                                                                                        } catch (error) {
                                                                                                                            v_check = false;
                                                                                                                        }

                                                                                                                        if (v_check === true){
                                                                                                                            let student_answers = JSON.parse(form_data.student_answers);

                                                                                                                            if (Array.isArray(student_answers)){
                                                                                                                                let total_questions = q_a.length;
                                                                                                                                let no_of_questions_answered_by_student = student_answers.length;
                                                                                                                                let total_score = 0;
                                                                                                                                let err_count = 0;
    
                                                                                                                                if (no_of_questions_answered_by_student === total_questions){
                                                                                                                                    for (let [i, question] of student_answers.entries()) {
                                                                                                                                        let real_answer = q_a[i].answer;
    
                                                                                                                                        if (typeof question === 'object'){
                                                                                                                                            if (question.hasOwnProperty("answer")){
                                                                                                                                                let student_answer = question.answer;
    
                                                                                                                                                if (student_answer === real_answer){
                                                                                                                                                    total_score += points;
                                                                                                                                                }
                                                                                                                                            } else {
                                                                                                                                                err_count += 1;
                                                                                                                                            }
                                                                                                                                        } else {
                                                                                                                                            err_count += 1;
                                                                                                                                        }
                                                                                                                                    }
    
                                                                                                                                    if (err_count >= 1){
                                                                                                                                        res.statusCode = 401;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (err_count === 0){
                                                                                                                                        let real_total_score = total_score / total_questions;
    
                                                                                                                                        for (let [i, question] of student_answers.entries()){
                                                                                                                                            question["correct_answer"] = q_a[i].answer;
                                                                                                                                        }
    
                                                                                                                                        let resultzc = await db_query.insert_student_response(classwork_id, user_id, null, JSON.stringify(student_answers), class_code, real_total_score);
    
                                                                                                                                        if (resultzc.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (resultzc.status === true){
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
                                                                                                                                                            mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `A student of your class: "${class_name}" named ${student_name}, has submitted the ${classwork_type} that you assigned`, teacher_name, `<p style="font-weight: 400;"><b>A student of your class: "${class_name}" named <span style="font-weight: 700;">${student_name}</span>, has submitted the ${classwork_type} that you assigned. Click the link below to view the students scores:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/teacher/view_classwork?class_code=${class_code}&id=${classwork_id}">${process.env.URL}/teacher/view_classwork?class_code=${class_code}&id=${classwork_id}</a></p>`, null, null); //Send mail

                                                                                                                                                            res.statusCode = 200;
                                                                                                                                                            res.json({ status: true, msg: 'work_submitted_successfully', classwork_type: classwork_type, token_info: 'no_token' });   
                                                                                                                                                        } else if (allow_email_notif === 'false'){
                                                                                                                                                            res.statusCode = 200;
                                                                                                                                                            res.json({ status: true, msg: 'work_submitted_successfully', classwork_type: classwork_type, token_info: 'no_token' });     
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                } else {
                                                                                                                                    res.statusCode = 401;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                }
                                                                                                                            } else {
                                                                                                                                res.statusCode = 401;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            }
                                                                                                                        } else if (v_check === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        }   
                                                                                                                    } else if (classwork_type === 'attendance'){
                                                                                                                        let resultzc = await db_query.insert_student_response(classwork_id, user_id, points, null, class_code, points);

                                                                                                                        if (resultzc.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (resultzc.status === true){
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
                                                                                                                                            mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `A student of your class: "${class_name}" named ${student_name}, has submitted the ${classwork_type} that you assigned`, teacher_name, `<p style="font-weight: 400;"><b>A student of your class: "${class_name}" named <span style="font-weight: 700;">${student_name}</span>, has submitted the ${classwork_type} that you assigned. Click the link below to view the students scores:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/teacher/view_classwork?class_code=${class_code}&id=${classwork_id}">${process.env.URL}/teacher/view_classwork?class_code=${class_code}&id=${classwork_id}</a></p>`, null, null); //Send mail

                                                                                                                                            res.statusCode = 200;
                                                                                                                                            res.json({ status: true, msg: 'work_submitted_successfully', classwork_type: classwork_type, token_info: 'no_token' });   
                                                                                                                                        } else if (allow_email_notif === 'false'){
                                                                                                                                            res.statusCode = 200;
                                                                                                                                            res.json({ status: true, msg: 'work_submitted_successfully', classwork_type: classwork_type, token_info: 'no_token' });     
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    res.statusCode = 200;
                                                                                                                    res.json({ status: false, msg: 'classwork_expired', classwork_type: classwork_type, token_info: 'no_token' });
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
                                                                                                res.json({ status: 'not_part_of_class' });
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
            if (form_data.class_code && form_data.classwork_id && form_data.student_answers){

                //Filter and sanitize the request parameters
                let class_code = sanitize_data(form_data.class_code);
                let classwork_id = sanitize_data(form_data.classwork_id);

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
                                                                    var student_name = result.data[0].name;

                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                        let resultz = await db_query.check_if_student_account(user_id);

                                                                        if (resultz.status === false){
                                                                            res.statusCode = 500;
                                                                            res.json({ status: 'error_occured' });
                                                                        } else if (resultz.status === true){
                                                                            if (resultz.data.length > 0 && resultz.data.length === 1){
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
                                                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                                                let result3 = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                if (result3.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result3.status === true){
                                                                                                    if (result3.data.length > 0 && result3.data.length === 1){
                                                                                                        let classwork_data = result3.data[0];
                                                                                                        let classwork_due_date = classwork_data.date_format;
                                                                                                        let classwork_due_time = classwork_data.due_time;
                                                                                                        let classwork_type = classwork_data.classwork_type;
                                                                                                        let q_a = JSON.parse(classwork_data.q_a);
                                                                                                        let points = classwork_data.points;
                                                                                                        let condition = null;

                                                                                                        let resultx = await db_query.fetch_classwork_result(classwork_id, class_code, user_id);

                                                                                                        if (resultx.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (resultx.status === true){
                                                                                                            if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                                                res.statusCode = 200;
                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                res.json({ status: 'work_submitted', classwork_type: classwork_type, msg: 'work_has_been_submitted_already', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                            } else {
                                                                                                                let current_date = moment().format("YYYY-MM-DD");
                                                                                                                let current_time = moment().format('h:mm a');

                                                                                                                if (moment(current_date).isSame(classwork_due_date)){
                                                                                                                    condition = 1;
                                                                                                                } else if (moment(current_date).isBefore(classwork_due_date)){
                                                                                                                    condition = 2;
                                                                                                                } else {
                                                                                                                    condition = 3;
                                                                                                                }

                                                                                                                let valid_status = null;
            
                                                                                                                if (condition === 1){
                                                                                                                    if (moment(current_time, 'h:mm a').isBefore(moment(classwork_due_time, 'h:mm a'))){
                                                                                                                        valid_status = true;
                                                                                                                    } else {
                                                                                                                        valid_status = false;
                                                                                                                    }
                                                                                                                } else if (condition === 2){
                                                                                                                    valid_status = true;
                                                                                                                } else if (condition === 3){
                                                                                                                    valid_status = false;
                                                                                                                }

                                                                                                                if (valid_status === true){
                                                                                                                    if (classwork_type === 'assignment' || classwork_type === 'classwork'){
                                                                                                                        let v_check = true;

                                                                                                                        try {
                                                                                                                            JSON.parse(form_data.student_answers);
                                                                                                                        } catch (error) {
                                                                                                                            v_check = false;
                                                                                                                        }

                                                                                                                        if (v_check === true){
                                                                                                                            let student_answers = JSON.parse(form_data.student_answers);

                                                                                                                            if (Array.isArray(student_answers)){
                                                                                                                                let total_questions = q_a.length;
                                                                                                                                let no_of_questions_answered_by_student = student_answers.length;
                                                                                                                                let total_score = 0;
                                                                                                                                let err_count = 0;
        
                                                                                                                                if (no_of_questions_answered_by_student === total_questions){
                                                                                                                                    for (let [i, question] of student_answers.entries()) {
                                                                                                                                        let real_answer = q_a[i].answer;
        
                                                                                                                                        if (typeof question === 'object'){
                                                                                                                                            if (question.hasOwnProperty("answer")){
                                                                                                                                                let student_answer = question.answer;
        
                                                                                                                                                if (student_answer === real_answer){
                                                                                                                                                    total_score += points;
                                                                                                                                                }
                                                                                                                                            } else {
                                                                                                                                                err_count += 1;
                                                                                                                                            }
                                                                                                                                        } else {
                                                                                                                                            err_count += 1;
                                                                                                                                        }
                                                                                                                                    }
        
                                                                                                                                    if (err_count >= 1){
                                                                                                                                        res.statusCode = 401;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (err_count === 0){
                                                                                                                                        let real_total_score = total_score / total_questions;
        
                                                                                                                                        for (let [i, question] of student_answers.entries()){
                                                                                                                                            question["correct_answer"] = q_a[i].answer;
                                                                                                                                        }
        
                                                                                                                                        let resultzc = await db_query.insert_student_response(classwork_id, user_id, null, JSON.stringify(student_answers), class_code, real_total_score);
        
                                                                                                                                        if (resultzc.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (resultzc.status === true){
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
                                                                                                                                                            mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `A student of your class: "${class_name}" named ${student_name}, has submitted the ${classwork_type} that you assigned`, teacher_name, `<p style="font-weight: 400;"><b>A student of your class: "${class_name}" named <span style="font-weight: 700;">${student_name}</span>, has submitted the ${classwork_type} that you assigned. Click the link below to view the students scores:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/teacher/view_classwork?class_code=${class_code}&id=${classwork_id}">${process.env.URL}/teacher/view_classwork?class_code=${class_code}&id=${classwork_id}</a></p>`, null, null); //Send mail

                                                                                                                                                            res.statusCode = 200;
                                                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                            res.json({ status: true, msg: 'work_submitted_successfully', classwork_type: classwork_type, token_info: 'token_available', new_accessToken: new_access_token });   
                                                                                                                                                        } else if (allow_email_notif === 'false'){
                                                                                                                                                            res.statusCode = 200;
                                                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                            res.json({ status: true, msg: 'work_submitted_successfully', classwork_type: classwork_type, token_info: 'token_available', new_accessToken: new_access_token });     
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                } else {
                                                                                                                                    res.statusCode = 401;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                }
                                                                                                                            } else {
                                                                                                                                res.statusCode = 401;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            }
                                                                                                                        } else if (v_check === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        }  
                                                                                                                    } else if (classwork_type === 'attendance'){
                                                                                                                        let resultzc = await db_query.insert_student_response(classwork_id, user_id, points, null, class_code, points);

                                                                                                                        if (resultzc.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (resultzc.status === true){
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
                                                                                                                                            mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `A student of your class: "${class_name}" named ${student_name}, has submitted the ${classwork_type} that you assigned`, teacher_name, `<p style="font-weight: 400;"><b>A student of your class: "${class_name}" named <span style="font-weight: 700;">${student_name}</span>, has submitted the ${classwork_type} that you assigned. Click the link below to view the students scores:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/teacher/view_classwork?class_code=${class_code}&id=${classwork_id}">${process.env.URL}/teacher/view_classwork?class_code=${class_code}&id=${classwork_id}</a></p>`, null, null); //Send mail

                                                                                                                                            res.statusCode = 200;
                                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                            res.json({ status: true, msg: 'work_submitted_successfully', classwork_type: classwork_type, token_info: 'token_available', new_accessToken: new_access_token });   
                                                                                                                                        } else if (allow_email_notif === 'false'){
                                                                                                                                            res.statusCode = 200;
                                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                            res.json({ status: true, msg: 'work_submitted_successfully', classwork_type: classwork_type, token_info: 'token_available', new_accessToken: new_access_token });     
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    res.statusCode = 200;
                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                    res.json({ status: false, msg: 'classwork_expired', classwork_type: classwork_type, token_info: 'token_available', new_accessToken: new_access_token });
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
                                                                                                res.json({ status: 'not_part_of_class' });
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
                                                                        var student_name = result.data[0].name;

                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                            let resultz = await db_query.check_if_student_account(user_id);

                                                                            if (resultz.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (resultz.status === true){
                                                                                if (resultz.data.length > 0 && resultz.data.length === 1){
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
                                                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                                                    let result3 = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                    if (result3.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result3.status === true){
                                                                                                        if (result3.data.length > 0 && result3.data.length === 1){
                                                                                                            let classwork_data = result3.data[0];
                                                                                                            let classwork_due_date = classwork_data.date_format;
                                                                                                            let classwork_due_time = classwork_data.due_time;
                                                                                                            let classwork_type = classwork_data.classwork_type;
                                                                                                            let q_a = JSON.parse(classwork_data.q_a);
                                                                                                            let points = classwork_data.points;
                                                                                                            let condition = null;

                                                                                                            let resultx = await db_query.fetch_classwork_result(classwork_id, class_code, user_id);

                                                                                                            if (resultx.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (resultx.status === true){
                                                                                                                if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                                                    res.statusCode = 200;
                                                                                                                    res.json({ status: 'work_submitted', classwork_type: classwork_type, msg: 'work_has_been_submitted_already', token_info: 'no_token' });
                                                                                                                } else {
                                                                                                                    let current_date = moment().format("YYYY-MM-DD");
                                                                                                                    let current_time = moment().format('h:mm a');

                                                                                                                    if (moment(current_date).isSame(classwork_due_date)){
                                                                                                                        condition = 1;
                                                                                                                    } else if (moment(current_date).isBefore(classwork_due_date)){
                                                                                                                        condition = 2;
                                                                                                                    } else {
                                                                                                                        condition = 3;
                                                                                                                    }

                                                                                                                    let valid_status = null;
                
                                                                                                                    if (condition === 1){
                                                                                                                        if (moment(current_time, 'h:mm a').isBefore(moment(classwork_due_time, 'h:mm a'))){
                                                                                                                            valid_status = true;
                                                                                                                        } else {
                                                                                                                            valid_status = false;
                                                                                                                        }
                                                                                                                    } else if (condition === 2){
                                                                                                                        valid_status = true;
                                                                                                                    } else if (condition === 3){
                                                                                                                        valid_status = false;
                                                                                                                    }

                                                                                                                    if (valid_status === true){
                                                                                                                        if (classwork_type === 'assignment' || classwork_type === 'classwork'){
                                                                                                                            let v_check = true;

                                                                                                                            try {
                                                                                                                                JSON.parse(form_data.student_answers);
                                                                                                                            } catch (error) {
                                                                                                                                v_check = false;
                                                                                                                            }

                                                                                                                            if (v_check === true){
                                                                                                                                let student_answers = JSON.parse(form_data.student_answers);

                                                                                                                                if (Array.isArray(student_answers)){
                                                                                                                                    let total_questions = q_a.length;
                                                                                                                                    let no_of_questions_answered_by_student = student_answers.length;
                                                                                                                                    let total_score = 0;
                                                                                                                                    let err_count = 0;
        
                                                                                                                                    if (no_of_questions_answered_by_student === total_questions){
                                                                                                                                        for (let [i, question] of student_answers.entries()) {
                                                                                                                                            let real_answer = q_a[i].answer;
        
                                                                                                                                            if (typeof question === 'object'){
                                                                                                                                                if (question.hasOwnProperty("answer")){
                                                                                                                                                    let student_answer = question.answer;
        
                                                                                                                                                    if (student_answer === real_answer){
                                                                                                                                                        total_score += points;
                                                                                                                                                    }
                                                                                                                                                } else {
                                                                                                                                                    err_count += 1;
                                                                                                                                                }
                                                                                                                                            } else {
                                                                                                                                                err_count += 1;
                                                                                                                                            }
                                                                                                                                        }
        
                                                                                                                                        if (err_count >= 1){
                                                                                                                                            res.statusCode = 401;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (err_count === 0){
                                                                                                                                            let real_total_score = total_score / total_questions;
        
                                                                                                                                            for (let [i, question] of student_answers.entries()){
                                                                                                                                                question["correct_answer"] = q_a[i].answer;
                                                                                                                                            }
        
                                                                                                                                            let resultzc = await db_query.insert_student_response(classwork_id, user_id, null, JSON.stringify(student_answers), class_code, real_total_score);
        
                                                                                                                                            if (resultzc.status === false){
                                                                                                                                                res.statusCode = 500;
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (resultzc.status === true){
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
                                                                                                                                                                mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `A student of your class: "${class_name}" named ${student_name}, has submitted the ${classwork_type} that you assigned`, teacher_name, `<p style="font-weight: 400;"><b>A student of your class: "${class_name}" named <span style="font-weight: 700;">${student_name}</span>, has submitted the ${classwork_type} that you assigned. Click the link below to view the students scores:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/teacher/view_classwork?class_code=${class_code}&id=${classwork_id}">${process.env.URL}/teacher/view_classwork?class_code=${class_code}&id=${classwork_id}</a></p>`, null, null); //Send mail

                                                                                                                                                                res.statusCode = 200;
                                                                                                                                                                res.json({ status: true, msg: 'work_submitted_successfully', classwork_type: classwork_type, token_info: 'no_token' });   
                                                                                                                                                            } else if (allow_email_notif === 'false'){
                                                                                                                                                                res.statusCode = 200;
                                                                                                                                                                res.json({ status: true, msg: 'work_submitted_successfully', classwork_type: classwork_type, token_info: 'no_token' });     
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    } else {
                                                                                                                                        res.statusCode = 401;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    }
                                                                                                                                } else {
                                                                                                                                    res.statusCode = 401;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                }
                                                                                                                            } else if (v_check === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } 
                                                                                                                        } else if (classwork_type === 'attendance'){
                                                                                                                            let resultzc = await db_query.insert_student_response(classwork_id, user_id, points, null, class_code, points);

                                                                                                                            if (resultzc.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (resultzc.status === true){
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
                                                                                                                                                mail_service('plain_mail', teacher_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Class Notification', `A student of your class: "${class_name}" named ${student_name}, has submitted the ${classwork_type} that you assigned`, teacher_name, `<p style="font-weight: 400;"><b>A student of your class: "${class_name}" named <span style="font-weight: 700;">${student_name}</span>, has submitted the ${classwork_type} that you assigned. Click the link below to view the students scores:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/teacher/view_classwork?class_code=${class_code}&id=${classwork_id}">${process.env.URL}/teacher/view_classwork?class_code=${class_code}&id=${classwork_id}</a></p>`, null, null); //Send mail

                                                                                                                                                res.statusCode = 200;
                                                                                                                                                res.json({ status: true, msg: 'work_submitted_successfully', classwork_type: classwork_type, token_info: 'no_token' });   
                                                                                                                                            } else if (allow_email_notif === 'false'){
                                                                                                                                                res.statusCode = 200;
                                                                                                                                                res.json({ status: true, msg: 'work_submitted_successfully', classwork_type: classwork_type, token_info: 'no_token' });     
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }  
                                                                                                                            }
                                                                                                                        }
                                                                                                                    } else {
                                                                                                                        res.statusCode = 200;
                                                                                                                        res.json({ status: false, msg: 'classwork_expired', classwork_type: classwork_type, token_info: 'no_token' });
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
                                                                                                    res.json({ status: 'not_part_of_class' });
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

module.exports = submit_work;