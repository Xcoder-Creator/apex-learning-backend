const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db_query
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header

const student_view_classwork = async (req, res) => {
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
                                                                                                    let classwork_type = classwork_data.classwork_type;
                                                                                                    let classwork_title = classwork_data.title;
                                                                                                    let date_created = classwork_data.date_created;
                                                                                                    let classwork_points = classwork_data.points;
                                                                                                    let classwork_instruction = classwork_data.instruction;
                                                                                                    let classwork_due_date_time = `${classwork_data.due_date}, ${classwork_data.due_time.toUpperCase()}`;

                                                                                                    let resultx = await db_query.get_teacher_of_class(classwork_data.user_id);

                                                                                                    if (resultx.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (resultx.status === true){
                                                                                                        if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                                            let teacher_details = resultx.data[0];
                                                                                                            let teacher_id = teacher_details.id;
                                                                                                            let teacher_name = teacher_details.name;
                                                                                                            let private_comments = [];

                                                                                                            let resultz = await db_query.fetch_private_comments_for_classwork(classwork_id, teacher_id, user_id, class_code);

                                                                                                            if (resultz.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (resultz.status === true){
                                                                                                                if (resultz.data.length > 0){
                                                                                                                    let raw_private_comm = resultz.data;

                                                                                                                    for (let [i, record] of raw_private_comm.entries()){
                                                                                                                        let resultv = await db_query.check_if_account_verified(record.creators_user_id);

                                                                                                                        if (resultv.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (resultv.status === true){
                                                                                                                            let data = {
                                                                                                                                name: resultv.data[0].name,
                                                                                                                                key: i,
                                                                                                                                classwork_id: classwork_id,
                                                                                                                                user_id: record.student_id,
                                                                                                                                profile_img: resultv.data[0].profile_image,
                                                                                                                                date: record.creation_date,
                                                                                                                                comment_data: record.comment_data
                                                                                                                            }

                                                                                                                            private_comments.push(data);
                                                                                                                        }
                                                                                                                    }

                                                                                                                    let resultg = await db_query.get_student_response_to_classwork(classwork_id, user_id, class_code);

                                                                                                                    if (resultg.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (resultg.status === true){
                                                                                                                        if (resultg.data.length > 0 && resultg.data.length === 1){
                                                                                                                            let score_value = resultg.data[0].score;

                                                                                                                            let resultd = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                                            if (resultd.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (resultd.status === true){
                                                                                                                                if (resultd.data.length > 0 && resultd.data.length === 1){
                                                                                                                                    let classwork_type_value = resultd.data[0].classwork_type;
                                                                                                                                    let total_overall = 0;

                                                                                                                                    if (classwork_type_value === 'assignment' || classwork_type_value === 'classwork'){
                                                                                                                                        let q_a = resultd.data[0].q_a;
                                                                                                                                        total_overall = resultd.data[0].points;
                                                                                                                                    }

                                                                                                                                    if (classwork_type_value === 'assignment' || classwork_type_value === 'classwork'){
                                                                                                                                        let data = {
                                                                                                                                            classwork_response: true,
                                                                                                                                            score_value: score_value,
                                                                                                                                            total_overall: total_overall,
                                                                                                                                            classwork_type: classwork_type_value
                                                                                                                                        }

                                                                                                                                        res.statusCode = 200;
                                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                        res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                    } else if (classwork_type === 'attendance'){
                                                                                                                                        let data = {
                                                                                                                                            classwork_response: true,
                                                                                                                                            score_value: score_value,
                                                                                                                                            total_overall: score_value,
                                                                                                                                            classwork_type: classwork_type_value
                                                                                                                                        }
            
                                                                                                                                        res.statusCode = 200;
                                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                        res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        } else {
                                                                                                                            let data = {
                                                                                                                                classwork_response: false
                                                                                                                            }

                                                                                                                            res.statusCode = 200;
                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                            res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                        }
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    private_comments = [];

                                                                                                                    let resultg = await db_query.get_student_response_to_classwork(classwork_id, user_id, class_code);

                                                                                                                    if (resultg.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (resultg.status === true){
                                                                                                                        if (resultg.data.length > 0 && resultg.data.length === 1){
                                                                                                                            let score_value = resultg.data[0].score;

                                                                                                                            let resultd = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                                            if (resultd.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (resultd.status === true){
                                                                                                                                if (resultd.data.length > 0 && resultd.data.length === 1){
                                                                                                                                    let classwork_type_value = resultd.data[0].classwork_type;
                                                                                                                                    let total_overall = 0;

                                                                                                                                    if (classwork_type_value === 'assignment' || classwork_type_value === 'classwork'){
                                                                                                                                        let q_a = resultd.data[0].q_a;
                                                                                                                                        total_overall = resultd.data[0].points;
                                                                                                                                    }

                                                                                                                                    if (classwork_type_value === 'assignment' || classwork_type_value === 'classwork'){
                                                                                                                                        let data = {
                                                                                                                                            classwork_response: true,
                                                                                                                                            score_value: score_value,
                                                                                                                                            total_overall: total_overall,
                                                                                                                                            classwork_type: classwork_type_value
                                                                                                                                        }
            
                                                                                                                                        res.statusCode = 200;
                                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                        res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                    } else if (classwork_type === 'attendance'){
                                                                                                                                        let data = {
                                                                                                                                            classwork_response: true,
                                                                                                                                            score_value: score_value,
                                                                                                                                            total_overall: score_value,
                                                                                                                                            classwork_type: classwork_type_value
                                                                                                                                        }
            
                                                                                                                                        res.statusCode = 200;
                                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                        res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        } else {
                                                                                                                            let data = {
                                                                                                                                classwork_response: false
                                                                                                                            }

                                                                                                                            res.statusCode = 200;
                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                            res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'token_available', new_accessToken: new_access_token });
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
                                                                                                        let classwork_type = classwork_data.classwork_type;
                                                                                                        let classwork_title = classwork_data.title;
                                                                                                        let date_created = classwork_data.date_created;
                                                                                                        let classwork_points = classwork_data.points;
                                                                                                        let classwork_instruction = classwork_data.instruction;
                                                                                                        let classwork_due_date_time = `${classwork_data.due_date}, ${classwork_data.due_time.toUpperCase()}`;

                                                                                                        let resultx = await db_query.get_teacher_of_class(classwork_data.user_id);

                                                                                                        if (resultx.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (resultx.status === true){
                                                                                                            if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                                                let teacher_details = resultx.data[0];
                                                                                                                let teacher_id = teacher_details.id;
                                                                                                                let teacher_name = teacher_details.name;
                                                                                                                let private_comments = [];

                                                                                                                let resultz = await db_query.fetch_private_comments_for_classwork(classwork_id, teacher_id, user_id, class_code);

                                                                                                                if (resultz.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (resultz.status === true){
                                                                                                                    if (resultz.data.length > 0){
                                                                                                                        let raw_private_comm = resultz.data;

                                                                                                                        for (let [i, record] of raw_private_comm.entries()){
                                                                                                                            let resultv = await db_query.check_if_account_verified(record.creators_user_id);

                                                                                                                            if (resultv.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (resultv.status === true){
                                                                                                                                let data = {
                                                                                                                                    name: resultv.data[0].name,
                                                                                                                                    key: i,
                                                                                                                                    classwork_id: classwork_id,
                                                                                                                                    user_id: record.student_id,
                                                                                                                                    profile_img: resultv.data[0].profile_image,
                                                                                                                                    date: record.creation_date,
                                                                                                                                    comment_data: record.comment_data
                                                                                                                                }

                                                                                                                                private_comments.push(data);
                                                                                                                            }
                                                                                                                        }

                                                                                                                        let resultg = await db_query.get_student_response_to_classwork(classwork_id, user_id, class_code);

                                                                                                                        if (resultg.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (resultg.status === true){
                                                                                                                            if (resultg.data.length > 0 && resultg.data.length === 1){
                                                                                                                                let score_value = resultg.data[0].score;

                                                                                                                                let resultd = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                                                if (resultd.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (resultd.status === true){
                                                                                                                                    if (resultd.data.length > 0 && resultd.data.length === 1){
                                                                                                                                        let classwork_type_value = resultd.data[0].classwork_type;
                                                                                                                                        let total_overall = 0;

                                                                                                                                        if (classwork_type_value === 'assignment' || classwork_type_value === 'classwork'){
                                                                                                                                            let q_a = resultd.data[0].q_a;
                                                                                                                                            total_overall = resultd.data[0].points;
                                                                                                                                        }

                                                                                                                                        if (classwork_type_value === 'assignment' || classwork_type_value === 'classwork'){
                                                                                                                                            let data = {
                                                                                                                                                classwork_response: true,
                                                                                                                                                score_value: score_value,
                                                                                                                                                total_overall: total_overall,
                                                                                                                                                classwork_type: classwork_type_value
                                                                                                                                            }
                
                                                                                                                                            res.statusCode = 200;
                                                                                                                                            res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'no_token' });
                                                                                                                                        } else if (classwork_type === 'attendance'){
                                                                                                                                            let data = {
                                                                                                                                                classwork_response: true,
                                                                                                                                                score_value: score_value,
                                                                                                                                                total_overall: score_value,
                                                                                                                                                classwork_type: classwork_type_value
                                                                                                                                            }
                
                                                                                                                                            res.statusCode = 200;
                                                                                                                                            res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'no_token' });
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            } else {
                                                                                                                                let data = {
                                                                                                                                    classwork_response: false
                                                                                                                                }

                                                                                                                                res.statusCode = 200;
                                                                                                                                res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'no_token' });
                                                                                                                            }
                                                                                                                        }
                                                                                                                    } else {
                                                                                                                        private_comments = [];

                                                                                                                        let resultg = await db_query.get_student_response_to_classwork(classwork_id, user_id, class_code);

                                                                                                                        if (resultg.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (resultg.status === true){
                                                                                                                            if (resultg.data.length > 0 && resultg.data.length === 1){
                                                                                                                                let score_value = resultg.data[0].score;

                                                                                                                                let resultd = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                                                if (resultd.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (resultd.status === true){
                                                                                                                                    if (resultd.data.length > 0 && resultd.data.length === 1){
                                                                                                                                        let classwork_type_value = resultd.data[0].classwork_type;
                                                                                                                                        let total_overall = 0;

                                                                                                                                        if (classwork_type_value === 'assignment' || classwork_type_value === 'classwork'){
                                                                                                                                            let q_a = resultd.data[0].q_a;
                                                                                                                                            total_overall = resultd.data[0].points;
                                                                                                                                        }

                                                                                                                                        if (classwork_type_value === 'assignment' || classwork_type_value === 'classwork'){
                                                                                                                                            let data = {
                                                                                                                                                classwork_response: true,
                                                                                                                                                score_value: score_value,
                                                                                                                                                total_overall: total_overall,
                                                                                                                                                classwork_type: classwork_type_value
                                                                                                                                            }
                
                                                                                                                                            res.statusCode = 200;
                                                                                                                                            res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'no_token' });
                                                                                                                                        } else if (classwork_type === 'attendance'){
                                                                                                                                            let data = {
                                                                                                                                                classwork_response: true,
                                                                                                                                                score_value: score_value,
                                                                                                                                                total_overall: score_value,
                                                                                                                                                classwork_type: classwork_type_value
                                                                                                                                            }
                
                                                                                                                                            res.statusCode = 200;
                                                                                                                                            res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'no_token' });
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            } else {
                                                                                                                                let data = {
                                                                                                                                    classwork_response: false
                                                                                                                                }

                                                                                                                                res.statusCode = 200;
                                                                                                                                res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'no_token' });
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
                                                                                                        let classwork_type = classwork_data.classwork_type;
                                                                                                        let classwork_title = classwork_data.title;
                                                                                                        let date_created = classwork_data.date_created;
                                                                                                        let classwork_points = classwork_data.points;
                                                                                                        let classwork_instruction = classwork_data.instruction;
                                                                                                        let classwork_due_date_time = `${classwork_data.due_date}, ${classwork_data.due_time.toUpperCase()}`;

                                                                                                        let resultx = await db_query.get_teacher_of_class(classwork_data.user_id);

                                                                                                        if (resultx.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (resultx.status === true){
                                                                                                            if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                                                let teacher_details = resultx.data[0];
                                                                                                                let teacher_id = teacher_details.id;
                                                                                                                let teacher_name = teacher_details.name;
                                                                                                                let private_comments = [];

                                                                                                                let resultz = await db_query.fetch_private_comments_for_classwork(classwork_id, teacher_id, user_id, class_code);

                                                                                                                if (resultz.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (resultz.status === true){
                                                                                                                    if (resultz.data.length > 0){
                                                                                                                        let raw_private_comm = resultz.data;

                                                                                                                        for (let [i, record] of raw_private_comm.entries()){
                                                                                                                            let resultv = await db_query.check_if_account_verified(record.creators_user_id);

                                                                                                                            if (resultv.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (resultv.status === true){
                                                                                                                                let data = {
                                                                                                                                    name: resultv.data[0].name,
                                                                                                                                    key: i,
                                                                                                                                    classwork_id: classwork_id,
                                                                                                                                    user_id: record.student_id,
                                                                                                                                    profile_img: resultv.data[0].profile_image,
                                                                                                                                    date: record.creation_date,
                                                                                                                                    comment_data: record.comment_data
                                                                                                                                }

                                                                                                                                private_comments.push(data);
                                                                                                                            }
                                                                                                                        }

                                                                                                                        let resultg = await db_query.get_student_response_to_classwork(classwork_id, user_id, class_code);

                                                                                                                        if (resultg.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (resultg.status === true){
                                                                                                                            if (resultg.data.length > 0 && resultg.data.length === 1){
                                                                                                                                let score_value = resultg.data[0].score;

                                                                                                                                let resultd = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                                                if (resultd.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (resultd.status === true){
                                                                                                                                    if (resultd.data.length > 0 && resultd.data.length === 1){
                                                                                                                                        let classwork_type_value = resultd.data[0].classwork_type;
                                                                                                                                        let total_overall = 0;

                                                                                                                                        if (classwork_type_value === 'assignment' || classwork_type_value === 'classwork'){
                                                                                                                                            let q_a = resultd.data[0].q_a;
                                                                                                                                            total_overall = resultd.data[0].points;
                                                                                                                                        }

                                                                                                                                        if (classwork_type_value === 'assignment' || classwork_type_value === 'classwork'){
                                                                                                                                            let data = {
                                                                                                                                                classwork_response: true,
                                                                                                                                                score_value: score_value,
                                                                                                                                                total_overall: total_overall,
                                                                                                                                                classwork_type: classwork_type_value
                                                                                                                                            }
                
                                                                                                                                            res.statusCode = 200;
                                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                            res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                        } else if (classwork_type === 'attendance'){
                                                                                                                                            let data = {
                                                                                                                                                classwork_response: true,
                                                                                                                                                score_value: score_value,
                                                                                                                                                total_overall: score_value,
                                                                                                                                                classwork_type: classwork_type_value
                                                                                                                                            }
                
                                                                                                                                            res.statusCode = 200;
                                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                            res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            } else {
                                                                                                                                let data = {
                                                                                                                                    classwork_response: false
                                                                                                                                }

                                                                                                                                res.statusCode = 200;
                                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                            }
                                                                                                                        }
                                                                                                                    } else {
                                                                                                                        private_comments = [];

                                                                                                                        let resultg = await db_query.get_student_response_to_classwork(classwork_id, user_id, class_code);

                                                                                                                        if (resultg.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (resultg.status === true){
                                                                                                                            if (resultg.data.length > 0 && resultg.data.length === 1){
                                                                                                                                let score_value = resultg.data[0].score;

                                                                                                                                let resultd = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                                                if (resultd.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (resultd.status === true){
                                                                                                                                    if (resultd.data.length > 0 && resultd.data.length === 1){
                                                                                                                                        let classwork_type_value = resultd.data[0].classwork_type;
                                                                                                                                        let total_overall = 0;

                                                                                                                                        if (classwork_type_value === 'assignment' || classwork_type_value === 'classwork'){
                                                                                                                                            let q_a = resultd.data[0].q_a;
                                                                                                                                            total_overall = resultd.data[0].points;
                                                                                                                                        }

                                                                                                                                        if (classwork_type_value === 'assignment' || classwork_type_value === 'classwork'){
                                                                                                                                            let data = {
                                                                                                                                                classwork_response: true,
                                                                                                                                                score_value: score_value,
                                                                                                                                                total_overall: total_overall,
                                                                                                                                                classwork_type: classwork_type_value
                                                                                                                                            }
                
                                                                                                                                            res.statusCode = 200;
                                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                            res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                        } else if (classwork_type === 'attendance'){
                                                                                                                                            let data = {
                                                                                                                                                classwork_response: true,
                                                                                                                                                score_value: score_value,
                                                                                                                                                total_overall: score_value,
                                                                                                                                                classwork_type: classwork_type_value
                                                                                                                                            }
                
                                                                                                                                            res.statusCode = 200;
                                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                            res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            } else {
                                                                                                                                let data = {
                                                                                                                                    classwork_response: false
                                                                                                                                }

                                                                                                                                res.statusCode = 200;
                                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'token_available', new_accessToken: new_access_token });
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
                                                                                                            let classwork_type = classwork_data.classwork_type;
                                                                                                            let classwork_title = classwork_data.title;
                                                                                                            let date_created = classwork_data.date_created;
                                                                                                            let classwork_points = classwork_data.points;
                                                                                                            let classwork_instruction = classwork_data.instruction;
                                                                                                            let classwork_due_date_time = `${classwork_data.due_date}, ${classwork_data.due_time.toUpperCase()}`;

                                                                                                            let resultx = await db_query.get_teacher_of_class(classwork_data.user_id);

                                                                                                            if (resultx.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (resultx.status === true){
                                                                                                                if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                                                    let teacher_details = resultx.data[0];
                                                                                                                    let teacher_id = teacher_details.id;
                                                                                                                    let teacher_name = teacher_details.name;
                                                                                                                    let private_comments = [];

                                                                                                                    let resultz = await db_query.fetch_private_comments_for_classwork(classwork_id, teacher_id, user_id, class_code);

                                                                                                                    if (resultz.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (resultz.status === true){
                                                                                                                        if (resultz.data.length > 0){
                                                                                                                            let raw_private_comm = resultz.data;

                                                                                                                            for (let [i, record] of raw_private_comm.entries()){
                                                                                                                                let resultv = await db_query.check_if_account_verified(record.creators_user_id);

                                                                                                                                if (resultv.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (resultv.status === true){
                                                                                                                                    let data = {
                                                                                                                                        name: resultv.data[0].name,
                                                                                                                                        key: i,
                                                                                                                                        classwork_id: classwork_id,
                                                                                                                                        user_id: record.student_id,
                                                                                                                                        profile_img: resultv.data[0].profile_image,
                                                                                                                                        date: record.creation_date,
                                                                                                                                        comment_data: record.comment_data
                                                                                                                                    }

                                                                                                                                    private_comments.push(data);
                                                                                                                                }
                                                                                                                            }

                                                                                                                            let resultg = await db_query.get_student_response_to_classwork(classwork_id, user_id, class_code);

                                                                                                                            if (resultg.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (resultg.status === true){
                                                                                                                                if (resultg.data.length > 0 && resultg.data.length === 1){
                                                                                                                                    let score_value = resultg.data[0].score;

                                                                                                                                    let resultd = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                                                    if (resultd.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (resultd.status === true){
                                                                                                                                        if (resultd.data.length > 0 && resultd.data.length === 1){
                                                                                                                                            let classwork_type_value = resultd.data[0].classwork_type;
                                                                                                                                            let total_overall = 0;

                                                                                                                                            if (classwork_type_value === 'assignment' || classwork_type_value === 'classwork'){
                                                                                                                                                let q_a = resultd.data[0].q_a;
                                                                                                                                                total_overall = resultd.data[0].points;
                                                                                                                                            }

                                                                                                                                            if (classwork_type_value === 'assignment' || classwork_type_value === 'classwork'){
                                                                                                                                                let data = {
                                                                                                                                                    classwork_response: true,
                                                                                                                                                    score_value: score_value,
                                                                                                                                                    total_overall: total_overall,
                                                                                                                                                    classwork_type: classwork_type_value
                                                                                                                                                }
                    
                                                                                                                                                res.statusCode = 200;
                                                                                                                                                res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'no_token' });
                                                                                                                                            } else if (classwork_type === 'attendance'){
                                                                                                                                                let data = {
                                                                                                                                                    classwork_response: true,
                                                                                                                                                    score_value: score_value,
                                                                                                                                                    total_overall: score_value,
                                                                                                                                                    classwork_type: classwork_type_value
                                                                                                                                                }
                    
                                                                                                                                                res.statusCode = 200;
                                                                                                                                                res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'no_token' });
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                } else {
                                                                                                                                    let data = {
                                                                                                                                        classwork_response: false
                                                                                                                                    }

                                                                                                                                    res.statusCode = 200;
                                                                                                                                    res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'no_token' });
                                                                                                                                }
                                                                                                                            }
                                                                                                                        } else {
                                                                                                                            private_comments = [];

                                                                                                                            let resultg = await db_query.get_student_response_to_classwork(classwork_id, user_id, class_code);

                                                                                                                            if (resultg.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (resultg.status === true){
                                                                                                                                if (resultg.data.length > 0 && resultg.data.length === 1){
                                                                                                                                    let score_value = resultg.data[0].score;

                                                                                                                                    let resultd = await db_query.get_particular_classwork(classwork_id, class_code);

                                                                                                                                    if (resultd.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (resultd.status === true){
                                                                                                                                        if (resultd.data.length > 0 && resultd.data.length === 1){
                                                                                                                                            let classwork_type_value = resultd.data[0].classwork_type;
                                                                                                                                            let total_overall = 0;

                                                                                                                                            if (classwork_type_value === 'assignment' || classwork_type_value === 'classwork'){
                                                                                                                                                let q_a = resultd.data[0].q_a;
                                                                                                                                                total_overall = resultd.data[0].points;
                                                                                                                                            }

                                                                                                                                            if (classwork_type_value === 'assignment' || classwork_type_value === 'classwork'){
                                                                                                                                                let data = {
                                                                                                                                                    classwork_response: true,
                                                                                                                                                    score_value: score_value,
                                                                                                                                                    total_overall: total_overall,
                                                                                                                                                    classwork_type: classwork_type_value
                                                                                                                                                }
                    
                                                                                                                                                res.statusCode = 200;
                                                                                                                                                res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'no_token' });
                                                                                                                                            } else if (classwork_type === 'attendance'){
                                                                                                                                                let data = {
                                                                                                                                                    classwork_response: true,
                                                                                                                                                    score_value: score_value,
                                                                                                                                                    total_overall: score_value,
                                                                                                                                                    classwork_type: classwork_type_value
                                                                                                                                                }
                    
                                                                                                                                                res.statusCode = 200;
                                                                                                                                                res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'no_token' });
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                } else {
                                                                                                                                    let data = {
                                                                                                                                        classwork_response: false
                                                                                                                                    }

                                                                                                                                    res.statusCode = 200;
                                                                                                                                    res.json({ status: 'successfull', your_response: data, private_comments: private_comments, classwork_type: classwork_type, classwork_title: classwork_title, date_created: date_created, user_name: teacher_name, classwork_points: classwork_points, classwork_instruction: classwork_instruction, classwork_due_date_time: classwork_due_date_time, teacher_id: teacher_id, token_info: 'no_token' });
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

module.exports = student_view_classwork;