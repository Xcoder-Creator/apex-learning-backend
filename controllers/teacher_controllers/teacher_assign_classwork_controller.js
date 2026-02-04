const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db_query
const mail_service = require('../../utility/mail_service.util'); //Import mail service
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header
const months_list = require('../../utility/months_list.util'); //Import months list utility
const format_time = require('../../utility/format_time.util'); //Import format time utility
const format_date = require('../../utility/format_date.util'); //Import format date utility
const moment = require('moment'); //Import moment module

const assign_classwork = async (req, res) => {
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
            if (form_data.access_token && form_data.title && form_data.instruction && form_data.points && form_data.time && form_data.date_object && form_data.questions_array && form_data.classwork_type && form_data.class_code){
                //Filter and sanitize the request parameters
                let access_token = sanitize_data(form_data.access_token);
                let title = sanitize_data(form_data.title);
                let points = parseInt(form_data.points);
                let time = sanitize_data(form_data.time);
                let classwork_type = sanitize_data(form_data.classwork_type);
                let class_code = sanitize_data(form_data.class_code);

                //Check if the request parameters are empty or only contains white spaces
                if (/^ *$/.test(access_token)){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    if (!/^ *$/.test(classwork_type) || classwork_type === null || classwork_type === undefined){
                        if (classwork_type === 'assignment' || classwork_type === 'classwork'){
                            if (/^ *$/.test(title) || title === null || title === undefined){
                                res.statusCode = 401;
                                res.json({ status: 'missing_credentials' });
                            } else {
                                if (typeof(points) == 'number' && [5, 10, 15, 20, 30, 100].includes(points)){
                                    if (/^ *$/.test(time) || time === null || time === undefined){
                                        res.statusCode = 401;
                                        res.json({ status: 'missing_credentials' });
                                    } else {
                                        if (/^ *$/.test(class_code) || class_code === null || class_code === undefined){
                                            res.statusCode = 401;
                                            res.json({ status: 'missing_credentials' });
                                        } else {
                                            let instruction = null;

                                            if (/^ *$/.test(form_data.instruction) || form_data.instruction === null || form_data.instruction === undefined){
                                                instruction = null;
                                            } else {
                                                instruction = form_data.instruction;
                                            }

                                            let date_object = JSON.parse(form_data.date_object);
                                            let questions_array = JSON.parse(form_data.questions_array);

                                            if (date_object.month && date_object.day && date_object.year){
                                                let month = date_object.month;
                                                let day = date_object.day;
                                                let year = date_object.year;

                                                let month_index = months_list.indexOf(month) + 1;

                                                if (month_index === -1){
                                                    res.statusCode = 401;
                                                    res.json({ status: 'missing_credentials' });
                                                } else {
                                                    let day_x = parseInt(day);

                                                    if (typeof(day_x) == 'number'){
                                                        let year_x = parseInt(year);

                                                        if (typeof(year_x) == 'number'){
                                                            let date_format = `${year_x}-${month_index}-${day_x}`;
                                                            let is_date_valid = moment(date_format, 'YYYY-M-D', true).isValid();

                                                            if (is_date_valid === true){
                                                                let clean_time_string = sanitize_data(time).replace(/ /g, "");
                                                                let meridim = clean_time_string.slice(-2); // Extract the meridim (AM or PM) from the time string
                                                                let act_time = clean_time_string.slice(0, -2); // Remove the meridim (AM or PM) from the time string

                                                                if ((/^(1[0-2]|0?[1-9]):([0-5]?[0-9])(●?[AP]M)?$/).test(act_time)){
                                                                    if (meridim === 'PM' || meridim === 'pm' || meridim === 'AM' || meridim === 'am'){
                                                                        let new_time = act_time + ` ${meridim.toLowerCase()}`;

                                                                        if (Array.isArray(questions_array)){
                                                                            if (questions_array.length <= 30){
                                                                                let empty_question = 0;
                                                                                let empty_answer = 0;
                                                                                let empty_option = 0;
        
                                                                                // Loop through the question property for each question object
                                                                                for (let element of questions_array){
                                                                                    let question = element.question;
        
                                                                                    if (/^ *$/.test(question) || question === null || question === undefined){
                                                                                        empty_question += 1;
                                                                                    }
                                                                                };
                                                                                //--------------------------------------
        
                                                                                if (empty_question === 0){
                                                                                    // Loop through the question property for each question object
                                                                                    for (let element of questions_array){
                                                                                        let answer = element.answer;
        
                                                                                        if (/^ *$/.test(answer) || answer === null || answer === undefined){
                                                                                            empty_answer += 1;
                                                                                        }
                                                                                    };
                                                                                    //--------------------------------------
        
                                                                                    if (empty_answer === 0){
                                                                                        let options_length = 0;

                                                                                        // Loop through the question property for each question object
                                                                                        for (let element of questions_array){
                                                                                            if (element.options.length >= 2 && element.options.length <= 4){
                                                                                                element.options.forEach(data => {
                                                                                                    let option = data.opt;
            
                                                                                                    if (/^ *$/.test(option) || option === null || option === undefined){
                                                                                                        empty_option += 1;
                                                                                                    }
                                                                                                });
                                                                                            } else {
                                                                                                options_length += 1;
                                                                                                break;
                                                                                            }
                                                                                        }
                                                                                        //--------------------------------------

                                                                                        if (options_length > 0){
                                                                                            res.statusCode = 401;
                                                                                            res.json({ status: 'missing_credentials' });
                                                                                        } else {
                                                                                            if (empty_option === 0){
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
                                                                                                                                                let result = await db_query.check_if_teacher_of_class(user_id, class_code);
            
                                                                                                                                                if (result.status === false){
                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                } else if (result.status === true){
                                                                                                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                                                                                                        var created_date = format_date(months_list, new Date());
                                                                                                                                                        var created_time = format_time(new Date);
            
                                                                                                                                                        let result1 = await db_query.create_new_classwork(class_code, user_id, title, `${month} ${day}, ${year}`, new_time, classwork_type, JSON.stringify(questions_array), created_date, created_time, (instruction === null || instruction === 'null') ? null : instruction, date_format, points);
            
                                                                                                                                                        if (result1.status === false){
                                                                                                                                                            res.statusCode = 500;
                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                        } else if (result1.status === true){
                                                                                                                                                            var last_row_id = result1.full_rows.insertId;

                                                                                                                                                            let result2 = await db_query.fetch_all_classworks(class_code);
    
                                                                                                                                                            if (result2.status === false){
                                                                                                                                                                res.statusCode = 500
                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                            } else if (result2.status === true){
                                                                                                                                                                let all_classworks = result2.data;
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

                                                                                                                                                                    let result3 = await db_query.fetch_all_students_of_joined_class(class_code);
    
                                                                                                                                                                    if (result3.status === false){
                                                                                                                                                                        res.statusCode = 500
                                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                                    } else if (result3.status === true){
                                                                                                                                                                        let student_IDS = result3.data;

                                                                                                                                                                        let result6 = await db_query.fetch_all_active_class_details(class_code);

                                                                                                                                                                        if (result6.status === false){
                                                                                                                                                                            res.statusCode = 500;
                                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                                        } else if (result6.status === true){
                                                                                                                                                                            var class_name = result6.data[0].class_name;

                                                                                                                                                                            if (student_IDS.length > 0){
                                                                                                                                                                                for (let [i, record] of student_IDS.entries()){
                                                                                                                                                                                    var user_id_x = record.user_id;
    
                                                                                                                                                                                    let result4 = await db_query.get_user_by_id(user_id_x);
        
                                                                                                                                                                                    if (result4.status === false){
                                                                                                                                                                                        res.statusCode = 500
                                                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                                                    } else if (result4.status === true){
                                                                                                                                                                                        let student_details = result4.data;
    
                                                                                                                                                                                        if (student_details.length > 0){
                                                                                                                                                                                            let user_name = student_details[0].name;
                                                                                                                                                                                            let user_email = student_details[0].email;
    
                                                                                                                                                                                            let result5 = await db_query.get_user_settings(user_id_x);
    
                                                                                                                                                                                            if (result5.status === false){
                                                                                                                                                                                                res.statusCode = 500;
                                                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                                                            } else if (result5.status === true){
                                                                                                                                                                                                let allow_email_notif = result5.data[0].allow_email_notif;
                            
                                                                                                                                                                                                if (allow_email_notif === 'true'){
                                                                                                                                                                                                    mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'New Class Activity', `The teacher of your class: "${class_name}", has just posted a new ${classwork_type}`, user_name, `<p style="font-weight: 400;"><b>Your teacher has just assigned a new ${ classwork_type } to your class: "${ class_name }". Click the link below in order to access the details of the ${classwork_type}:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}">${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}</a></p>`, null, null); //Send mail
                                                                                                                                                                                                }    
                                                                                                                                                                                            }
                                                                                                                                                                                        }
                                                                                                                                                                                    }
                                                                                                                                                                                }

                                                                                                                                                                                res.statusCode = 200;
                                                                                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                                                res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                                                            } else {
                                                                                                                                                                                res.statusCode = 200;
                                                                                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                                                res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                                                            }
                                                                                                                                                                        }
                                                                                                                                                                    }
                                                                                                                                                                } else {
                                                                                                                                                                    let result3 = await db_query.fetch_all_students_of_joined_class(class_code);
    
                                                                                                                                                                    if (result3.status === false){
                                                                                                                                                                        res.statusCode = 500
                                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                                    } else if (result3.status === true){
                                                                                                                                                                        let student_IDS = result3.data;

                                                                                                                                                                        let result6 = await db_query.fetch_all_active_class_details(class_code);

                                                                                                                                                                        if (result6.status === false){
                                                                                                                                                                            res.statusCode = 500;
                                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                                        } else if (result6.status === true){
                                                                                                                                                                            var class_name = result6.data[0].class_name;

                                                                                                                                                                            if (student_IDS.length > 0){
                                                                                                                                                                                for (let [i, record] of student_IDS.entries()){
                                                                                                                                                                                    var user_id_x = record.user_id;
    
                                                                                                                                                                                    let result4 = await db_query.get_user_by_id(user_id_x);
        
                                                                                                                                                                                    if (result4.status === false){
                                                                                                                                                                                        res.statusCode = 500
                                                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                                                    } else if (result4.status === true){
                                                                                                                                                                                        let student_details = result4.data;
    
                                                                                                                                                                                        if (student_details.length > 0){
                                                                                                                                                                                            let user_name = student_details[0].name;
                                                                                                                                                                                            let user_email = student_details[0].email;
    
                                                                                                                                                                                            let result5 = await db_query.get_user_settings(user_id_x);
    
                                                                                                                                                                                            if (result5.status === false){
                                                                                                                                                                                                res.statusCode = 500;
                                                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                                                            } else if (result5.status === true){
                                                                                                                                                                                                let allow_email_notif = result5.data[0].allow_email_notif;
                            
                                                                                                                                                                                                if (allow_email_notif === 'true'){
                                                                                                                                                                                                    mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'New Class Activity', `The teacher of your class: "${class_name}", has just posted a new ${classwork_type}`, user_name, `<p style="font-weight: 400;"><b>Your teacher has just assigned a new ${ classwork_type } to your class: "${ class_name }". Click the link below in order to access the details of the ${classwork_type}:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}">${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}</a></p>`, null, null); //Send mail
                                                                                                                                                                                                }    
                                                                                                                                                                                            }
                                                                                                                                                                                        }
                                                                                                                                                                                    }
                                                                                                                                                                                }

                                                                                                                                                                                res.statusCode = 200;
                                                                                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                                                res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'token_available', class_code: class_code, new_accessToken: new_access_token });
                                                                                                                                                                            } else {
                                                                                                                                                                                res.statusCode = 200;
                                                                                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                                                res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'token_available', class_code: class_code, new_accessToken: new_access_token });
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
                                                                                                                                                    let result = await db_query.check_if_teacher_of_class(user_id, class_code);
            
                                                                                                                                                    if (result.status === false){
                                                                                                                                                        res.statusCode = 500;
                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                    } else if (result.status === true){
                                                                                                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                                                                                                            var created_date = format_date(months_list, new Date());
                                                                                                                                                            var created_time = format_time(new Date);
                
                                                                                                                                                            let result1 = await db_query.create_new_classwork(class_code, user_id, title, `${month} ${day}, ${year}`, new_time, classwork_type, JSON.stringify(questions_array), created_date, created_time, (instruction === null || instruction === 'null') ? null : instruction, date_format, points);
                
                                                                                                                                                            if (result1.status === false){
                                                                                                                                                                res.statusCode = 500;
                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                            } else if (result1.status === true){
                                                                                                                                                                var last_row_id = result1.full_rows.insertId;
                                                                                                                                                                
                                                                                                                                                                let result2 = await db_query.fetch_all_classworks(class_code);
    
                                                                                                                                                                if (result2.status === false){
                                                                                                                                                                    res.statusCode = 500
                                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                                } else if (result2.status === true){
                                                                                                                                                                    let all_classworks = result2.data;
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

                                                                                                                                                                        let result3 = await db_query.fetch_all_students_of_joined_class(class_code);
    
                                                                                                                                                                        if (result3.status === false){
                                                                                                                                                                            res.statusCode = 500
                                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                                        } else if (result3.status === true){
                                                                                                                                                                            let student_IDS = result3.data;
    
                                                                                                                                                                            let result6 = await db_query.fetch_all_active_class_details(class_code);
    
                                                                                                                                                                            if (result6.status === false){
                                                                                                                                                                                res.statusCode = 500;
                                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                                            } else if (result6.status === true){
                                                                                                                                                                                var class_name = result6.data[0].class_name;
    
                                                                                                                                                                                if (student_IDS.length > 0){
                                                                                                                                                                                    for (let [i, record] of student_IDS.entries()){
                                                                                                                                                                                        var user_id_x = record.user_id;
        
                                                                                                                                                                                        let result4 = await db_query.get_user_by_id(user_id_x);
            
                                                                                                                                                                                        if (result4.status === false){
                                                                                                                                                                                            res.statusCode = 500
                                                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                                                        } else if (result4.status === true){
                                                                                                                                                                                            let student_details = result4.data;
        
                                                                                                                                                                                            if (student_details.length > 0){
                                                                                                                                                                                                let user_name = student_details[0].name;
                                                                                                                                                                                                let user_email = student_details[0].email;
        
                                                                                                                                                                                                let result5 = await db_query.get_user_settings(user_id_x);
        
                                                                                                                                                                                                if (result5.status === false){
                                                                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                                                                } else if (result5.status === true){
                                                                                                                                                                                                    let allow_email_notif = result5.data[0].allow_email_notif;
                                
                                                                                                                                                                                                    if (allow_email_notif === 'true'){
                                                                                                                                                                                                        mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'New Class Activity', `The teacher of your class: "${class_name}", has just posted a new ${classwork_type}`, user_name, `<p style="font-weight: 400;"><b>Your teacher has just assigned a new ${ classwork_type } to your class: "${ class_name }". Click the link below in order to access the details of the ${classwork_type}:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}">${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}</a></p>`, null, null); //Send mail
                                                                                                                                                                                                    }    
                                                                                                                                                                                                }
                                                                                                                                                                                            }
                                                                                                                                                                                        }
                                                                                                                                                                                    }
    
                                                                                                                                                                                    res.statusCode = 200;
                                                                                                                                                                                    res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'no_token' });
                                                                                                                                                                                } else {
                                                                                                                                                                                    res.statusCode = 200;
                                                                                                                                                                                    res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'no_token' });
                                                                                                                                                                                }
                                                                                                                                                                            }
                                                                                                                                                                        }
                                                                                                                                                                    } else {
                                                                                                                                                                        let result3 = await db_query.fetch_all_students_of_joined_class(class_code);
    
                                                                                                                                                                        if (result3.status === false){
                                                                                                                                                                            res.statusCode = 500
                                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                                        } else if (result3.status === true){
                                                                                                                                                                            let student_IDS = result3.data;
    
                                                                                                                                                                            let result6 = await db_query.fetch_all_active_class_details(class_code);
    
                                                                                                                                                                            if (result6.status === false){
                                                                                                                                                                                res.statusCode = 500;
                                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                                            } else if (result6.status === true){
                                                                                                                                                                                var class_name = result6.data[0].class_name;
    
                                                                                                                                                                                if (student_IDS.length > 0){
                                                                                                                                                                                    for (let [i, record] of student_IDS.entries()){
                                                                                                                                                                                        var user_id_x = record.user_id;
        
                                                                                                                                                                                        let result4 = await db_query.get_user_by_id(user_id_x);
            
                                                                                                                                                                                        if (result4.status === false){
                                                                                                                                                                                            res.statusCode = 500
                                                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                                                        } else if (result4.status === true){
                                                                                                                                                                                            let student_details = result4.data;
        
                                                                                                                                                                                            if (student_details.length > 0){
                                                                                                                                                                                                let user_name = student_details[0].name;
                                                                                                                                                                                                let user_email = student_details[0].email;
        
                                                                                                                                                                                                let result5 = await db_query.get_user_settings(user_id_x);
        
                                                                                                                                                                                                if (result5.status === false){
                                                                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                                                                } else if (result5.status === true){
                                                                                                                                                                                                    let allow_email_notif = result5.data[0].allow_email_notif;
                                
                                                                                                                                                                                                    if (allow_email_notif === 'true'){
                                                                                                                                                                                                        mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'New Class Activity', `The teacher of your class: "${class_name}", has just posted a new ${classwork_type}`, user_name, `<p style="font-weight: 400;"><b>Your teacher has just assigned a new ${ classwork_type } to your class: "${ class_name }". Click the link below in order to access the details of the ${classwork_type}:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}">${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}</a></p>`, null, null); //Send mail
                                                                                                                                                                                                    }    
                                                                                                                                                                                                }
                                                                                                                                                                                            }
                                                                                                                                                                                        }
                                                                                                                                                                                    }
    
                                                                                                                                                                                    res.statusCode = 200;
                                                                                                                                                                                    res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'no_token', class_code: class_code });
                                                                                                                                                                                } else {
                                                                                                                                                                                    res.statusCode = 200;
                                                                                                                                                                                    res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'no_token', class_code: class_code });
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
                                                                                            } else if (empty_option > 0){
                                                                                                res.statusCode = 401;
                                                                                                res.json({ status: 'missing_credentials' });
                                                                                            }
                                                                                        }
                                                                                    } else if (empty_answer > 0){
                                                                                        res.statusCode = 401;
                                                                                        res.json({ status: 'missing_credentials' });
                                                                                    }
                                                                                } else if (empty_question > 0){
                                                                                    res.statusCode = 401;
                                                                                    res.json({ status: 'missing_credentials' });
                                                                                }
                                                                            } else {    
                                                                                res.statusCode = 401;
                                                                                res.json({ status: 'missing_credentials' });
                                                                            }
                                                                        } else {
                                                                            res.statusCode = 401;
                                                                            res.json({ status: 'missing_credentials' });
                                                                        }  
                                                                    } else {
                                                                        res.statusCode = 401;
                                                                        res.json({ status: 'missing_credentials' });
                                                                    }
                                                                } else {
                                                                    res.statusCode = 401;
                                                                    res.json({ status: 'missing_credentials' });
                                                                }
                                                            } else {
                                                                res.statusCode = 401;
                                                                res.json({ status: 'missing_credentials' });
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
                                        }
                                    }
                                } else {
                                    res.statusCode = 401;
                                    res.json({ status: 'missing_credentials', err: 234 });
                                }
                            }
                        } else if (classwork_type === 'attendance'){
                            if (/^ *$/.test(title) || title === null || title === undefined){
                                res.statusCode = 401;
                                res.json({ status: 'missing_credentials' });
                            } else {
                                if (typeof(points) == 'number' && [5, 10, 15, 20, 30, 100].includes(points)){
                                    if (/^ *$/.test(time) || time === null || time === undefined){
                                        res.statusCode = 401;
                                        res.json({ status: 'missing_credentials' });
                                    } else {
                                        if (/^ *$/.test(class_code) || class_code === null || class_code === undefined){
                                            res.statusCode = 401;
                                            res.json({ status: 'missing_credentials' });
                                        } else {
                                            let date_object = JSON.parse(form_data.date_object);

                                            if (date_object.month && date_object.day && date_object.year){
                                                let month = date_object.month;
                                                let day = date_object.day;
                                                let year = date_object.year;

                                                let month_index = months_list.indexOf(month) + 1;

                                                if (month_index === -1){
                                                    res.statusCode = 401;
                                                    res.json({ status: 'missing_credentials' });
                                                } else {
                                                    let day_x = parseInt(day);

                                                    if (typeof(day_x) == 'number'){
                                                        let year_x = parseInt(year);

                                                        if (typeof(year_x) == 'number'){
                                                            let date_format = `${year_x}-${month_index}-${day_x}`;
                                                            let is_date_valid = moment(date_format, 'YYYY-M-D', true).isValid();

                                                            if (is_date_valid === true){
                                                                let clean_time_string = sanitize_data(time).replace(/ /g, "");
                                                                let meridim = clean_time_string.slice(-2); // Extract the meridim (AM or PM) from the time string
                                                                let act_time = clean_time_string.slice(0, -2); // Remove the meridim (AM or PM) from the time string

                                                                if ((/^(1[0-2]|0?[1-9]):([0-5]?[0-9])(●?[AP]M)?$/).test(act_time)){
                                                                    if (meridim === 'PM' || meridim === 'pm' || meridim === 'AM' || meridim === 'am'){
                                                                        let new_time = act_time + ` ${meridim.toLowerCase()}`;

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
                                                                                                                        let result = await db_query.check_if_teacher_of_class(user_id, class_code);

                                                                                                                        if (result.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result.status === true){
                                                                                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                                                                                var created_date = format_date(months_list, new Date());
                                                                                                                                var created_time = format_time(new Date);

                                                                                                                                let result1 = await db_query.create_new_classwork(class_code, user_id, title, `${month} ${day}, ${year}`, new_time, classwork_type, null, created_date, created_time, null, date_format, points);

                                                                                                                                if (result1.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result1.status === true){
                                                                                                                                    var last_row_id = result1.full_rows.insertId;

                                                                                                                                    let result2 = await db_query.fetch_all_classworks(class_code);

                                                                                                                                    if (result2.status === false){
                                                                                                                                        res.statusCode = 500
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result2.status === true){
                                                                                                                                        let all_classworks = result2.data;
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

                                                                                                                                            let result3 = await db_query.fetch_all_students_of_joined_class(class_code);
    
                                                                                                                                            if (result3.status === false){
                                                                                                                                                res.statusCode = 500
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (result3.status === true){
                                                                                                                                                let student_IDS = result3.data;

                                                                                                                                                let result6 = await db_query.fetch_all_active_class_details(class_code);

                                                                                                                                                if (result6.status === false){
                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                } else if (result6.status === true){
                                                                                                                                                    var class_name = result6.data[0].class_name;

                                                                                                                                                    if (student_IDS.length > 0){
                                                                                                                                                        for (let [i, record] of student_IDS.entries()){
                                                                                                                                                            var user_id_x = record.user_id;

                                                                                                                                                            let result4 = await db_query.get_user_by_id(user_id_x);

                                                                                                                                                            if (result4.status === false){
                                                                                                                                                                res.statusCode = 500
                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                            } else if (result4.status === true){
                                                                                                                                                                let student_details = result4.data;

                                                                                                                                                                if (student_details.length > 0){
                                                                                                                                                                    let user_name = student_details[0].name;
                                                                                                                                                                    let user_email = student_details[0].email;

                                                                                                                                                                    let result5 = await db_query.get_user_settings(user_id_x);

                                                                                                                                                                    if (result5.status === false){
                                                                                                                                                                        res.statusCode = 500;
                                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                                    } else if (result5.status === true){
                                                                                                                                                                        let allow_email_notif = result5.data[0].allow_email_notif;
    
                                                                                                                                                                        if (allow_email_notif === 'true'){
                                                                                                                                                                            mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'New Class Activity', `The teacher of your class: "${class_name}", has just posted a new ${classwork_type}`, user_name, `<p style="font-weight: 400;"><b>Your teacher has just assigned a new ${ classwork_type } to your class: "${ class_name }". Click the link below in order to access the details of the ${classwork_type}:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}">${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}</a></p>`, null, null); //Send mail
                                                                                                                                                                        }    
                                                                                                                                                                    }
                                                                                                                                                                }
                                                                                                                                                            }
                                                                                                                                                        }

                                                                                                                                                        res.statusCode = 200;
                                                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                        res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                                    } else {
                                                                                                                                                        res.statusCode = 200;
                                                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                        res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        } else {
                                                                                                                                            let result3 = await db_query.fetch_all_students_of_joined_class(class_code);
    
                                                                                                                                            if (result3.status === false){
                                                                                                                                                res.statusCode = 500
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (result3.status === true){
                                                                                                                                                let student_IDS = result3.data;

                                                                                                                                                let result6 = await db_query.fetch_all_active_class_details(class_code);

                                                                                                                                                if (result6.status === false){
                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                } else if (result6.status === true){
                                                                                                                                                    var class_name = result6.data[0].class_name;

                                                                                                                                                    if (student_IDS.length > 0){
                                                                                                                                                        for (let [i, record] of student_IDS.entries()){
                                                                                                                                                            var user_id_x = record.user_id;

                                                                                                                                                            let result4 = await db_query.get_user_by_id(user_id_x);

                                                                                                                                                            if (result4.status === false){
                                                                                                                                                                res.statusCode = 500
                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                            } else if (result4.status === true){
                                                                                                                                                                let student_details = result4.data;

                                                                                                                                                                if (student_details.length > 0){
                                                                                                                                                                    let user_name = student_details[0].name;
                                                                                                                                                                    let user_email = student_details[0].email;

                                                                                                                                                                    let result5 = await db_query.get_user_settings(user_id_x);

                                                                                                                                                                    if (result5.status === false){
                                                                                                                                                                        res.statusCode = 500;
                                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                                    } else if (result5.status === true){
                                                                                                                                                                        let allow_email_notif = result5.data[0].allow_email_notif;
    
                                                                                                                                                                        if (allow_email_notif === 'true'){
                                                                                                                                                                            mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'New Class Activity', `The teacher of your class: "${class_name}", has just posted a new ${classwork_type}`, user_name, `<p style="font-weight: 400;"><b>Your teacher has just assigned a new ${ classwork_type } to your class: "${ class_name }". Click the link below in order to access the details of the ${classwork_type}:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}">${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}</a></p>`, null, null); //Send mail
                                                                                                                                                                        }    
                                                                                                                                                                    }
                                                                                                                                                                }
                                                                                                                                                            }
                                                                                                                                                        }

                                                                                                                                                        res.statusCode = 200;
                                                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                        res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'token_available', class_code: class_code, new_accessToken: new_access_token });
                                                                                                                                                    } else {
                                                                                                                                                        res.statusCode = 200;
                                                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                        res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'token_available', class_code: class_code, new_accessToken: new_access_token });
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
                                                                                                                            let result = await db_query.check_if_teacher_of_class(user_id, class_code);

                                                                                                                            if (result.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (result.status === true){
                                                                                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                                                                                    var created_date = format_date(months_list, new Date());
                                                                                                                                    var created_time = format_time(new Date);

                                                                                                                                    let result1 = await db_query.create_new_classwork(class_code, user_id, title, `${month} ${day}, ${year}`, new_time, classwork_type, null, created_date, created_time, null, date_format, points);

                                                                                                                                    if (result1.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result1.status === true){
                                                                                                                                        var last_row_id = result1.full_rows.insertId;

                                                                                                                                        let result2 = await db_query.fetch_all_classworks(class_code);

                                                                                                                                        if (result2.status === false){
                                                                                                                                            res.statusCode = 500
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result2.status === true){
                                                                                                                                            let all_classworks = result2.data;
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

                                                                                                                                                let result3 = await db_query.fetch_all_students_of_joined_class(class_code);
    
                                                                                                                                                if (result3.status === false){
                                                                                                                                                    res.statusCode = 500
                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                } else if (result3.status === true){
                                                                                                                                                    let student_IDS = result3.data;

                                                                                                                                                    let result6 = await db_query.fetch_all_active_class_details(class_code);

                                                                                                                                                    if (result6.status === false){
                                                                                                                                                        res.statusCode = 500;
                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                    } else if (result6.status === true){
                                                                                                                                                        var class_name = result6.data[0].class_name;

                                                                                                                                                        if (student_IDS.length > 0){
                                                                                                                                                            for (let [i, record] of student_IDS.entries()){
                                                                                                                                                                var user_id_x = record.user_id;

                                                                                                                                                                let result4 = await db_query.get_user_by_id(user_id_x);

                                                                                                                                                                if (result4.status === false){
                                                                                                                                                                    res.statusCode = 500
                                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                                } else if (result4.status === true){
                                                                                                                                                                    let student_details = result4.data;

                                                                                                                                                                    if (student_details.length > 0){
                                                                                                                                                                        let user_name = student_details[0].name;
                                                                                                                                                                        let user_email = student_details[0].email;

                                                                                                                                                                        let result5 = await db_query.get_user_settings(user_id_x);

                                                                                                                                                                        if (result5.status === false){
                                                                                                                                                                            res.statusCode = 500;
                                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                                        } else if (result5.status === true){
                                                                                                                                                                            let allow_email_notif = result5.data[0].allow_email_notif;
        
                                                                                                                                                                            if (allow_email_notif === 'true'){
                                                                                                                                                                                mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'New Class Activity', `The teacher of your class: "${class_name}", has just posted a new ${classwork_type}`, user_name, `<p style="font-weight: 400;"><b>Your teacher has just assigned a new ${ classwork_type } to your class: "${ class_name }". Click the link below in order to access the details of the ${classwork_type}:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}">${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}</a></p>`, null, null); //Send mail
                                                                                                                                                                            }    
                                                                                                                                                                        }
                                                                                                                                                                    }
                                                                                                                                                                }
                                                                                                                                                            }

                                                                                                                                                            res.statusCode = 200;
                                                                                                                                                            res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'no_token' });
                                                                                                                                                        } else {
                                                                                                                                                            res.statusCode = 200;
                                                                                                                                                            res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'no_token' });
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            } else {
                                                                                                                                                let result3 = await db_query.fetch_all_students_of_joined_class(class_code);
    
                                                                                                                                                if (result3.status === false){
                                                                                                                                                    res.statusCode = 500
                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                } else if (result3.status === true){
                                                                                                                                                    let student_IDS = result3.data;

                                                                                                                                                    let result6 = await db_query.fetch_all_active_class_details(class_code);

                                                                                                                                                    if (result6.status === false){
                                                                                                                                                        res.statusCode = 500;
                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                    } else if (result6.status === true){
                                                                                                                                                        var class_name = result6.data[0].class_name;

                                                                                                                                                        if (student_IDS.length > 0){
                                                                                                                                                            for (let [i, record] of student_IDS.entries()){
                                                                                                                                                                var user_id_x = record.user_id;

                                                                                                                                                                let result4 = await db_query.get_user_by_id(user_id_x);

                                                                                                                                                                if (result4.status === false){
                                                                                                                                                                    res.statusCode = 500
                                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                                } else if (result4.status === true){
                                                                                                                                                                    let student_details = result4.data;

                                                                                                                                                                    if (student_details.length > 0){
                                                                                                                                                                        let user_name = student_details[0].name;
                                                                                                                                                                        let user_email = student_details[0].email;

                                                                                                                                                                        let result5 = await db_query.get_user_settings(user_id_x);

                                                                                                                                                                        if (result5.status === false){
                                                                                                                                                                            res.statusCode = 500;
                                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                                        } else if (result5.status === true){
                                                                                                                                                                            let allow_email_notif = result5.data[0].allow_email_notif;
        
                                                                                                                                                                            if (allow_email_notif === 'true'){
                                                                                                                                                                                mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'New Class Activity', `The teacher of your class: "${class_name}", has just posted a new ${classwork_type}`, user_name, `<p style="font-weight: 400;"><b>Your teacher has just assigned a new ${ classwork_type } to your class: "${ class_name }". Click the link below in order to access the details of the ${classwork_type}:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}">${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}</a></p>`, null, null); //Send mail
                                                                                                                                                                            }    
                                                                                                                                                                        }
                                                                                                                                                                    }
                                                                                                                                                                }
                                                                                                                                                            }

                                                                                                                                                            res.statusCode = 200;
                                                                                                                                                            res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'no_token', class_code: class_code });
                                                                                                                                                        } else {
                                                                                                                                                            res.statusCode = 200;
                                                                                                                                                            res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'no_token', class_code: class_code });
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
                                                            } else {
                                                                res.statusCode = 401;
                                                                res.json({ status: 'missing_credentials' });
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
                                    }
                                } else {
                                    res.statusCode = 401;
                                    res.json({ status: 'missing_credentials', err: 234 });
                                }
                            }
                        } else {
                            res.statusCode = 401;
                            res.json({ status: 'missing_credentials' });
                        }
                    } else {
                        res.statusCode = 401;
                        res.json({ status: 'missing_credentials', err: 232 });
                    }
                }
                //-----------------------------------------------------
            } else {
                res.statusCode = 401;
                res.json({ status: 'missing_credentials', err: 231 });
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
            if (form_data.title && form_data.instruction && form_data.points && form_data.time && form_data.date_object && form_data.questions_array && form_data.classwork_type && form_data.class_code){
                //Filter and sanitize the request parameters
                let title = sanitize_data(form_data.title);
                let points = parseInt(form_data.points);
                let time = sanitize_data(form_data.time);
                let classwork_type = sanitize_data(form_data.classwork_type);
                let class_code = sanitize_data(form_data.class_code);

                if (!/^ *$/.test(classwork_type) || classwork_type === null || classwork_type === undefined){
                    if (classwork_type === 'assignment' || classwork_type === 'classwork'){
                        if (/^ *$/.test(title) || title === null || title === undefined){
                            res.statusCode = 401;
                            res.json({ status: 'missing_credentials' });
                        } else {
                            if (typeof(points) == 'number' && [5, 10, 15, 20, 30, 100].includes(points)){
                                if (/^ *$/.test(time) || time === null || time === undefined){
                                    res.statusCode = 401;
                                    res.json({ status: 'missing_credentials' });
                                } else {
                                    if (/^ *$/.test(class_code) || class_code === null || class_code === undefined){
                                        res.statusCode = 401;
                                        res.json({ status: 'missing_credentials' });
                                    } else {
                                        let access_token = validate_auth_header(req.headers['authorization']);

                                        if (access_token == null){
                                            res.statusCode = 401;
                                            res.json({ status: 'missing_credentials' });
                                        } else {
                                            const raw_cookies = JSON.parse(JSON.stringify(req.cookies));

                                            if (raw_cookies){
                                                if (raw_cookies.hasOwnProperty('apex_auth')){
                                                    let refresh_token = raw_cookies['apex_auth'];

                                                    let instruction = null;

                                                    if (/^ *$/.test(form_data.instruction) || form_data.instruction === null || form_data.instruction === undefined){
                                                        instruction = null;
                                                    } else {
                                                        instruction = form_data.instruction;
                                                    }

                                                    let date_object = JSON.parse(form_data.date_object);
                                                    let questions_array = JSON.parse(form_data.questions_array);

                                                    if (date_object.month && date_object.day && date_object.year){
                                                        let month = date_object.month;
                                                        let day = date_object.day;
                                                        let year = date_object.year;

                                                        let month_index = months_list.indexOf(month) + 1;

                                                        if (month_index === -1){
                                                            res.statusCode = 401;
                                                            res.json({ status: 'missing_credentials' });
                                                        } else {
                                                            let day_x = parseInt(day);

                                                            if (typeof(day_x) == 'number'){
                                                                let year_x = parseInt(year);

                                                                if (typeof(year_x) == 'number'){
                                                                    let date_format = `${year_x}-${month_index}-${day_x}`;
                                                                    let is_date_valid = moment(date_format, 'YYYY-M-D', true).isValid();

                                                                    if (is_date_valid === true){
                                                                        let clean_time_string = sanitize_data(time).replace(/ /g, "");
                                                                        let meridim = clean_time_string.slice(-2); // Extract the meridim (AM or PM) from the time string
                                                                        let act_time = clean_time_string.slice(0, -2); // Remove the meridim (AM or PM) from the time string

                                                                        if ((/^(1[0-2]|0?[1-9]):([0-5]?[0-9])(●?[AP]M)?$/).test(act_time)){
                                                                            if (meridim === 'PM' || meridim === 'pm' || meridim === 'AM' || meridim === 'am'){
                                                                                let new_time = act_time + ` ${meridim.toLowerCase()}`;

                                                                                if (Array.isArray(questions_array)){
                                                                                    if (questions_array.length <= 30){
                                                                                        let empty_question = 0;
                                                                                        let empty_answer = 0;
                                                                                        let empty_option = 0;
                
                                                                                        // Loop through the question property for each question object
                                                                                        for (let element of questions_array){
                                                                                            let question = element.question;
                
                                                                                            if (/^ *$/.test(question) || question === null || question === undefined){
                                                                                                empty_question += 1;
                                                                                            }
                                                                                        };
                                                                                        //--------------------------------------
                
                                                                                        if (empty_question === 0){
                                                                                            // Loop through the question property for each question object
                                                                                            for (let element of questions_array){
                                                                                                let answer = element.answer;
                
                                                                                                if (/^ *$/.test(answer) || answer === null || answer === undefined){
                                                                                                    empty_answer += 1;
                                                                                                }
                                                                                            };
                                                                                            //--------------------------------------
                
                                                                                            if (empty_answer === 0){
                                                                                                let options_length = 0;

                                                                                                // Loop through the question property for each question object
                                                                                                for (let element of questions_array){
                                                                                                    if (element.options.length >= 2 && element.options.length <= 4){
                                                                                                        element.options.forEach(data => {
                                                                                                            let option = data.opt;
                    
                                                                                                            if (/^ *$/.test(option) || option === null || option === undefined){
                                                                                                                empty_option += 1;
                                                                                                            }
                                                                                                        });
                                                                                                    } else {
                                                                                                        options_length += 1;
                                                                                                        break;
                                                                                                    }
                                                                                                }
                                                                                                //--------------------------------------

                                                                                                if (options_length > 0){
                                                                                                    res.statusCode = 401;
                                                                                                    res.json({ status: 'missing_credentials' });
                                                                                                } else {
                                                                                                    if (empty_option === 0){
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
                                                                                                                                                    let result = await db_query.check_if_teacher_of_class(user_id, class_code);
                
                                                                                                                                                    if (result.status === false){
                                                                                                                                                        res.statusCode = 500;
                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                    } else if (result.status === true){
                                                                                                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                                                                                                            var created_date = format_date(months_list, new Date());
                                                                                                                                                            var created_time = format_time(new Date);
                
                                                                                                                                                            let result1 = await db_query.create_new_classwork(class_code, user_id, title, `${month} ${day}, ${year}`, new_time, classwork_type, JSON.stringify(questions_array), created_date, created_time, (instruction === null || instruction === 'null') ? null : instruction, date_format, points);
                
                                                                                                                                                            if (result1.status === false){
                                                                                                                                                                res.statusCode = 500;
                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                            } else if (result1.status === true){
                                                                                                                                                                var last_row_id = result1.full_rows.insertId;

                                                                                                                                                                let result2 = await db_query.fetch_all_classworks(class_code);
    
                                                                                                                                                                if (result2.status === false){
                                                                                                                                                                    res.statusCode = 500
                                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                                } else if (result2.status === true){
                                                                                                                                                                    let all_classworks = result2.data;
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
    
                                                                                                                                                                        let result3 = await db_query.fetch_all_students_of_joined_class(class_code);
    
                                                                                                                                                                        if (result3.status === false){
                                                                                                                                                                            res.statusCode = 500
                                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                                        } else if (result3.status === true){
                                                                                                                                                                            let student_IDS = result3.data;

                                                                                                                                                                            let result6 = await db_query.fetch_all_active_class_details(class_code);

                                                                                                                                                                            if (result6.status === false){
                                                                                                                                                                                res.statusCode = 500;
                                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                                            } else if (result6.status === true){
                                                                                                                                                                                var class_name = result6.data[0].class_name;

                                                                                                                                                                                if (student_IDS.length > 0){
                                                                                                                                                                                    for (let [i, record] of student_IDS.entries()){
                                                                                                                                                                                        var user_id_x = record.user_id;
        
                                                                                                                                                                                        let result4 = await db_query.get_user_by_id(user_id_x);
            
                                                                                                                                                                                        if (result4.status === false){
                                                                                                                                                                                            res.statusCode = 500
                                                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                                                        } else if (result4.status === true){
                                                                                                                                                                                            let student_details = result4.data;
        
                                                                                                                                                                                            if (student_details.length > 0){
                                                                                                                                                                                                let user_name = student_details[0].name;
                                                                                                                                                                                                let user_email = student_details[0].email;
        
                                                                                                                                                                                                let result5 = await db_query.get_user_settings(user_id_x);
        
                                                                                                                                                                                                if (result5.status === false){
                                                                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                                                                } else if (result5.status === true){
                                                                                                                                                                                                    let allow_email_notif = result5.data[0].allow_email_notif;
                                
                                                                                                                                                                                                    if (allow_email_notif === 'true'){
                                                                                                                                                                                                        mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'New Class Activity', `The teacher of your class: "${class_name}", has just posted a new ${classwork_type}`, user_name, `<p style="font-weight: 400;"><b>Your teacher has just assigned a new ${ classwork_type } to your class: "${ class_name }". Click the link below in order to access the details of the ${classwork_type}:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}">${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}</a></p>`, null, null); //Send mail
                                                                                                                                                                                                    }    
                                                                                                                                                                                                }
                                                                                                                                                                                            }
                                                                                                                                                                                        }
                                                                                                                                                                                    }

                                                                                                                                                                                    res.statusCode = 200;
                                                                                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                                                    res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                                                                } else {
                                                                                                                                                                                    res.statusCode = 200;
                                                                                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                                                    res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                                                                }
                                                                                                                                                                            }
                                                                                                                                                                        }
                                                                                                                                                                    } else {
                                                                                                                                                                        let result3 = await db_query.fetch_all_students_of_joined_class(class_code);
    
                                                                                                                                                                        if (result3.status === false){
                                                                                                                                                                            res.statusCode = 500
                                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                                        } else if (result3.status === true){
                                                                                                                                                                            let student_IDS = result3.data;

                                                                                                                                                                            let result6 = await db_query.fetch_all_active_class_details(class_code);

                                                                                                                                                                            if (result6.status === false){
                                                                                                                                                                                res.statusCode = 500;
                                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                                            } else if (result6.status === true){
                                                                                                                                                                                var class_name = result6.data[0].class_name;

                                                                                                                                                                                if (student_IDS.length > 0){
                                                                                                                                                                                    for (let [i, record] of student_IDS.entries()){
                                                                                                                                                                                        var user_id_x = record.user_id;
        
                                                                                                                                                                                        let result4 = await db_query.get_user_by_id(user_id_x);
            
                                                                                                                                                                                        if (result4.status === false){
                                                                                                                                                                                            res.statusCode = 500
                                                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                                                        } else if (result4.status === true){
                                                                                                                                                                                            let student_details = result4.data;
        
                                                                                                                                                                                            if (student_details.length > 0){
                                                                                                                                                                                                let user_name = student_details[0].name;
                                                                                                                                                                                                let user_email = student_details[0].email;
        
                                                                                                                                                                                                let result5 = await db_query.get_user_settings(user_id_x);
        
                                                                                                                                                                                                if (result5.status === false){
                                                                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                                                                } else if (result5.status === true){
                                                                                                                                                                                                    let allow_email_notif = result5.data[0].allow_email_notif;
                                
                                                                                                                                                                                                    if (allow_email_notif === 'true'){
                                                                                                                                                                                                        mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'New Class Activity', `The teacher of your class: "${class_name}", has just posted a new ${classwork_type}`, user_name, `<p style="font-weight: 400;"><b>Your teacher has just assigned a new ${ classwork_type } to your class: "${ class_name }". Click the link below in order to access the details of the ${classwork_type}:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}">${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}</a></p>`, null, null); //Send mail
                                                                                                                                                                                                    }    
                                                                                                                                                                                                }
                                                                                                                                                                                            }
                                                                                                                                                                                        }
                                                                                                                                                                                    }

                                                                                                                                                                                    res.statusCode = 200;
                                                                                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                                                    res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'token_available', class_code: class_code, new_accessToken: new_access_token });
                                                                                                                                                                                } else {
                                                                                                                                                                                    res.statusCode = 200;
                                                                                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                                                    res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'token_available', class_code: class_code, new_accessToken: new_access_token });
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
                                                                                                                                                        let result = await db_query.check_if_teacher_of_class(user_id, class_code);
                
                                                                                                                                                        if (result.status === false){
                                                                                                                                                            res.statusCode = 500;
                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                        } else if (result.status === true){
                                                                                                                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                                                                                                                var created_date = format_date(months_list, new Date());
                                                                                                                                                                var created_time = format_time(new Date);
                    
                                                                                                                                                                let result1 = await db_query.create_new_classwork(class_code, user_id, title, `${month} ${day}, ${year}`, new_time, classwork_type, JSON.stringify(questions_array), created_date, created_time, (instruction === null || instruction === 'null') ? null : instruction, date_format, points);
                    
                                                                                                                                                                if (result1.status === false){
                                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                                } else if (result1.status === true){
                                                                                                                                                                    var last_row_id = result1.full_rows.insertId;

                                                                                                                                                                    let result2 = await db_query.fetch_all_classworks(class_code);
    
                                                                                                                                                                    if (result2.status === false){
                                                                                                                                                                        res.statusCode = 500
                                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                                    } else if (result2.status === true){
                                                                                                                                                                        let all_classworks = result2.data;
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

                                                                                                                                                                            let result3 = await db_query.fetch_all_students_of_joined_class(class_code);
    
                                                                                                                                                                            if (result3.status === false){
                                                                                                                                                                                res.statusCode = 500
                                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                                            } else if (result3.status === true){
                                                                                                                                                                                let student_IDS = result3.data;

                                                                                                                                                                                let result6 = await db_query.fetch_all_active_class_details(class_code);

                                                                                                                                                                                if (result6.status === false){
                                                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                                                } else if (result6.status === true){
                                                                                                                                                                                    var class_name = result6.data[0].class_name;

                                                                                                                                                                                    if (student_IDS.length > 0){
                                                                                                                                                                                        for (let [i, record] of student_IDS.entries()){
                                                                                                                                                                                            var user_id_x = record.user_id;
            
                                                                                                                                                                                            let result4 = await db_query.get_user_by_id(user_id_x);
                
                                                                                                                                                                                            if (result4.status === false){
                                                                                                                                                                                                res.statusCode = 500
                                                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                                                            } else if (result4.status === true){
                                                                                                                                                                                                let student_details = result4.data;
            
                                                                                                                                                                                                if (student_details.length > 0){
                                                                                                                                                                                                    let user_name = student_details[0].name;
                                                                                                                                                                                                    let user_email = student_details[0].email;
            
                                                                                                                                                                                                    let result5 = await db_query.get_user_settings(user_id_x);
            
                                                                                                                                                                                                    if (result5.status === false){
                                                                                                                                                                                                        res.statusCode = 500;
                                                                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                                                                    } else if (result5.status === true){
                                                                                                                                                                                                        let allow_email_notif = result5.data[0].allow_email_notif;
                                    
                                                                                                                                                                                                        if (allow_email_notif === 'true'){
                                                                                                                                                                                                            mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'New Class Activity', `The teacher of your class: "${class_name}", has just posted a new ${classwork_type}`, user_name, `<p style="font-weight: 400;"><b>Your teacher has just assigned a new ${ classwork_type } to your class: "${ class_name }". Click the link below in order to access the details of the ${classwork_type}:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}">${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}</a></p>`, null, null); //Send mail
                                                                                                                                                                                                        }    
                                                                                                                                                                                                    }
                                                                                                                                                                                                }
                                                                                                                                                                                            }
                                                                                                                                                                                        }

                                                                                                                                                                                        res.statusCode = 200;
                                                                                                                                                                                        res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'no_token' });
                                                                                                                                                                                    } else {
                                                                                                                                                                                        res.statusCode = 200;
                                                                                                                                                                                        res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'no_token' });
                                                                                                                                                                                    }
                                                                                                                                                                                }
                                                                                                                                                                            }
                                                                                                                                                                        } else {
                                                                                                                                                                            let result3 = await db_query.fetch_all_students_of_joined_class(class_code);
    
                                                                                                                                                                            if (result3.status === false){
                                                                                                                                                                                res.statusCode = 500
                                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                                            } else if (result3.status === true){
                                                                                                                                                                                let student_IDS = result3.data;

                                                                                                                                                                                let result6 = await db_query.fetch_all_active_class_details(class_code);

                                                                                                                                                                                if (result6.status === false){
                                                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                                                } else if (result6.status === true){
                                                                                                                                                                                    var class_name = result6.data[0].class_name;

                                                                                                                                                                                    if (student_IDS.length > 0){
                                                                                                                                                                                        for (let [i, record] of student_IDS.entries()){
                                                                                                                                                                                            var user_id_x = record.user_id;
            
                                                                                                                                                                                            let result4 = await db_query.get_user_by_id(user_id_x);
                
                                                                                                                                                                                            if (result4.status === false){
                                                                                                                                                                                                res.statusCode = 500
                                                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                                                            } else if (result4.status === true){
                                                                                                                                                                                                let student_details = result4.data;
            
                                                                                                                                                                                                if (student_details.length > 0){
                                                                                                                                                                                                    let user_name = student_details[0].name;
                                                                                                                                                                                                    let user_email = student_details[0].email;
            
                                                                                                                                                                                                    let result5 = await db_query.get_user_settings(user_id_x);
            
                                                                                                                                                                                                    if (result5.status === false){
                                                                                                                                                                                                        res.statusCode = 500;
                                                                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                                                                    } else if (result5.status === true){
                                                                                                                                                                                                        let allow_email_notif = result5.data[0].allow_email_notif;
                                    
                                                                                                                                                                                                        if (allow_email_notif === 'true'){
                                                                                                                                                                                                            mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'New Class Activity', `The teacher of your class: "${class_name}", has just posted a new ${classwork_type}`, user_name, `<p style="font-weight: 400;"><b>Your teacher has just assigned a new ${ classwork_type } to your class: "${ class_name }". Click the link below in order to access the details of the ${classwork_type}:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}">${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}</a></p>`, null, null); //Send mail
                                                                                                                                                                                                        }    
                                                                                                                                                                                                    }
                                                                                                                                                                                                }
                                                                                                                                                                                            }
                                                                                                                                                                                        }

                                                                                                                                                                                        res.statusCode = 200;
                                                                                                                                                                                        res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'no_token', class_code: class_code });
                                                                                                                                                                                    } else {
                                                                                                                                                                                        res.statusCode = 200;
                                                                                                                                                                                        res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'no_token', class_code: class_code });
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
                                                                                                    } else if (empty_option > 0){
                                                                                                        res.statusCode = 401;
                                                                                                        res.json({ status: 'missing_credentials' });
                                                                                                    }
                                                                                                }
                                                                                            } else if (empty_answer > 0){
                                                                                                res.statusCode = 401;
                                                                                                res.json({ status: 'missing_credentials' });
                                                                                            }
                                                                                        } else if (empty_question > 0){
                                                                                            res.statusCode = 401;
                                                                                            res.json({ status: 'missing_credentials' });
                                                                                        }
                                                                                    } else {    
                                                                                        res.statusCode = 401;
                                                                                        res.json({ status: 'missing_credentials' });
                                                                                    }
                                                                                } else {
                                                                                    res.statusCode = 401;
                                                                                    res.json({ status: 'missing_credentials' });
                                                                                }  
                                                                            } else {
                                                                                res.statusCode = 401;
                                                                                res.json({ status: 'missing_credentials' });
                                                                            }
                                                                        } else {
                                                                            res.statusCode = 401;
                                                                            res.json({ status: 'missing_credentials' });
                                                                        }
                                                                    } else {
                                                                        res.statusCode = 401;
                                                                        res.json({ status: 'missing_credentials' });
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
                                                    res.json({ status: 'missing_credentials' });
                                                }
                                            } else {
                                                res.statusCode = 401;
                                                res.json({ status: 'missing_credentials' });
                                            }
                                        }
                                    }
                                }
                            } else {
                                res.statusCode = 401;
                                res.json({ status: 'missing_credentials' });
                            }
                        }
                    } else if (classwork_type === 'attendance'){
                        if (/^ *$/.test(title) || title === null || title === undefined){
                            res.statusCode = 401;
                            res.json({ status: 'missing_credentials' });
                        } else {
                            if (typeof(points) == 'number' && [5, 10, 15, 20, 30, 100].includes(points)){
                                if (/^ *$/.test(time) || time === null || time === undefined){
                                    res.statusCode = 401;
                                    res.json({ status: 'missing_credentials' });
                                } else {
                                    if (/^ *$/.test(class_code) || class_code === null || class_code === undefined){
                                        res.statusCode = 401;
                                        res.json({ status: 'missing_credentials' });
                                    } else {
                                        let date_object = JSON.parse(form_data.date_object);

                                        if (date_object.month && date_object.day && date_object.year){
                                            let month = date_object.month;
                                            let day = date_object.day;
                                            let year = date_object.year;

                                            let month_index = months_list.indexOf(month) + 1;

                                            if (month_index === -1){
                                                res.statusCode = 401;
                                                res.json({ status: 'missing_credentials' });
                                            } else {
                                                let day_x = parseInt(day);

                                                if (typeof(day_x) == 'number'){
                                                    let year_x = parseInt(year);

                                                    if (typeof(year_x) == 'number'){
                                                        let date_format = `${year_x}-${month_index}-${day_x}`;
                                                        let is_date_valid = moment(date_format, 'YYYY-M-D', true).isValid();

                                                        if (is_date_valid === true){
                                                            let clean_time_string = sanitize_data(time).replace(/ /g, "");
                                                            let meridim = clean_time_string.slice(-2); // Extract the meridim (AM or PM) from the time string
                                                            let act_time = clean_time_string.slice(0, -2); // Remove the meridim (AM or PM) from the time string

                                                            if ((/^(1[0-2]|0?[1-9]):([0-5]?[0-9])(●?[AP]M)?$/).test(act_time)){
                                                                if (meridim === 'PM' || meridim === 'pm' || meridim === 'AM' || meridim === 'am'){
                                                                    let new_time = act_time + ` ${meridim.toLowerCase()}`;

                                                                    let access_token = validate_auth_header(req.headers['authorization']);

                                                                    if (access_token == null){
                                                                        res.statusCode = 401;
                                                                        res.json({ status: 'missing_credentials' });
                                                                    } else {
                                                                        const raw_cookies = JSON.parse(JSON.stringify(req.cookies));

                                                                        if (raw_cookies){
                                                                            if (raw_cookies.hasOwnProperty('apex_auth')){
                                                                                let refresh_token = raw_cookies['apex_auth'];

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
                                                                                                                                let result = await db_query.check_if_teacher_of_class(user_id, class_code);
            
                                                                                                                                if (result.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result.status === true){
                                                                                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                                                                                        var created_date = format_date(months_list, new Date());
                                                                                                                                        var created_time = format_time(new Date);
            
                                                                                                                                        let result1 = await db_query.create_new_classwork(class_code, user_id, title, `${month} ${day}, ${year}`, new_time, classwork_type, null, created_date, created_time, null, date_format, points);
            
                                                                                                                                        if (result1.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result1.status === true){
                                                                                                                                            
                                                                                                                                            var last_row_id = result1.full_rows.insertId;

                                                                                                                                            let result2 = await db_query.fetch_all_classworks(class_code);
            
                                                                                                                                            if (result2.status === false){
                                                                                                                                                res.statusCode = 500
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (result2.status === true){
                                                                                                                                                let all_classworks = result2.data;
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
            
                                                                                                                                                    let result3 = await db_query.fetch_all_students_of_joined_class(class_code);
    
                                                                                                                                                    if (result3.status === false){
                                                                                                                                                        res.statusCode = 500
                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                    } else if (result3.status === true){
                                                                                                                                                        let student_IDS = result3.data;

                                                                                                                                                        let result6 = await db_query.fetch_all_active_class_details(class_code);

                                                                                                                                                        if (result6.status === false){
                                                                                                                                                            res.statusCode = 500;
                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                        } else if (result6.status === true){
                                                                                                                                                            var class_name = result6.data[0].class_name;

                                                                                                                                                            if (student_IDS.length > 0){
                                                                                                                                                                for (let [i, record] of student_IDS.entries()){
                                                                                                                                                                    var user_id_x = record.user_id;

                                                                                                                                                                    let result4 = await db_query.get_user_by_id(user_id_x);

                                                                                                                                                                    if (result4.status === false){
                                                                                                                                                                        res.statusCode = 500
                                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                                    } else if (result4.status === true){
                                                                                                                                                                        let student_details = result4.data;

                                                                                                                                                                        if (student_details.length > 0){
                                                                                                                                                                            let user_name = student_details[0].name;
                                                                                                                                                                            let user_email = student_details[0].email;

                                                                                                                                                                            let result5 = await db_query.get_user_settings(user_id_x);

                                                                                                                                                                            if (result5.status === false){
                                                                                                                                                                                res.statusCode = 500;
                                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                                            } else if (result5.status === true){
                                                                                                                                                                                let allow_email_notif = result5.data[0].allow_email_notif;
            
                                                                                                                                                                                if (allow_email_notif === 'true'){
                                                                                                                                                                                    mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'New Class Activity', `The teacher of your class: "${class_name}", has just posted a new ${classwork_type}`, user_name, `<p style="font-weight: 400;"><b>Your teacher has just assigned a new ${ classwork_type } to your class: "${ class_name }". Click the link below in order to access the details of the ${classwork_type}:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}">${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}</a></p>`, null, null); //Send mail
                                                                                                                                                                                }    
                                                                                                                                                                            }
                                                                                                                                                                        }
                                                                                                                                                                    }
                                                                                                                                                                }

                                                                                                                                                                res.statusCode = 200;
                                                                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                                res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                                            } else {
                                                                                                                                                                res.statusCode = 200;
                                                                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                                res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                } else {
                                                                                                                                                    let result3 = await db_query.fetch_all_students_of_joined_class(class_code);
    
                                                                                                                                                    if (result3.status === false){
                                                                                                                                                        res.statusCode = 500
                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                    } else if (result3.status === true){
                                                                                                                                                        let student_IDS = result3.data;

                                                                                                                                                        let result6 = await db_query.fetch_all_active_class_details(class_code);

                                                                                                                                                        if (result6.status === false){
                                                                                                                                                            res.statusCode = 500;
                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                        } else if (result6.status === true){
                                                                                                                                                            var class_name = result6.data[0].class_name;

                                                                                                                                                            if (student_IDS.length > 0){
                                                                                                                                                                for (let [i, record] of student_IDS.entries()){
                                                                                                                                                                    var user_id_x = record.user_id;

                                                                                                                                                                    let result4 = await db_query.get_user_by_id(user_id_x);

                                                                                                                                                                    if (result4.status === false){
                                                                                                                                                                        res.statusCode = 500
                                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                                    } else if (result4.status === true){
                                                                                                                                                                        let student_details = result4.data;

                                                                                                                                                                        if (student_details.length > 0){
                                                                                                                                                                            let user_name = student_details[0].name;
                                                                                                                                                                            let user_email = student_details[0].email;

                                                                                                                                                                            let result5 = await db_query.get_user_settings(user_id_x);

                                                                                                                                                                            if (result5.status === false){
                                                                                                                                                                                res.statusCode = 500;
                                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                                            } else if (result5.status === true){
                                                                                                                                                                                let allow_email_notif = result5.data[0].allow_email_notif;
            
                                                                                                                                                                                if (allow_email_notif === 'true'){
                                                                                                                                                                                    mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'New Class Activity', `The teacher of your class: "${class_name}", has just posted a new ${classwork_type}`, user_name, `<p style="font-weight: 400;"><b>Your teacher has just assigned a new ${ classwork_type } to your class: "${ class_name }". Click the link below in order to access the details of the ${classwork_type}:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}">${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}</a></p>`, null, null); //Send mail
                                                                                                                                                                                }    
                                                                                                                                                                            }
                                                                                                                                                                        }
                                                                                                                                                                    }
                                                                                                                                                                }

                                                                                                                                                                res.statusCode = 200;
                                                                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                                res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'token_available', class_code: class_code, new_accessToken: new_access_token });
                                                                                                                                                            } else {
                                                                                                                                                                res.statusCode = 200;
                                                                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                                res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'token_available', class_code: class_code, new_accessToken: new_access_token });
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
                                                                                                                                    let result = await db_query.check_if_teacher_of_class(user_id, class_code);
            
                                                                                                                                    if (result.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result.status === true){
                                                                                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                                                                                            var created_date = format_date(months_list, new Date());
                                                                                                                                            var created_time = format_time(new Date);
            
                                                                                                                                            let result1 = await db_query.create_new_classwork(class_code, user_id, title, `${month} ${day}, ${year}`, new_time, classwork_type, null, created_date, created_time, null, date_format, points);
            
                                                                                                                                            if (result1.status === false){
                                                                                                                                                res.statusCode = 500;
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (result1.status === true){
                                                                                                                                                var last_row_id = result1.full_rows.insertId;

                                                                                                                                                let result2 = await db_query.fetch_all_classworks(class_code);
            
                                                                                                                                                if (result2.status === false){
                                                                                                                                                    res.statusCode = 500
                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                } else if (result2.status === true){
                                                                                                                                                    let all_classworks = result2.data;
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

                                                                                                                                                        let result3 = await db_query.fetch_all_students_of_joined_class(class_code);
    
                                                                                                                                                        if (result3.status === false){
                                                                                                                                                            res.statusCode = 500
                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                        } else if (result3.status === true){
                                                                                                                                                            let student_IDS = result3.data;

                                                                                                                                                            let result6 = await db_query.fetch_all_active_class_details(class_code);

                                                                                                                                                            if (result6.status === false){
                                                                                                                                                                res.statusCode = 500;
                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                            } else if (result6.status === true){
                                                                                                                                                                var class_name = result6.data[0].class_name;

                                                                                                                                                                if (student_IDS.length > 0){
                                                                                                                                                                    for (let [i, record] of student_IDS.entries()){
                                                                                                                                                                        var user_id_x = record.user_id;

                                                                                                                                                                        let result4 = await db_query.get_user_by_id(user_id_x);

                                                                                                                                                                        if (result4.status === false){
                                                                                                                                                                            res.statusCode = 500
                                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                                        } else if (result4.status === true){
                                                                                                                                                                            let student_details = result4.data;

                                                                                                                                                                            if (student_details.length > 0){
                                                                                                                                                                                let user_name = student_details[0].name;
                                                                                                                                                                                let user_email = student_details[0].email;

                                                                                                                                                                                let result5 = await db_query.get_user_settings(user_id_x);

                                                                                                                                                                                if (result5.status === false){
                                                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                                                } else if (result5.status === true){
                                                                                                                                                                                    let allow_email_notif = result5.data[0].allow_email_notif;
                
                                                                                                                                                                                    if (allow_email_notif === 'true'){
                                                                                                                                                                                        mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'New Class Activity', `The teacher of your class: "${class_name}", has just posted a new ${classwork_type}`, user_name, `<p style="font-weight: 400;"><b>Your teacher has just assigned a new ${ classwork_type } to your class: "${ class_name }". Click the link below in order to access the details of the ${classwork_type}:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}">${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}</a></p>`, null, null); //Send mail
                                                                                                                                                                                    }    
                                                                                                                                                                                }
                                                                                                                                                                            }
                                                                                                                                                                        }
                                                                                                                                                                    }

                                                                                                                                                                    res.statusCode = 200;
                                                                                                                                                                    res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'no_token' });
                                                                                                                                                                } else {
                                                                                                                                                                    res.statusCode = 200;
                                                                                                                                                                    res.json({ status: 'successfull', result: { value: true, classworks: available_classworks }, class_code: class_code, token_info: 'no_token' });
                                                                                                                                                                }
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    } else {
                                                                                                                                                        let result3 = await db_query.fetch_all_students_of_joined_class(class_code);
    
                                                                                                                                                        if (result3.status === false){
                                                                                                                                                            res.statusCode = 500
                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                        } else if (result3.status === true){
                                                                                                                                                            let student_IDS = result3.data;

                                                                                                                                                            let result6 = await db_query.fetch_all_active_class_details(class_code);

                                                                                                                                                            if (result6.status === false){
                                                                                                                                                                res.statusCode = 500;
                                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                                            } else if (result6.status === true){
                                                                                                                                                                var class_name = result6.data[0].class_name;

                                                                                                                                                                if (student_IDS.length > 0){
                                                                                                                                                                    for (let [i, record] of student_IDS.entries()){
                                                                                                                                                                        var user_id_x = record.user_id;

                                                                                                                                                                        let result4 = await db_query.get_user_by_id(user_id_x);

                                                                                                                                                                        if (result4.status === false){
                                                                                                                                                                            res.statusCode = 500
                                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                                        } else if (result4.status === true){
                                                                                                                                                                            let student_details = result4.data;

                                                                                                                                                                            if (student_details.length > 0){
                                                                                                                                                                                let user_name = student_details[0].name;
                                                                                                                                                                                let user_email = student_details[0].email;

                                                                                                                                                                                let result5 = await db_query.get_user_settings(user_id_x);

                                                                                                                                                                                if (result5.status === false){
                                                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                                                } else if (result5.status === true){
                                                                                                                                                                                    let allow_email_notif = result5.data[0].allow_email_notif;
                
                                                                                                                                                                                    if (allow_email_notif === 'true'){
                                                                                                                                                                                        mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'New Class Activity', `The teacher of your class: "${class_name}", has just posted a new ${classwork_type}`, user_name, `<p style="font-weight: 400;"><b>Your teacher has just assigned a new ${ classwork_type } to your class: "${ class_name }". Click the link below in order to access the details of the ${classwork_type}:</p><p style="margin-top: 15px;"><a style="text-decoration: none; font-size: 0.86rem; color: #1976d2;" href="${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}">${process.env.URL}/student/view_classwork?class_code=${class_code}&id=${last_row_id}</a></p>`, null, null); //Send mail
                                                                                                                                                                                    }    
                                                                                                                                                                                }
                                                                                                                                                                            }
                                                                                                                                                                        }
                                                                                                                                                                    }

                                                                                                                                                                    res.statusCode = 200;
                                                                                                                                                                    res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'no_token', class_code: class_code });
                                                                                                                                                                } else {
                                                                                                                                                                    res.statusCode = 200;
                                                                                                                                                                    res.json({ status: 'successfull', result: { value: false, classworks: [] }, token_info: 'no_token', class_code: class_code });
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
                                                                                                                    res.json({ status: 'invalid_token', st: '1' });
                                                                                                                }
                                                                                                            }
                                                                                                        })
                                                                                                    } else {
                                                                                                        res.statusCode = 401;
                                                                                                        res.json({ status: 'invalid_token', st: '2' });
                                                                                                    }
                                                                                                }
                                                                                            })
                                                                                        } else {
                                                                                            res.statusCode = 401;
                                                                                            res.json({ status: 'invalid_token', st: '2' });
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
                                                                res.json({ status: 'missing_credentials' });
                                                            }
                                                        } else {
                                                            res.statusCode = 401;
                                                            res.json({ status: 'missing_credentials' });
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
                                }
                            } else {
                                res.statusCode = 401;
                                res.json({ status: 'missing_credentials', err: 234 });
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

module.exports = assign_classwork;