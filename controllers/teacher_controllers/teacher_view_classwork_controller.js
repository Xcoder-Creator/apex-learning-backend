const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db_query
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header

const teacher_view_classwork = async (req, res) => {
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
                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                    let resultz = await db_query.check_if_teacher_account(user_id);

                                                                    if (resultz.status === false){
                                                                        res.statusCode = 500;
                                                                        res.json({ status: 'error_occured' });
                                                                    } else if (resultz.status === true){
                                                                        if (resultz.data.length > 0 && resultz.data.length === 1){
                                                                            let teacher_name = resultz.data[0].name;
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
                                                                                                    let students_that_have_joined_class = result2.data;
                                                                                                    
                                                                                                    let result3 = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                    if (result3.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result3.status === true){
                                                                                                        if (result3.data.length > 0 && result3.data.length === 1){
                                                                                                            let all_student_details = [];
                                                                                                            let submitted_count = 0;

                                                                                                            for (let [i, record] of students_that_have_joined_class.entries()){
                                                                                                                let user_id = record.user_id;

                                                                                                                let result = await db_query.check_if_student_account(user_id);

                                                                                                                if (result.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result.status === true){
                                                                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                                                                        let details = {
                                                                                                                            user_id: result.data[0].id,
                                                                                                                            student_name: result.data[0].name,
                                                                                                                            profile_img: result.data[0].profile_image
                                                                                                                        }
                                                                                                                        
                                                                                                                        all_student_details.push(details);
                                                                                                                    }
                                                                                                                }
                                                                                                            }

                                                                                                            for (let [i, record] of all_student_details.entries()){
                                                                                                                let student_id = record.user_id;
                                                                                                                record['id'] = classwork_id;

                                                                                                                let result = await db_query.get_student_response_to_classwork(classwork_id, student_id, class_code);

                                                                                                                if (result.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result.status === true){
                                                                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                                                                        submitted_count += 1;
                                                                                                                        record['has_responded'] = true;
                                                                                                                        let score_value = result.data[0].score;

                                                                                                                        let result1 = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                                        if (result1.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result1.status === true){
                                                                                                                            if (result1.data.length > 0 && result1.data.length === 1){
                                                                                                                                let classwork_type = result1.data[0].classwork_type;
                                                                                                                                let total_overall = 0;

                                                                                                                                if (classwork_type === 'assignment' || classwork_type === 'classwork'){
                                                                                                                                    let q_a = result1.data[0].q_a;
                                                                                                                                    total_overall = result1.data[0].points;
                                                                                                                                }

                                                                                                                                if (classwork_type === 'assignment' || classwork_type === 'classwork'){
                                                                                                                                    let details = {
                                                                                                                                        score_value: score_value,
                                                                                                                                        classwork_type: classwork_type,
                                                                                                                                        total_overall: total_overall
                                                                                                                                    }

                                                                                                                                    record['work_details'] = details;
                                                                                                                                } else if (classwork_type === 'attendance'){
                                                                                                                                    let details = {
                                                                                                                                        score_value: score_value,
                                                                                                                                        classwork_type: classwork_type
                                                                                                                                    }

                                                                                                                                    record['work_details'] = details;
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    } else {
                                                                                                                        record['has_responded'] = false;
                                                                                                                    }
                                                                                                                }
                                                                                                            }

                                                                                                            for (let [i, record] of all_student_details.entries()){
                                                                                                                let student_id = record.user_id;
                                                                                                                record['id'] = classwork_id;

                                                                                                                let result = await db_query.fetch_private_comments_for_classwork(classwork_id, user_id, student_id, class_code);

                                                                                                                if (result.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result.status === true){
                                                                                                                    if (result.data.length > 0){
                                                                                                                        let private_comments = result.data;
                                                                                                                        let comments_array = [];

                                                                                                                        for (let [ix, recordx] of private_comments.entries()){
                                                                                                                            let resultx = await db_query.check_if_account_verified(recordx.creators_user_id);

                                                                                                                            if (resultx.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (resultx.status === true){
                                                                                                                                let data = {
                                                                                                                                    name: resultx.data[0].name,
                                                                                                                                    key: ix,
                                                                                                                                    classwork_id: classwork_id,
                                                                                                                                    user_id: recordx.student_id,
                                                                                                                                    profile_img: resultx.data[0].profile_image,
                                                                                                                                    date: recordx.creation_date,
                                                                                                                                    comment_data: recordx.comment_data
                                                                                                                                }
    
                                                                                                                                comments_array.push(data);
                                                                                                                            }
                                                                                                                        }

                                                                                                                        record['classwork_comments'] = comments_array;
                                                                                                                    } else {
                                                                                                                        record['classwork_comments'] = [];
                                                                                                                    }
                                                                                                                }
                                                                                                            }

                                                                                                            let resultx = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                            if (resultx.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (resultx.status === true){
                                                                                                                if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                                                    let classwork_type = resultx.data[0].classwork_type;
                                                                                                                    let classwork_title = resultx.data[0].title;
                                                                                                                    let date_created = resultx.data[0].date_created;
                                                                                                                    let classwork_points = resultx.data[0].points;
                                                                                                                    let classwork_due_date_time = `${resultx.data[0].due_date}, ${resultx.data[0].due_time.toUpperCase()}`;
                                                                                                                    let total_no_of_students = students_that_have_joined_class.length;
                                                                                                                    let total_no_of_students_that_have_submitted_work = submitted_count;

                                                                                                                    res.statusCode = 200;
                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                    res.json({ status: 'successfull', data_details: all_student_details, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_due_date_time: classwork_due_date_time, total_no_of_students: total_no_of_students, total_no_of_students_that_have_submitted_work: total_no_of_students_that_have_submitted_work, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                }
                                                                                                            }
                                                                                                        } else {
                                                                                                            res.statusCode = 404;
                                                                                                            res.json({ status: 'classwork_not_found' });
                                                                                                        }
                                                                                                    }
                                                                                                } else {
                                                                                                    let resultx = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                    if (resultx.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (resultx.status === true){
                                                                                                        if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                                            let classwork_type = resultx.data[0].classwork_type;
                                                                                                            let classwork_title = resultx.data[0].title;
                                                                                                            let date_created = resultx.data[0].date_created;
                                                                                                            let classwork_points = resultx.data[0].points;
                                                                                                            let classwork_due_date_time = `${resultx.data[0].due_date}, ${resultx.data[0].due_time.toUpperCase()}`;

                                                                                                            res.statusCode = 200;
                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                            res.json({ status: 'no_students_available', classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_due_date_time: classwork_due_date_time, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                        } else {
                                                                                                            res.statusCode = 404;
                                                                                                            res.json({ status: 'classwork_not_found' });
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
                                                                        let resultz = await db_query.check_if_teacher_account(user_id);

                                                                        if (resultz.status === false){
                                                                            res.statusCode = 500;
                                                                            res.json({ status: 'error_occured' });
                                                                        } else if (resultz.status === true){
                                                                            if (resultz.data.length > 0 && resultz.data.length === 1){
                                                                                let teacher_name = resultz.data[0].name;
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
                                                                                                        let students_that_have_joined_class = result2.data;
                                                                                                        
                                                                                                        let result3 = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                        if (result3.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result3.status === true){
                                                                                                            if (result3.data.length > 0 && result3.data.length === 1){
                                                                                                                let all_student_details = [];
                                                                                                                let submitted_count = 0;

                                                                                                                for (let [i, record] of students_that_have_joined_class.entries()){
                                                                                                                    let user_id = record.user_id;

                                                                                                                    let result = await db_query.check_if_student_account(user_id);

                                                                                                                    if (result.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result.status === true){
                                                                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                                                                            let details = {
                                                                                                                                user_id: result.data[0].id,
                                                                                                                                student_name: result.data[0].name,
                                                                                                                                profile_img: result.data[0].profile_image
                                                                                                                            }
                                                                                                                            
                                                                                                                            all_student_details.push(details);
                                                                                                                        }
                                                                                                                    }
                                                                                                                }

                                                                                                                for (let [i, record] of all_student_details.entries()){
                                                                                                                    let student_id = record.user_id;
                                                                                                                    record['id'] = classwork_id;

                                                                                                                    let result = await db_query.get_student_response_to_classwork(classwork_id, student_id, class_code);

                                                                                                                    if (result.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result.status === true){
                                                                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                                                                            submitted_count += 1;
                                                                                                                            record['has_responded'] = true;
                                                                                                                            let score_value = result.data[0].score;

                                                                                                                            let result1 = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                                            if (result1.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (result1.status === true){
                                                                                                                                if (result1.data.length > 0 && result1.data.length === 1){
                                                                                                                                    let classwork_type = result1.data[0].classwork_type;
                                                                                                                                    let total_overall = 0;

                                                                                                                                    if (classwork_type === 'assignment' || classwork_type === 'classwork'){
                                                                                                                                        let q_a = result1.data[0].q_a;
                                                                                                                                        total_overall = result1.data[0].points;
                                                                                                                                    }

                                                                                                                                    if (classwork_type === 'assignment' || classwork_type === 'classwork'){
                                                                                                                                        let details = {
                                                                                                                                            score_value: score_value,
                                                                                                                                            classwork_type: classwork_type,
                                                                                                                                            total_overall: total_overall
                                                                                                                                        }

                                                                                                                                        record['work_details'] = details;
                                                                                                                                    } else if (classwork_type === 'attendance'){
                                                                                                                                        let details = {
                                                                                                                                            score_value: score_value,
                                                                                                                                            classwork_type: classwork_type
                                                                                                                                        }

                                                                                                                                        record['work_details'] = details;
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        } else {
                                                                                                                            record['has_responded'] = false;
                                                                                                                        }
                                                                                                                    }
                                                                                                                }

                                                                                                                for (let [i, record] of all_student_details.entries()){
                                                                                                                    let student_id = record.user_id;
                                                                                                                    record['id'] = classwork_id;

                                                                                                                    let result = await db_query.fetch_private_comments_for_classwork(classwork_id, user_id, student_id, class_code);
    
                                                                                                                    if (result.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result.status === true){
                                                                                                                        if (result.data.length > 0){
                                                                                                                            let private_comments = result.data;
                                                                                                                            let comments_array = [];
                                                                                                                            
                                                                                                                            for (let [ix, recordx] of private_comments.entries()){
                                                                                                                                let resultx = await db_query.check_if_account_verified(recordx.creators_user_id);

                                                                                                                                if (resultx.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (resultx.status === true){
                                                                                                                                    let data = {
                                                                                                                                        name: resultx.data[0].name,
                                                                                                                                        key: ix,
                                                                                                                                        classwork_id: classwork_id,
                                                                                                                                        user_id: recordx.student_id,
                                                                                                                                        profile_img: resultx.data[0].profile_image,
                                                                                                                                        date: recordx.creation_date,
                                                                                                                                        comment_data: recordx.comment_data
                                                                                                                                    }
        
                                                                                                                                    comments_array.push(data);
                                                                                                                                }
                                                                                                                            }
    
                                                                                                                            record['classwork_comments'] = comments_array;
                                                                                                                        } else {
                                                                                                                            record['classwork_comments'] = [];
                                                                                                                        }
                                                                                                                    }
                                                                                                                }

                                                                                                                let resultx = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                                if (resultx.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (resultx.status === true){
                                                                                                                    if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                                                        let classwork_type = resultx.data[0].classwork_type;
                                                                                                                        let classwork_title = resultx.data[0].title;
                                                                                                                        let date_created = resultx.data[0].date_created;
                                                                                                                        let classwork_points = resultx.data[0].points;
                                                                                                                        let classwork_due_date_time = `${resultx.data[0].due_date}, ${resultx.data[0].due_time.toUpperCase()}`;
                                                                                                                        let total_no_of_students = students_that_have_joined_class.length;
                                                                                                                        let total_no_of_students_that_have_submitted_work = submitted_count;

                                                                                                                        res.statusCode = 200;
                                                                                                                        res.json({ status: 'successfull', data_details: all_student_details, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_due_date_time: classwork_due_date_time, total_no_of_students: total_no_of_students, total_no_of_students_that_have_submitted_work: total_no_of_students_that_have_submitted_work, token_info: 'no_token' });
                                                                                                                    }
                                                                                                                }
                                                                                                            } else {
                                                                                                                res.statusCode = 404;
                                                                                                                res.json({ status: 'classwork_not_found' });
                                                                                                            }
                                                                                                        }
                                                                                                    } else {
                                                                                                        let resultx = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                        if (resultx.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (resultx.status === true){
                                                                                                            if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                                                let classwork_type = resultx.data[0].classwork_type;
                                                                                                                let classwork_title = resultx.data[0].title;
                                                                                                                let date_created = resultx.data[0].date_created;
                                                                                                                let classwork_points = resultx.data[0].points;
                                                                                                                let classwork_due_date_time = `${resultx.data[0].due_date}, ${resultx.data[0].due_time.toUpperCase()}`;

                                                                                                                res.statusCode = 200;
                                                                                                                res.json({ status: 'no_students_available', classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_due_date_time: classwork_due_date_time, token_info: 'no_token' });
                                                                                                            } else {
                                                                                                                res.statusCode = 404;
                                                                                                                res.json({ status: 'classwork_not_found' });
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
                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                        let resultz = await db_query.check_if_teacher_account(user_id);
    
                                                                        if (resultz.status === false){
                                                                            res.statusCode = 500;
                                                                            res.json({ status: 'error_occured' });
                                                                        } else if (resultz.status === true){
                                                                            if (resultz.data.length > 0 && resultz.data.length === 1){
                                                                                let teacher_name = resultz.data[0].name;
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
                                                                                                        let students_that_have_joined_class = result2.data;
                                                                                                        
                                                                                                        let result3 = await db_query.get_particular_classwork(classwork_id, class_code);
    
                                                                                                        if (result3.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result3.status === true){
                                                                                                            if (result3.data.length > 0 && result3.data.length === 1){
                                                                                                                let all_student_details = [];
                                                                                                                let submitted_count = 0;

                                                                                                                for (let [i, record] of students_that_have_joined_class.entries()){
                                                                                                                    let user_id = record.user_id;

                                                                                                                    let result = await db_query.check_if_student_account(user_id);

                                                                                                                    if (result.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result.status === true){
                                                                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                                                                            let details = {
                                                                                                                                user_id: result.data[0].id,
                                                                                                                                student_name: result.data[0].name,
                                                                                                                                profile_img: result.data[0].profile_image
                                                                                                                            }
                                                                                                                            
                                                                                                                            all_student_details.push(details);
                                                                                                                        }
                                                                                                                    }
                                                                                                                }

                                                                                                                for (let [i, record] of all_student_details.entries()){
                                                                                                                    let student_id = record.user_id;
                                                                                                                    record['id'] = classwork_id;

                                                                                                                    let result = await db_query.get_student_response_to_classwork(classwork_id, student_id, class_code);

                                                                                                                    if (result.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result.status === true){
                                                                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                                                                            submitted_count += 1;
                                                                                                                            record['has_responded'] = true;
                                                                                                                            let score_value = result.data[0].score;

                                                                                                                            let result1 = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                                            if (result1.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (result1.status === true){
                                                                                                                                if (result1.data.length > 0 && result1.data.length === 1){
                                                                                                                                    let classwork_type = result1.data[0].classwork_type;
                                                                                                                                    let total_overall = 0;

                                                                                                                                    if (classwork_type === 'assignment' || classwork_type === 'classwork'){
                                                                                                                                        let q_a = result1.data[0].q_a;
                                                                                                                                        total_overall = result1.data[0].points;
                                                                                                                                    }

                                                                                                                                    if (classwork_type === 'assignment' || classwork_type === 'classwork'){
                                                                                                                                        let details = {
                                                                                                                                            score_value: score_value,
                                                                                                                                            classwork_type: classwork_type,
                                                                                                                                            total_overall: total_overall
                                                                                                                                        }

                                                                                                                                        record['work_details'] = details;
                                                                                                                                    } else if (classwork_type === 'attendance'){
                                                                                                                                        let details = {
                                                                                                                                            score_value: score_value,
                                                                                                                                            classwork_type: classwork_type
                                                                                                                                        }

                                                                                                                                        record['work_details'] = details;
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        } else {
                                                                                                                            record['has_responded'] = false;
                                                                                                                        }
                                                                                                                    }
                                                                                                                }

                                                                                                                for (let [i, record] of all_student_details.entries()){
                                                                                                                    let student_id = record.user_id;
                                                                                                                    record['id'] = classwork_id;

                                                                                                                    let result = await db_query.fetch_private_comments_for_classwork(classwork_id, user_id, student_id, class_code);
    
                                                                                                                    if (result.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result.status === true){
                                                                                                                        if (result.data.length > 0){
                                                                                                                            let private_comments = result.data;
                                                                                                                            let comments_array = [];
                                                                                                                            
                                                                                                                            for (let [ix, recordx] of private_comments.entries()){
                                                                                                                                let resultx = await db_query.check_if_account_verified(recordx.creators_user_id);

                                                                                                                                if (resultx.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (resultx.status === true){
                                                                                                                                    let data = {
                                                                                                                                        name: resultx.data[0].name,
                                                                                                                                        key: ix,
                                                                                                                                        classwork_id: classwork_id,
                                                                                                                                        user_id: recordx.student_id,
                                                                                                                                        profile_img: resultx.data[0].profile_image,
                                                                                                                                        date: recordx.creation_date,
                                                                                                                                        comment_data: recordx.comment_data
                                                                                                                                    }
        
                                                                                                                                    comments_array.push(data);
                                                                                                                                }
                                                                                                                            }
    
                                                                                                                            record['classwork_comments'] = comments_array;
                                                                                                                        } else {
                                                                                                                            record['classwork_comments'] = [];
                                                                                                                        }
                                                                                                                    }
                                                                                                                }

                                                                                                                let resultx = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                                if (resultx.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (resultx.status === true){
                                                                                                                    if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                                                        let classwork_type = resultx.data[0].classwork_type;
                                                                                                                        let classwork_title = resultx.data[0].title;
                                                                                                                        let date_created = resultx.data[0].date_created;
                                                                                                                        let classwork_points = resultx.data[0].points;
                                                                                                                        let classwork_due_date_time = `${resultx.data[0].due_date}, ${resultx.data[0].due_time.toUpperCase()}`;
                                                                                                                        let total_no_of_students = students_that_have_joined_class.length;
                                                                                                                        let total_no_of_students_that_have_submitted_work = submitted_count;

                                                                                                                        res.statusCode = 200;
                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                        res.json({ status: 'successfull', data_details: all_student_details, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_due_date_time: classwork_due_date_time, total_no_of_students: total_no_of_students, total_no_of_students_that_have_submitted_work: total_no_of_students_that_have_submitted_work, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                    }
                                                                                                                }
                                                                                                            } else {
                                                                                                                res.statusCode = 404;
                                                                                                                res.json({ status: 'classwork_not_found' });
                                                                                                            }
                                                                                                        }
                                                                                                    } else {
                                                                                                        let resultx = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                        if (resultx.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (resultx.status === true){
                                                                                                            if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                                                let classwork_type = resultx.data[0].classwork_type;
                                                                                                                let classwork_title = resultx.data[0].title;
                                                                                                                let date_created = resultx.data[0].date_created;
                                                                                                                let classwork_points = resultx.data[0].points;
                                                                                                                let classwork_due_date_time = `${resultx.data[0].due_date}, ${resultx.data[0].due_time.toUpperCase()}`;

                                                                                                                res.statusCode = 200;
                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                res.json({ status: 'no_students_available', classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_due_date_time: classwork_due_date_time, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                            } else {
                                                                                                                res.statusCode = 404;
                                                                                                                res.json({ status: 'classwork_not_found' });
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
                                                                            let resultz = await db_query.check_if_teacher_account(user_id);
    
                                                                            if (resultz.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (resultz.status === true){
                                                                                if (resultz.data.length > 0 && resultz.data.length === 1){
                                                                                    let teacher_name = resultz.data[0].name;
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
                                                                                                            let students_that_have_joined_class = result2.data;
                                                                                                            
                                                                                                            let result3 = await db_query.get_particular_classwork(classwork_id, class_code);
    
                                                                                                            if (result3.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result3.status === true){
                                                                                                                if (result3.data.length > 0 && result3.data.length === 1){
                                                                                                                    let all_student_details = [];
                                                                                                                    let submitted_count = 0;

                                                                                                                    for (let [i, record] of students_that_have_joined_class.entries()){
                                                                                                                        let user_id = record.user_id;

                                                                                                                        let result = await db_query.check_if_student_account(user_id);

                                                                                                                        if (result.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result.status === true){
                                                                                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                                                                                let details = {
                                                                                                                                    user_id: result.data[0].id,
                                                                                                                                    student_name: result.data[0].name,
                                                                                                                                    profile_img: result.data[0].profile_image
                                                                                                                                }
                                                                                                                                
                                                                                                                                all_student_details.push(details);
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }

                                                                                                                    for (let [i, record] of all_student_details.entries()){
                                                                                                                        let student_id = record.user_id;
                                                                                                                        record['id'] = classwork_id;

                                                                                                                        let result = await db_query.get_student_response_to_classwork(classwork_id, student_id, class_code);

                                                                                                                        if (result.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result.status === true){
                                                                                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                                                                                submitted_count += 1;
                                                                                                                                record['has_responded'] = true;
                                                                                                                                let score_value = result.data[0].score;

                                                                                                                                let result1 = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                                                if (result1.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result1.status === true){
                                                                                                                                    if (result1.data.length > 0 && result1.data.length === 1){
                                                                                                                                        let classwork_type = result1.data[0].classwork_type;
                                                                                                                                        let total_overall = 0;

                                                                                                                                        if (classwork_type === 'assignment' || classwork_type === 'classwork'){
                                                                                                                                            let q_a = result1.data[0].q_a;
                                                                                                                                            total_overall = result1.data[0].points;
                                                                                                                                        }

                                                                                                                                        if (classwork_type === 'assignment' || classwork_type === 'classwork'){
                                                                                                                                            let details = {
                                                                                                                                                score_value: score_value,
                                                                                                                                                classwork_type: classwork_type,
                                                                                                                                                total_overall: total_overall
                                                                                                                                            }

                                                                                                                                            record['work_details'] = details;
                                                                                                                                        } else if (classwork_type === 'attendance'){
                                                                                                                                            let details = {
                                                                                                                                                score_value: score_value,
                                                                                                                                                classwork_type: classwork_type
                                                                                                                                            }

                                                                                                                                            record['work_details'] = details;
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            } else {
                                                                                                                                record['has_responded'] = false;
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }

                                                                                                                    for (let [i, record] of all_student_details.entries()){
                                                                                                                        let student_id = record.user_id;
                                                                                                                        record['id'] = classwork_id;

                                                                                                                        let result = await db_query.fetch_private_comments_for_classwork(classwork_id, user_id, student_id, class_code);
        
                                                                                                                        if (result.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result.status === true){
                                                                                                                            if (result.data.length > 0){
                                                                                                                                let private_comments = result.data;
                                                                                                                                let comments_array = [];
                                                                                                                                
                                                                                                                                for (let [ix, recordx] of private_comments.entries()){
                                                                                                                                    let resultx = await db_query.check_if_account_verified(recordx.creators_user_id);

                                                                                                                                    if (resultx.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (resultx.status === true){
                                                                                                                                        let data = {
                                                                                                                                            name: resultx.data[0].name,
                                                                                                                                            key: ix,
                                                                                                                                            classwork_id: classwork_id,
                                                                                                                                            user_id: recordx.student_id,
                                                                                                                                            profile_img: resultx.data[0].profile_image,
                                                                                                                                            date: recordx.creation_date,
                                                                                                                                            comment_data: recordx.comment_data
                                                                                                                                        }
            
                                                                                                                                        comments_array.push(data);
                                                                                                                                    }
                                                                                                                                }
        
                                                                                                                                record['classwork_comments'] = comments_array;
                                                                                                                            } else {
                                                                                                                                record['classwork_comments'] = [];
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }

                                                                                                                    let resultx = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                                    if (resultx.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (resultx.status === true){
                                                                                                                        if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                                                            let classwork_type = resultx.data[0].classwork_type;
                                                                                                                            let classwork_title = resultx.data[0].title;
                                                                                                                            let date_created = resultx.data[0].date_created;
                                                                                                                            let classwork_points = resultx.data[0].points;
                                                                                                                            let classwork_due_date_time = `${resultx.data[0].due_date}, ${resultx.data[0].due_time.toUpperCase()}`;
                                                                                                                            let total_no_of_students = students_that_have_joined_class.length;
                                                                                                                            let total_no_of_students_that_have_submitted_work = submitted_count;

                                                                                                                            res.statusCode = 200;
                                                                                                                            res.json({ status: 'successfull', data_details: all_student_details, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_due_date_time: classwork_due_date_time, total_no_of_students: total_no_of_students, total_no_of_students_that_have_submitted_work: total_no_of_students_that_have_submitted_work, token_info: 'no_token' });
                                                                                                                        }
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    res.statusCode = 404;
                                                                                                                    res.json({ status: 'classwork_not_found' });
                                                                                                                }
                                                                                                            }
                                                                                                        } else {
                                                                                                            let resultx = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                            if (resultx.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (resultx.status === true){
                                                                                                                if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                                                    let classwork_type = resultx.data[0].classwork_type;
                                                                                                                    let classwork_title = resultx.data[0].title;
                                                                                                                    let date_created = resultx.data[0].date_created;
                                                                                                                    let classwork_points = resultx.data[0].points;
                                                                                                                    let classwork_due_date_time = `${resultx.data[0].due_date}, ${resultx.data[0].due_time.toUpperCase()}`;

                                                                                                                    res.statusCode = 200;
                                                                                                                    res.json({ status: 'no_students_available', classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_due_date_time: classwork_due_date_time, token_info: 'no_token' });
                                                                                                                } else {
                                                                                                                    res.statusCode = 404;
                                                                                                                    res.json({ status: 'classwork_not_found' });
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

module.exports = teacher_view_classwork;