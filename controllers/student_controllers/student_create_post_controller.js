const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model');
const mail_service = require('../../utility/mail_service.util'); //Import mail service
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header
const list_months = require('../../utility/months_list.util');
const format_date = require('../../utility/format_date.util');
const file_type_list = require('../../utility/file_type_list.util');
const format_file_size = require('../../utility/format_file_size.util');
const format_time = require('../../utility/format_time.util');
const sanitizeHtml = require('sanitize-html'); //Import sanitize html module

const create_post = async (req, res) => {
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
            if (form_data.post_type_value && form_data.class_code && form_data.access_token && form_data.data_content){

                //Filter and sanitize the access token, class code, post type and data content
                let access_token = sanitize_data(form_data.access_token);
                let class_code = sanitize_data(form_data.class_code);
                let post_type_value = sanitize_data(form_data.post_type_value);
                let data_content = sanitize_data(form_data.data_content);

                //Check if the access token is empty or only contains white spaces
                if (/^ *$/.test(access_token)){
                    res.statusCode = 401; //Status code
                    res.json({ status: 'missing_credentials' }); //Json response
                } else {
                    //Check if the class code is empty or only contains white spaces
                    if (/^ *$/.test(class_code)){
                        res.statusCode = 401; //Status code
                        res.json({ status: 'missing_credentials' }); //Json response
                    } else {
                        //Check if the post type is empty or only contains white spaces
                        if (/^ *$/.test(post_type_value)){
                            res.statusCode = 401; //Status code
                            res.json({ status: 'missing_credentials' }); //Json response
                        } else {
                            //Check if the data content is empty or only contains white spaces
                            if (/^ *$/.test(data_content)){
                                res.statusCode = 401; //Status code
                                res.json({ status: 'missing_credentials' }); //Json response
                            } else {
                                let refresh_token = validate_auth_header(req.headers['authorization']); //Extract the refresh token from the authorization header content

                                //Check if the refresh token is set
                                if (refresh_token == null){
                                    res.statusCode = 401; //Status code
                                    res.json({ status: 'missing_credentials' }); //Json response
                                } else {
                                    let result = await db_query.check_refresh_token(refresh_token); //Query execution to check if a particular refresh token exists

                                    //Check if the query execution above succeded
                                    if (result.status === false){
                                        res.statusCode = 500; //Status code
                                        res.json({ status: 'error_occured' }); //Json response
                                    } else if (result.status === true){
                                        //Check if any data was fetched from the query execution above
                                        if (result.data.length > 0){
                                            //Verify JWT refresh token
                                            jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
                                                if (err){
                                                    let result = await db_query.delete_refresh_token(refresh_token); //Query execution to delete a particular refresh token

                                                    //Check if the query execution above succeded
                                                    if (result.status === false){
                                                        res.statusCode = 500; //Status code
                                                        res.json({ status: 'error_occured' }); //Json response
                                                    } else if (result.status === true){
                                                        res.statusCode = 401; //Status code
                                                        res.json({ status: 'token_expired' }); //Json response
                                                    }
                                                } else {
                                                    let status = user.status; //Token status
                                                    let user_id = user.user_id; //User ID from token

                                                    //Check if the token status is correct
                                                    if (status === 'user_direct_access_refresh_token'){
                                                        //Verify JWT access token
                                                        jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
                                                            if (err) {
                                                                let result = await db_query.check_if_account_verified(user_id); //Query execution to check if a particular account is verified

                                                                //Check if the query execution above succeded
                                                                if (result.status === false){
                                                                    res.statusCode = 500; //Status code
                                                                    res.json({ status: 'error_occured' }); //Json response
                                                                } else if (result.status === true){
                                                                    //Check if any data was fetched from the query execution above
                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                        let post_type = ''; //Post type variable

                                                                        //Check if the files object is set
                                                                        if (req.files){
                                                                            //Check if the user uploaded any files
                                                                            if (req.files.file){
                                                                                var uploaded_files = req.files.file; //All uploaded files

                                                                                //Check how many files where uploaded by the user
                                                                                if (uploaded_files.length === undefined){
                                                                                    post_type = 'post_with_attachment'; //Post type
                                                                                    uploaded_files = [ uploaded_files ]; //Store uploaded files in an array in case if only one file was uploaded as an object
                                                                                } else {
                                                                                    //Check if the files uploaded are between the range of 1 to 3
                                                                                    if (uploaded_files.length >= 1 && uploaded_files.length <= 3){
                                                                                        post_type = 'post_with_attachment'; //Post type
                                                                                    } else {
                                                                                        post_type = false; //Post type
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                post_type = 'error_in_file_query_string'; //Post type
                                                                            }
                                                                        } else {
                                                                            post_type = 'plain_post'; //Post type
                                                                        }

                                                                        //Check the post type
                                                                        if (post_type === 'plain_post'){
                                                                            let result = await db_query.check_if_class_exists(class_code); //Query execution to check if a particular class exists

                                                                            //Check if the query execution succeded
                                                                            if (result.status === false){
                                                                                res.statusCode = 500; //Status code
                                                                                res.json({ status: 'error_occured' }); //Json response
                                                                            } else if (result.status === true){
                                                                                //Check if any data was fetched from the query execution above
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
                                                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                                                    var months = list_months;
                                                                                                    var date = new Date();
                                                                                                    var formated_date = format_date(months, date);
                                                                                                    var formated_time = format_time(new Date);

                                                                                                    const clean_post = sanitizeHtml(data_content, {
                                                                                                        allowedTags: [ 'p', 'a', 'ul', 'li', 'strong', 'i', 's', 'u', 'em' ],
                                                                                                        allowedAttributes: {
                                                                                                            'a': [ 'href', 'rel', 'target' ]
                                                                                                        }
                                                                                                    });

                                                                                                    if (/^ *$/.test(clean_post)){
                                                                                                        res.statusCode = 401; //Status code
                                                                                                        res.json({ status: 'error_occured' }); //Json response
                                                                                                    } else {
                                                                                                        let result = await db_query.create_new_post(user_id, class_code, post_type, formated_date, clean_post, formated_time);

                                                                                                        if (result.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result.status === true){
                                                                                                            let post_id = result.data[0].last_post_id;

                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');

                                                                                                            let result1 = await db_query.fetch_a_particular_post(post_id);

                                                                                                            if (result1.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result1.status === true){
                                                                                                                let result2 = await db_query.fetch_all_students_of_joined_class_except_one(class_code, user_id);

                                                                                                                if (result2.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result2.status === true){
                                                                                                                    var students_of_class = result2.data;

                                                                                                                    if (students_of_class.length > 0){
                                                                                                                        let resultx = await db_query.fetch_class_details(class_code);

                                                                                                                        if (resultx.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (resultx.status === true){
                                                                                                                            var class_name = resultx.data[0].class_name;

                                                                                                                            let resultx1 = await db_query.get_user_by_id(user_id);

                                                                                                                            if (resultx1.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (resultx1.status === true){
                                                                                                                                var student_name_x = resultx1.data[0].name;
                                                                                                                                var student_profile_img = resultx1.data[0].profile_image;

                                                                                                                                for ([i, record] of students_of_class.entries()){
                                                                                                                                    let student_user_id = record.user_id;
            
                                                                                                                                    let result3 = await db_query.get_user_settings(student_user_id);
            
                                                                                                                                    if (result3.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result3.status === true){
                                                                                                                                        let allow_email_notif = result3.data[0].allow_email_notif;
            
                                                                                                                                        let result4 = await db_query.get_user_by_id(student_user_id);
            
                                                                                                                                        if (result4.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result4.status === true){
                                                                                                                                            var student_email = result4.data[0].email;
                                                                                                                                            var student_name = result4.data[0].name;
            
                                                                                                                                            if (allow_email_notif === 'true'){
                                                                                                                                                mail_service('post_mail', student_email, false, false, true, student_name_x, student_name, null, student_profile_img, class_name, formated_date, formated_time, clean_post, post_type, class_code, null, null, null, null, null, null); //Send mail
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }

                                                                                                                                let result5 = await db_query.fetch_class_details(class_code);
            
                                                                                                                                if (result5.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result5.status === true){
                                                                                                                                    var teacher_user_id = result5.data[0].creators_user_id;
                                                                                                                                    
                                                                                                                                    let result6 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                                                    if (result6.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result6.status === true){
                                                                                                                                        var teacher_name = result6.data[0].name;
                                                                                                                                        var teacher_email = result6.data[0].email;
                                                                                                                                        
                                                                                                                                        let result7 = await db_query.get_user_settings(teacher_user_id);

                                                                                                                                        if (result7.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result7.status === true){
                                                                                                                                            let allow_email_notif_x = result7.data[0].allow_email_notif;

                                                                                                                                            if (allow_email_notif_x === 'true'){
                                                                                                                                                mail_service('post_mail', teacher_email, false, true, false, student_name_x, null, teacher_name, student_profile_img, class_name, formated_date, formated_time, clean_post, post_type, class_code, null, null, null, null, null, null); //Send mail

                                                                                                                                                res.statusCode = 200;
                                                                                                                                                let post_creation_date = result1.data[0].post_creation_date;
                                                                                                                                                res.json({ status: 'post_created_successfully', last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                            } else if (allow_email_notif_x === 'false'){
                                                                                                                                                res.statusCode = 200;
                                                                                                                                                let post_creation_date = result1.data[0].post_creation_date;
                                                                                                                                                res.json({ status: 'post_created_successfully', last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    } else {
                                                                                                                        res.statusCode = 200;
                                                                                                                        let post_creation_date = result1.data[0].post_creation_date;
                                                                                                                        res.json({ status: 'post_created_successfully', last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                    }
                                                                                                                } 
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                } else {
                                                                                                    res.statusCode = 401;
                                                                                                    res.json({ status: 'not_a_member_of_class' });
                                                                                                }
                                                                                            }
                                                                                        } else {
                                                                                            res.statusCode = 401;
                                                                                            res.json({ status: 'class_not_active' });      
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    res.statusCode = 401;
                                                                                    res.json({ status: 'class_does_not_exist' });
                                                                                }
                                                                            }
                                                                        } else if (post_type === 'post_with_attachment'){
                                                                            let result = await db_query.check_if_class_exists(class_code);

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
                                                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                                                    if (uploaded_files.length > 3){
                                                                                                        res.statusCode = 401;
                                                                                                        res.json({ status: 'error_in_file_length' });
                                                                                                    } else {
                                                                                                        let file_error = false;

                                                                                                        for (let file_object of uploaded_files){
                                                                                                            if (file_type_list.includes(file_object.mimetype)){
                                                                                                                if (file_object.size < 100000000){
                                                                                                                    //File is good to go
                                                                                                                } else {
                                                                                                                    file_error = true;
                                                                                                                }
                                                                                                            } else {
                                                                                                                file_error = true;
                                                                                                            }
                                                                                                        }

                                                                                                        if (file_error === true){
                                                                                                            res.statusCode = 401;
                                                                                                            res.json({ status: 'file_error' });
                                                                                                        } else if (file_error === false){
                                                                                                            var months = list_months;
                                                                                                            var date = new Date();
                                                                                                            var formated_date = format_date(months, date);
                                                                                                            var formated_time = format_time(new Date);

                                                                                                            const clean_post = sanitizeHtml(data_content, {
                                                                                                                allowedTags: [ 'p', 'a', 'ul', 'li', 'strong', 'i', 's', 'u', 'em' ],
                                                                                                                allowedAttributes: {
                                                                                                                    'a': [ 'href', 'rel', 'target' ]
                                                                                                                }
                                                                                                            });

                                                                                                            if (/^ *$/.test(clean_post)){
                                                                                                                res.statusCode = 401; //Status code
                                                                                                                res.json({ status: 'error_occured' }); //Json response
                                                                                                            } else {
                                                                                                                let result = await db_query.create_new_post(user_id, class_code, post_type, formated_date, clean_post, formated_time);

                                                                                                                if (result.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result.status === true){
                                                                                                                    let post_id = result.data[0].last_post_id;

                                                                                                                    for (let file_object of uploaded_files){
                                                                                                                        let file_name = file_object.name;
                                                                                                                        let file_type = file_object.mimetype;
                                                                                                                        let file_size = format_file_size(file_object.size);

                                                                                                                        let resultx = await db_query.insert_attached_files(user_id, post_id, class_code, file_name, file_type, file_size);

                                                                                                                        if (resultx.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (resultx.status === true){
                                                                                                                            file_object.mv(`./public/class_folders/${ class_code }/public/attachments/${user_id}/${ file_name }`, function (err){
                                                                                                                                if (err){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                    }

                                                                                                                    let resultz = await db_query.fetch_a_particular_post(post_id);

                                                                                                                    if (resultz.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (resultz.status === true){
                                                                                                                        let post_creation_date = resultz.data[0].post_creation_date;

                                                                                                                        let result1 = await db_query.fetch_attached_files_using_post_id(post_id, class_code);

                                                                                                                        if (result1.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result1.status === true){
                                                                                                                            let att_files = result1.data;
                                                                                                                            let file_att_array = [];

                                                                                                                            for (const [i, file_obj] of att_files.entries()) {
                                                                                                                                var id = i;
                                                                                                                                var file_name = file_obj.file_name;
                                                                                                                                var file_type = file_obj.file_mimetype;
                                                                                                                                var file_size_x = file_obj.file_size;
                                                                                                                                let post_id = file_obj.post_id;

                                                                                                                                let result33 = await db_query.fetch_particular_post(post_id);

                                                                                                                                if (result33.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result33.status === true){
                                                                                                                                    let post_data = result33.data;
                                                                                                                                    var post_creation_date_x = post_data[0].post_creation_date;
                                                                                                                                    var post_creation_time_x = post_data[0].post_creation_time;
                                                                                                                                }

                                                                                                                                var file_url = `${ process.env.API_URL }/class_folders/${ class_code }/public/attachments/${user_id}/${ file_name }`;
                                                                                                                                file_att_array.push({ id: id, file_name: file_name, file_type: file_type, file_url: file_url, file_size: file_size_x, post_creation_date: post_creation_date_x, post_creation_time: post_creation_time_x });
                                                                                                                            }

                                                                                                                            let result2 = await db_query.fetch_all_students_of_joined_class_except_one(class_code, user_id);

                                                                                                                            if (result2.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (result2.status === true){
                                                                                                                                var students_of_class = result2.data;

                                                                                                                                if (students_of_class.length > 0){
                                                                                                                                    let resultx = await db_query.fetch_class_details(class_code);

                                                                                                                                    if (resultx.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (resultx.status === true){
                                                                                                                                        var class_name = resultx.data[0].class_name;

                                                                                                                                        let resultx1 = await db_query.get_user_by_id(user_id);

                                                                                                                                        if (resultx1.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (resultx1.status === true){
                                                                                                                                            var student_name_x = resultx1.data[0].name;
                                                                                                                                            var student_profile_img = resultx1.data[0].profile_image;

                                                                                                                                            for ([i, record] of students_of_class.entries()){
                                                                                                                                                let student_user_id = record.user_id;
                        
                                                                                                                                                let result3 = await db_query.get_user_settings(student_user_id);
                        
                                                                                                                                                if (result3.status === false){
                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                } else if (result3.status === true){
                                                                                                                                                    let allow_email_notif = result3.data[0].allow_email_notif;
                        
                                                                                                                                                    let result4 = await db_query.get_user_by_id(student_user_id);
                        
                                                                                                                                                    if (result4.status === false){
                                                                                                                                                        res.statusCode = 500;
                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                    } else if (result4.status === true){
                                                                                                                                                        var student_email = result4.data[0].email;
                                                                                                                                                        var student_name = result4.data[0].name;
                        
                                                                                                                                                        if (allow_email_notif === 'true'){
                                                                                                                                                            mail_service('post_mail', student_email, false, false, true, student_name_x, student_name, null, student_profile_img, class_name, formated_date, formated_time, clean_post, post_type, class_code, null, null, null, null, null, null); //Send mail
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }

                                                                                                                                            let result5 = await db_query.fetch_class_details(class_code);
                        
                                                                                                                                            if (result5.status === false){
                                                                                                                                                res.statusCode = 500;
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (result5.status === true){
                                                                                                                                                var teacher_user_id = result5.data[0].creators_user_id;
                                                                                                                                                
                                                                                                                                                let result6 = await db_query.get_user_by_id(teacher_user_id);
        
                                                                                                                                                if (result6.status === false){
                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                } else if (result6.status === true){
                                                                                                                                                    var teacher_name = result6.data[0].name;
                                                                                                                                                    var teacher_email = result6.data[0].email;
                                                                                                                                                    
                                                                                                                                                    let result7 = await db_query.get_user_settings(teacher_user_id);
        
                                                                                                                                                    if (result7.status === false){
                                                                                                                                                        res.statusCode = 500;
                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                    } else if (result7.status === true){
                                                                                                                                                        let allow_email_notif_x = result7.data[0].allow_email_notif;

                                                                                                                                                        if (allow_email_notif_x === 'true'){
                                                                                                                                                            mail_service('post_mail', teacher_email, false, true, false, student_name_x, null, teacher_name, student_profile_img, class_name, formated_date, formated_time, clean_post, post_type, class_code, null, null, null, null, null, null); //Send mail

                                                                                                                                                            res.statusCode = 200;
                                                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                            res.json({ status: 'post_created_successfully', attached_files: file_att_array, last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                                        } else if (allow_email_notif_x === 'false'){
                                                                                                                                                            res.statusCode = 200;
                                                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                            res.json({ status: 'post_created_successfully', attached_files: file_att_array, last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                } else {
                                                                                                                                    res.statusCode = 200;
                                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                    res.json({ status: 'post_created_successfully', attached_files: file_att_array, last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'token_available', new_accessToken: new_access_token });
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
                                                                                                    res.json({ status: 'not_a_member_of_class' });
                                                                                                }
                                                                                            }
                                                                                        } else {
                                                                                            res.statusCode = 401;
                                                                                            res.json({ status: 'class_not_active' });   
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    res.statusCode = 401;
                                                                                    res.json({ status: 'class_does_not_exist' });
                                                                                }
                                                                            }
                                                                        } else if (post_type === false){
                                                                            res.statusCode = 401;
                                                                            res.json({ status: 'file_length_error' });
                                                                        } else if (post_type === 'error_in_file_query_string'){
                                                                            res.statusCode = 401;
                                                                            res.json({ status: 'missing_credentials' });
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
                                                                        let post_type = '';

                                                                        if (req.files){
                                                                            if (req.files.file){
                                                                                var uploaded_files = req.files.file;

                                                                                if (uploaded_files.length === undefined){
                                                                                    post_type = 'post_with_attachment';
                                                                                    uploaded_files = [ uploaded_files ];
                                                                                } else {
                                                                                    if (uploaded_files.length >= 1 && uploaded_files.length <= 3){
                                                                                        post_type = 'post_with_attachment';
                                                                                    } else {
                                                                                        post_type = false;
                                                                                    }
                                                                                }
                                                                            } else {
                                                                                post_type = 'error_in_file_query_string';
                                                                            }
                                                                        } else {
                                                                            post_type = 'plain_post';
                                                                        }

                                                                        if (post_type === 'plain_post'){
                                                                            let result = await db_query.check_if_class_exists(class_code);

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
                                                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                                                    var months = list_months;
                                                                                                    var date = new Date();
                                                                                                    var formated_date = format_date(months, date);
                                                                                                    var formated_time = format_time(new Date);

                                                                                                    const clean_post = sanitizeHtml(data_content, {
                                                                                                        allowedTags: [ 'p', 'a', 'ul', 'li', 'strong', 'i', 's', 'u', 'em' ],
                                                                                                        allowedAttributes: {
                                                                                                            'a': [ 'href', 'rel', 'target' ]
                                                                                                        }
                                                                                                    });

                                                                                                    if (/^ *$/.test(clean_post)){
                                                                                                        res.statusCode = 401; //Status code
                                                                                                        res.json({ status: 'error_occured' }); //Json response
                                                                                                    } else {
                                                                                                        let result = await db_query.create_new_post(user_id, class_code, post_type, formated_date, clean_post, formated_time);

                                                                                                        if (result.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result.status === true){
                                                                                                            let post_id = result.data[0].last_post_id;

                                                                                                            let result1 = await db_query.fetch_a_particular_post(post_id);

                                                                                                            if (result1.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result1.status === true){
                                                                                                                let result2 = await db_query.fetch_all_students_of_joined_class_except_one(class_code, user_id);

                                                                                                                if (result2.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result2.status === true){
                                                                                                                    var students_of_class = result2.data;

                                                                                                                    if (students_of_class.length > 0){
                                                                                                                        let resultx = await db_query.fetch_class_details(class_code);

                                                                                                                        if (resultx.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (resultx.status === true){
                                                                                                                            var class_name = resultx.data[0].class_name;

                                                                                                                            let resultx1 = await db_query.get_user_by_id(user_id);

                                                                                                                            if (resultx1.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (resultx1.status === true){
                                                                                                                                var student_name_x = resultx1.data[0].name;
                                                                                                                                var student_profile_img = resultx1.data[0].profile_image;

                                                                                                                                for ([i, record] of students_of_class.entries()){
                                                                                                                                    let student_user_id = record.user_id;
            
                                                                                                                                    let result3 = await db_query.get_user_settings(student_user_id);
            
                                                                                                                                    if (result3.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result3.status === true){
                                                                                                                                        let allow_email_notif = result3.data[0].allow_email_notif;
            
                                                                                                                                        let result4 = await db_query.get_user_by_id(student_user_id);
            
                                                                                                                                        if (result4.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result4.status === true){
                                                                                                                                            var student_email = result4.data[0].email;
                                                                                                                                            var student_name = result4.data[0].name;
            
                                                                                                                                            if (allow_email_notif === 'true'){
                                                                                                                                                mail_service('post_mail', student_email, false, false, true, student_name_x, student_name, null, student_profile_img, class_name, formated_date, formated_time, clean_post, post_type, class_code, null, null, null, null, null, null); //Send mail
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }

                                                                                                                                let result5 = await db_query.fetch_class_details(class_code);
            
                                                                                                                                if (result5.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result5.status === true){
                                                                                                                                    var teacher_user_id = result5.data[0].creators_user_id;
                                                                                                                                    
                                                                                                                                    let result6 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                                                    if (result6.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result6.status === true){
                                                                                                                                        var teacher_name = result6.data[0].name;
                                                                                                                                        var teacher_email = result6.data[0].email;
                                                                                                                                        
                                                                                                                                        let result7 = await db_query.get_user_settings(teacher_user_id);

                                                                                                                                        if (result7.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result7.status === true){
                                                                                                                                            let allow_email_notif_x = result7.data[0].allow_email_notif;

                                                                                                                                            if (allow_email_notif_x === 'true'){
                                                                                                                                                mail_service('post_mail', teacher_email, false, true, false, student_name_x, null, teacher_name, student_profile_img, class_name, formated_date, formated_time, clean_post, post_type, class_code, null, null, null, null, null, null); //Send mail

                                                                                                                                                res.statusCode = 200;
                                                                                                                                                let post_creation_date = result1.data[0].post_creation_date;
                                                                                                                                                res.json({ status: 'post_created_successfully', last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'no_token' });
                                                                                                                                            } else if (allow_email_notif_x === 'false'){
                                                                                                                                                res.statusCode = 200;
                                                                                                                                                let post_creation_date = result1.data[0].post_creation_date;
                                                                                                                                                res.json({ status: 'post_created_successfully', last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'no_token' });
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    } else {
                                                                                                                        res.statusCode = 200;
                                                                                                                        let post_creation_date = result1.data[0].post_creation_date;
                                                                                                                        res.json({ status: 'post_created_successfully', last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'no_token' });
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                } else {
                                                                                                    res.statusCode = 401;
                                                                                                    res.json({ status: 'not_a_member_of_class' });
                                                                                                }
                                                                                            }
                                                                                        } else {
                                                                                            res.statusCode = 401;
                                                                                            res.json({ status: 'class_not_active' });
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    res.statusCode = 401;
                                                                                    res.json({ status: 'class_does_not_exist' });
                                                                                }
                                                                            }
                                                                        } else if (post_type === 'post_with_attachment'){
                                                                            let result = await db_query.check_if_class_exists(class_code);

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
                                                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                                                    if (uploaded_files.length > 3){
                                                                                                        res.statusCode = 401;
                                                                                                        res.json({ status: 'error_in_file_length' });
                                                                                                    } else {
                                                                                                        let file_error = false;

                                                                                                        for (let file_object of uploaded_files){
                                                                                                            if (file_type_list.includes(file_object.mimetype)){
                                                                                                                if (file_object.size < 100000000){
                                                                                                                    //File is good to go
                                                                                                                } else {
                                                                                                                    file_error = true;
                                                                                                                }
                                                                                                            } else {
                                                                                                                file_error = true;
                                                                                                            }
                                                                                                        }

                                                                                                        if (file_error === true){
                                                                                                            res.statusCode = 401;
                                                                                                            res.json({ status: 'file_error' });
                                                                                                        } else if (file_error === false){
                                                                                                            var months = list_months;
                                                                                                            var date = new Date();
                                                                                                            var formated_date = format_date(months, date);
                                                                                                            var formated_time = format_time(new Date);

                                                                                                            const clean_post = sanitizeHtml(data_content, {
                                                                                                                allowedTags: [ 'p', 'a', 'ul', 'li', 'strong', 'i', 's', 'u', 'em' ],
                                                                                                                allowedAttributes: {
                                                                                                                    'a': [ 'href', 'rel', 'target' ]
                                                                                                                }
                                                                                                            });

                                                                                                            if (/^ *$/.test(clean_post)){
                                                                                                                res.statusCode = 401; //Status code
                                                                                                                res.json({ status: 'error_occured' }); //Json response
                                                                                                            } else {
                                                                                                                let result = await db_query.create_new_post(user_id, class_code, post_type, formated_date, clean_post, formated_time);

                                                                                                                if (result.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result.status === true){
                                                                                                                    let post_id = result.data[0].last_post_id;

                                                                                                                    for (let file_object of uploaded_files){
                                                                                                                        let file_name = file_object.name;
                                                                                                                        let file_type = file_object.mimetype;
                                                                                                                        let file_size = format_file_size(file_object.size);

                                                                                                                        let resultx = await db_query.insert_attached_files(user_id, post_id, class_code, file_name, file_type, file_size);

                                                                                                                        if (resultx.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (resultx.status === true){
                                                                                                                            file_object.mv(`./public/class_folders/${ class_code }/public/attachments/${user_id}/${ file_name }`, function (err){
                                                                                                                                if (err){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                }
                                                                                                                            });
                                                                                                                        }
                                                                                                                    }

                                                                                                                    let resultz = await db_query.fetch_a_particular_post(post_id);

                                                                                                                    if (resultz.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (resultz.status === true){
                                                                                                                        let post_creation_date = resultz.data[0].post_creation_date;
                                                                                                                        let result1 = await db_query.fetch_attached_files_using_post_id(post_id, class_code);

                                                                                                                        if (result1.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result1.status === true){
                                                                                                                            let att_files = result1.data;
                                                                                                                            let file_att_array = [];

                                                                                                                            for (const [i, file_obj] of att_files.entries()) {
                                                                                                                                var id = i;
                                                                                                                                var file_name = file_obj.file_name;
                                                                                                                                var file_type = file_obj.file_mimetype;
                                                                                                                                var file_size_x = file_obj.file_size;
                                                                                                                                let post_id = file_obj.post_id;
                                                                                                                                let result33 = await db_query.fetch_particular_post(post_id);

                                                                                                                                if (result33.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result33.status === true){
                                                                                                                                    let post_data = result33.data;
                                                                                                                                    var post_creation_date_x = post_data[0].post_creation_date;
                                                                                                                                    var post_creation_time_x = post_data[0].post_creation_time;
                                                                                                                                }

                                                                                                                                var file_url = `${ process.env.API_URL }/class_folders/${ class_code }/public/attachments/${user_id}/${ file_name }`;
                                                                                                                                file_att_array.push({ id: id, file_name: file_name, file_type: file_type, file_url: file_url, file_size: file_size_x, post_creation_date: post_creation_date_x, post_creation_time: post_creation_time_x });
                                                                                                                            }

                                                                                                                            let result2 = await db_query.fetch_all_students_of_joined_class_except_one(class_code, user_id);

                                                                                                                            if (result2.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (result2.status === true){
                                                                                                                                var students_of_class = result2.data;

                                                                                                                                if (students_of_class.length > 0){
                                                                                                                                    let resultx = await db_query.fetch_class_details(class_code);

                                                                                                                                    if (resultx.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (resultx.status === true){
                                                                                                                                        var class_name = resultx.data[0].class_name;

                                                                                                                                        let resultx1 = await db_query.get_user_by_id(user_id);

                                                                                                                                        if (resultx1.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (resultx1.status === true){
                                                                                                                                            var student_name_x = resultx1.data[0].name;
                                                                                                                                            var student_profile_img = resultx1.data[0].profile_image;

                                                                                                                                            for ([i, record] of students_of_class.entries()){
                                                                                                                                                let student_user_id = record.user_id;
                        
                                                                                                                                                let result3 = await db_query.get_user_settings(student_user_id);
                        
                                                                                                                                                if (result3.status === false){
                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                } else if (result3.status === true){
                                                                                                                                                    let allow_email_notif = result3.data[0].allow_email_notif;
                        
                                                                                                                                                    let result4 = await db_query.get_user_by_id(student_user_id);
                        
                                                                                                                                                    if (result4.status === false){
                                                                                                                                                        res.statusCode = 500;
                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                    } else if (result4.status === true){
                                                                                                                                                        var student_email = result4.data[0].email;
                                                                                                                                                        var student_name = result4.data[0].name;
                        
                                                                                                                                                        if (allow_email_notif === 'true'){
                                                                                                                                                            mail_service('post_mail', student_email, false, false, true, student_name_x, student_name, null, student_profile_img, class_name, formated_date, formated_time, clean_post, post_type, class_code, null, null, null, null, null, null); //Send mail
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }

                                                                                                                                            let result5 = await db_query.fetch_class_details(class_code);
                        
                                                                                                                                            if (result5.status === false){
                                                                                                                                                res.statusCode = 500;
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (result5.status === true){
                                                                                                                                                var teacher_user_id = result5.data[0].creators_user_id;
                                                                                                                                                
                                                                                                                                                let result6 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                                                                if (result6.status === false){
                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                } else if (result6.status === true){
                                                                                                                                                    var teacher_name = result6.data[0].name;
                                                                                                                                                    var teacher_email = result6.data[0].email;
                                                                                                                                                    
                                                                                                                                                    let result7 = await db_query.get_user_settings(teacher_user_id);

                                                                                                                                                    if (result7.status === false){
                                                                                                                                                        res.statusCode = 500;
                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                    } else if (result7.status === true){
                                                                                                                                                        let allow_email_notif_x = result7.data[0].allow_email_notif;

                                                                                                                                                        if (allow_email_notif_x === 'true'){
                                                                                                                                                            mail_service('post_mail', teacher_email, false, true, false, student_name_x, null, teacher_name, student_profile_img, class_name, formated_date, formated_time, clean_post, post_type, class_code, null, null, null, null, null, null); //Send mail

                                                                                                                                                            res.statusCode = 200;
                                                                                                                                                            res.json({ status: 'post_created_successfully', attached_files: file_att_array, last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'no_token' });
                                                                                                                                                        } else if (allow_email_notif_x === 'false'){
                                                                                                                                                            res.statusCode = 200;
                                                                                                                                                            res.json({ status: 'post_created_successfully', attached_files: file_att_array, last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'no_token' });
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                } else {
                                                                                                                                    res.statusCode = 200;
                                                                                                                                    res.json({ status: 'post_created_successfully', attached_files: file_att_array, last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'no_token' });
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
                                                                                                    res.json({ status: 'not_a_member_of_class' });
                                                                                                }
                                                                                            }
                                                                                        } else {
                                                                                            res.statusCode = 401;
                                                                                            res.json({ status: 'class_not_active' });
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    res.statusCode = 401;
                                                                                    res.json({ status: 'class_does_not_exist' });
                                                                                }
                                                                            }
                                                                        } else if (post_type === false){
                                                                            res.statusCode = 401;
                                                                            res.json({ status: 'file_length_error' });
                                                                        } else if (post_type === 'error_in_file_query_string'){
                                                                            res.statusCode = 401;
                                                                            res.json({ status: 'missing_credentials' });
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
            if (form_data.post_type_value && form_data.class_code && form_data.data_content){
                //Filter and sanitize the access token, class code, post type and data content
                let class_code = sanitize_data(form_data.class_code);
                let post_type_value = sanitize_data(form_data.post_type_value);
                let data_content = sanitize_data(form_data.data_content);

                let access_token = validate_auth_header(req.headers['authorization']);

                if (access_token == null){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    const raw_cookies = JSON.parse(JSON.stringify(req.cookies));

                    if (raw_cookies){
                        if (raw_cookies.hasOwnProperty('apex_auth')){
                            let refresh_token = raw_cookies['apex_auth'];

                            //Check if the class code is empty or only contains white spaces
                            if (/^ *$/.test(class_code)){
                                res.statusCode = 401; //Status code
                                res.json({ status: 'missing_credentials' }); //Json response
                            } else {
                                //Check if the post type is empty or only contains white spaces
                                if (/^ *$/.test(post_type_value)){
                                    res.statusCode = 401; //Status code
                                    res.json({ status: 'missing_credentials' }); //Json response
                                } else {
                                    //Check if the data content is empty or only contains white spaces
                                    if (/^ *$/.test(data_content)){
                                        res.statusCode = 401; //Status code
                                        res.json({ status: 'missing_credentials' }); //Json response
                                    } else {
                                        let result = await db_query.check_refresh_token(refresh_token); //Query execution to check if a particular refresh token exists

                                        //Check if the query execution above succeded
                                        if (result.status === false){
                                            res.statusCode = 500; //Status code
                                            res.json({ status: 'error_occured' }); //Json response
                                        } else if (result.status === true){
                                            //Check if any data was fetched from the query execution above
                                            if (result.data.length > 0){
                                                //Verify JWT refresh token
                                                jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
                                                    if (err){
                                                        let result = await db_query.delete_refresh_token(refresh_token); //Query execution to delete a particular refresh token

                                                        //Check if the query execution above succeded
                                                        if (result.status === false){
                                                            res.statusCode = 500; //Status code
                                                            res.json({ status: 'error_occured' }); //Json response
                                                        } else if (result.status === true){
                                                            res.statusCode = 401; //Status code
                                                            res.clearCookie('apex_auth'); // Clear apex auth cookie
                                                            res.json({ status: 'token_expired' }); //Json response
                                                        }
                                                    } else {
                                                        let status = user.status; //Token status
                                                        let user_id = user.user_id; //User ID from token

                                                        //Check if the token status is correct
                                                        if (status === 'user_direct_access_refresh_token'){
                                                            //Verify JWT access token
                                                            jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
                                                                if (err) {
                                                                    let result = await db_query.check_if_account_verified(user_id); //Query execution to check if a particular account is verified

                                                                    //Check if the query execution above succeded
                                                                    if (result.status === false){
                                                                        res.statusCode = 500; //Status code
                                                                        res.json({ status: 'error_occured' }); //Json response
                                                                    } else if (result.status === true){
                                                                        //Check if any data was fetched from the query execution above
                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                            let post_type = ''; //Post type variable

                                                                            //Check if the files object is set
                                                                            if (req.files){
                                                                                //Check if the user uploaded any files
                                                                                if (req.files.file){
                                                                                    var uploaded_files = req.files.file; //All uploaded files

                                                                                    //Check how many files where uploaded by the user
                                                                                    if (uploaded_files.length === undefined){
                                                                                        post_type = 'post_with_attachment'; //Post type
                                                                                        uploaded_files = [ uploaded_files ]; //Store uploaded files in an array in case if only one file was uploaded as an object
                                                                                    } else {
                                                                                        //Check if the files uploaded are between the range of 1 to 3
                                                                                        if (uploaded_files.length >= 1 && uploaded_files.length <= 3){
                                                                                            post_type = 'post_with_attachment'; //Post type
                                                                                        } else {
                                                                                            post_type = false; //Post type
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    post_type = 'error_in_file_query_string'; //Post type
                                                                                }
                                                                            } else {
                                                                                post_type = 'plain_post'; //Post type
                                                                            }

                                                                            //Check the post type
                                                                            if (post_type === 'plain_post'){
                                                                                let result = await db_query.check_if_class_exists(class_code); //Query execution to check if a particular class exists

                                                                                //Check if the query execution succeded
                                                                                if (result.status === false){
                                                                                    res.statusCode = 500; //Status code
                                                                                    res.json({ status: 'error_occured' }); //Json response
                                                                                } else if (result.status === true){
                                                                                    //Check if any data was fetched from the query execution above
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
                                                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                                                        var months = list_months;
                                                                                                        var date = new Date();
                                                                                                        var formated_date = format_date(months, date);
                                                                                                        var formated_time = format_time(new Date);

                                                                                                        const clean_post = sanitizeHtml(data_content, {
                                                                                                            allowedTags: [ 'p', 'a', 'ul', 'li', 'strong', 'i', 's', 'u', 'em' ],
                                                                                                            allowedAttributes: {
                                                                                                                'a': [ 'href', 'rel', 'target' ]
                                                                                                            }
                                                                                                        });

                                                                                                        if (/^ *$/.test(clean_post)){
                                                                                                            res.statusCode = 401; //Status code
                                                                                                            res.json({ status: 'error_occured' }); //Json response
                                                                                                        } else {
                                                                                                            let result = await db_query.create_new_post(user_id, class_code, post_type, formated_date, clean_post, formated_time);

                                                                                                            if (result.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result.status === true){
                                                                                                                let post_id = result.data[0].last_post_id;

                                                                                                                let result1 = await db_query.fetch_a_particular_post(post_id);

                                                                                                                if (result1.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result1.status === true){
                                                                                                                    let result2 = await db_query.fetch_all_students_of_joined_class_except_one(class_code, user_id);

                                                                                                                    if (result2.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result2.status === true){
                                                                                                                        var students_of_class = result2.data;

                                                                                                                        if (students_of_class.length > 0){
                                                                                                                            let resultx = await db_query.fetch_class_details(class_code);

                                                                                                                            if (resultx.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (resultx.status === true){
                                                                                                                                var class_name = resultx.data[0].class_name;

                                                                                                                                let resultx1 = await db_query.get_user_by_id(user_id);

                                                                                                                                if (resultx1.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (resultx1.status === true){
                                                                                                                                    var student_name_x = resultx1.data[0].name;
                                                                                                                                    var student_profile_img = resultx1.data[0].profile_image;

                                                                                                                                    for ([i, record] of students_of_class.entries()){
                                                                                                                                        let student_user_id = record.user_id;
                
                                                                                                                                        let result3 = await db_query.get_user_settings(student_user_id);
                
                                                                                                                                        if (result3.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result3.status === true){
                                                                                                                                            let allow_email_notif = result3.data[0].allow_email_notif;
                
                                                                                                                                            let result4 = await db_query.get_user_by_id(student_user_id);
                
                                                                                                                                            if (result4.status === false){
                                                                                                                                                res.statusCode = 500;
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (result4.status === true){
                                                                                                                                                var student_email = result4.data[0].email;
                                                                                                                                                var student_name = result4.data[0].name;
                
                                                                                                                                                if (allow_email_notif === 'true'){
                                                                                                                                                    mail_service('post_mail', student_email, false, false, true, student_name_x, student_name, null, student_profile_img, class_name, formated_date, formated_time, clean_post, post_type, class_code, null, null, null, null, null, null); //Send mail
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }

                                                                                                                                    let result5 = await db_query.fetch_class_details(class_code);
                
                                                                                                                                    if (result5.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result5.status === true){
                                                                                                                                        var teacher_user_id = result5.data[0].creators_user_id;
                                                                                                                                        
                                                                                                                                        let result6 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                                                        if (result6.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result6.status === true){
                                                                                                                                            var teacher_name = result6.data[0].name;
                                                                                                                                            var teacher_email = result6.data[0].email;
                                                                                                                                            
                                                                                                                                            let result7 = await db_query.get_user_settings(teacher_user_id);

                                                                                                                                            if (result7.status === false){
                                                                                                                                                res.statusCode = 500;
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (result7.status === true){
                                                                                                                                                let allow_email_notif_x = result7.data[0].allow_email_notif;

                                                                                                                                                if (allow_email_notif_x === 'true'){
                                                                                                                                                    mail_service('post_mail', teacher_email, false, true, false, student_name_x, null, teacher_name, student_profile_img, class_name, formated_date, formated_time, clean_post, post_type, class_code, null, null, null, null, null, null); //Send mail

                                                                                                                                                    res.statusCode = 200;
                                                                                                                                                    let post_creation_date = result1.data[0].post_creation_date;
                                                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                    res.json({ status: 'post_created_successfully', last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                                } else if (allow_email_notif_x === 'false'){
                                                                                                                                                    res.statusCode = 200;
                                                                                                                                                    let post_creation_date = result1.data[0].post_creation_date;
                                                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                    res.json({ status: 'post_created_successfully', last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        } else {
                                                                                                                            res.statusCode = 200;
                                                                                                                            let post_creation_date = result1.data[0].post_creation_date;
                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                            res.json({ status: 'post_created_successfully', last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                        }
                                                                                                                    } 
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    } else {
                                                                                                        res.statusCode = 401;
                                                                                                        res.json({ status: 'not_a_member_of_class' });
                                                                                                    }
                                                                                                }
                                                                                            } else {
                                                                                                res.statusCode = 401;
                                                                                                res.json({ status: 'class_not_active' });
                                                                                            }
                                                                                        }
                                                                                    } else {
                                                                                        res.statusCode = 401;
                                                                                        res.json({ status: 'class_does_not_exist' });
                                                                                    }
                                                                                }
                                                                            } else if (post_type === 'post_with_attachment'){
                                                                                let result = await db_query.check_if_class_exists(class_code);

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
                                                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                                                        if (uploaded_files.length > 3){
                                                                                                            res.statusCode = 401;
                                                                                                            res.json({ status: 'error_in_file_length' });
                                                                                                        } else {
                                                                                                            let file_error = false;

                                                                                                            for (let file_object of uploaded_files){
                                                                                                                if (file_type_list.includes(file_object.mimetype)){
                                                                                                                    if (file_object.size < 100000000){
                                                                                                                        //File is good to go
                                                                                                                    } else {
                                                                                                                        file_error = true;
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    file_error = true;
                                                                                                                }
                                                                                                            }

                                                                                                            if (file_error === true){
                                                                                                                res.statusCode = 401;
                                                                                                                res.json({ status: 'file_error' });
                                                                                                            } else if (file_error === false){
                                                                                                                var months = list_months;
                                                                                                                var date = new Date();
                                                                                                                var formated_date = format_date(months, date);
                                                                                                                var formated_time = format_time(new Date);

                                                                                                                const clean_post = sanitizeHtml(data_content, {
                                                                                                                    allowedTags: [ 'p', 'a', 'ul', 'li', 'strong', 'i', 's', 'u', 'em' ],
                                                                                                                    allowedAttributes: {
                                                                                                                        'a': [ 'href', 'rel', 'target' ]
                                                                                                                    }
                                                                                                                });

                                                                                                                if (/^ *$/.test(clean_post)){
                                                                                                                    res.statusCode = 401; //Status code
                                                                                                                    res.json({ status: 'error_occured' }); //Json response
                                                                                                                } else {
                                                                                                                    let result = await db_query.create_new_post(user_id, class_code, post_type, formated_date, clean_post, formated_time);

                                                                                                                    if (result.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result.status === true){
                                                                                                                        let post_id = result.data[0].last_post_id;

                                                                                                                        for (let file_object of uploaded_files){
                                                                                                                            let file_name = file_object.name;
                                                                                                                            let file_type = file_object.mimetype;
                                                                                                                            let file_size = format_file_size(file_object.size);

                                                                                                                            let result1 = await db_query.insert_attached_files(user_id, post_id, class_code, file_name, file_type, file_size);

                                                                                                                            if (result1.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (result1.status === true){
                                                                                                                                file_object.mv(`./public/class_folders/${ class_code }/public/attachments/${user_id}/${ file_name }`, function (err){
                                                                                                                                    if (err){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    }
                                                                                                                                });
                                                                                                                            }
                                                                                                                        }

                                                                                                                        let result2 = await db_query.fetch_a_particular_post(post_id);

                                                                                                                        if (result2.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result2.status === true){
                                                                                                                            let post_creation_date = result2.data[0].post_creation_date;
                                                                                                                            let result3 = await db_query.fetch_attached_files_using_post_id(post_id, class_code);

                                                                                                                            if (result3.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (result3.status === true){
                                                                                                                                let att_files = result3.data;
                                                                                                                                let file_att_array = [];

                                                                                                                                for (const [i, file_obj] of att_files.entries()) {
                                                                                                                                    var id = i;
                                                                                                                                    var file_name = file_obj.file_name;
                                                                                                                                    var file_type = file_obj.file_mimetype;
                                                                                                                                    var file_size_x = file_obj.file_size;
                                                                                                                                    let post_id = file_obj.post_id;
                                                                                                                                    let result33 = await db_query.fetch_particular_post(post_id);

                                                                                                                                    if (result33.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result33.status === true){
                                                                                                                                        let post_data = result33.data;
                                                                                                                                        var post_creation_date_x = post_data[0].post_creation_date;
                                                                                                                                        var post_creation_time_x = post_data[0].post_creation_time;
                                                                                                                                    }

                                                                                                                                    var file_url = `${ process.env.API_URL }/class_folders/${ class_code }/public/attachments/${user_id}/${ file_name }`;
                                                                                                                                    file_att_array.push({ id: id, file_name: file_name, file_type: file_type, file_url: file_url, file_size: file_size_x, post_creation_date: post_creation_date_x, post_creation_time: post_creation_time_x });
                                                                                                                                }

                                                                                                                                let result2 = await db_query.fetch_all_students_of_joined_class_except_one(class_code, user_id);

                                                                                                                                if (result2.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result2.status === true){
                                                                                                                                    var students_of_class = result2.data;

                                                                                                                                    if (students_of_class.length > 0){
                                                                                                                                        let resultx = await db_query.fetch_class_details(class_code);

                                                                                                                                        if (resultx.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (resultx.status === true){
                                                                                                                                            var class_name = resultx.data[0].class_name;

                                                                                                                                            let resultx1 = await db_query.get_user_by_id(user_id);

                                                                                                                                            if (resultx1.status === false){
                                                                                                                                                res.statusCode = 500;
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (resultx1.status === true){
                                                                                                                                                var student_name_x = resultx1.data[0].name;
                                                                                                                                                var student_profile_img = resultx1.data[0].profile_image;

                                                                                                                                                for ([i, record] of students_of_class.entries()){
                                                                                                                                                    let student_user_id = record.user_id;
                            
                                                                                                                                                    let result3 = await db_query.get_user_settings(student_user_id);
                            
                                                                                                                                                    if (result3.status === false){
                                                                                                                                                        res.statusCode = 500;
                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                    } else if (result3.status === true){
                                                                                                                                                        let allow_email_notif = result3.data[0].allow_email_notif;
                            
                                                                                                                                                        let result4 = await db_query.get_user_by_id(student_user_id);
                            
                                                                                                                                                        if (result4.status === false){
                                                                                                                                                            res.statusCode = 500;
                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                        } else if (result4.status === true){
                                                                                                                                                            var student_email = result4.data[0].email;
                                                                                                                                                            var student_name = result4.data[0].name;
                            
                                                                                                                                                            if (allow_email_notif === 'true'){
                                                                                                                                                                mail_service('post_mail', student_email, false, false, true, student_name_x, student_name, null, student_profile_img, class_name, formated_date, formated_time, clean_post, post_type, class_code, null, null, null, null, null, null); //Send mail
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                }

                                                                                                                                                let result5 = await db_query.fetch_class_details(class_code);
                            
                                                                                                                                                if (result5.status === false){
                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                } else if (result5.status === true){
                                                                                                                                                    var teacher_user_id = result5.data[0].creators_user_id;
                                                                                                                                                    
                                                                                                                                                    let result6 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                                                                    if (result6.status === false){
                                                                                                                                                        res.statusCode = 500;
                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                    } else if (result6.status === true){
                                                                                                                                                        var teacher_name = result6.data[0].name;
                                                                                                                                                        var teacher_email = result6.data[0].email;
                                                                                                                                                        
                                                                                                                                                        let result7 = await db_query.get_user_settings(teacher_user_id);

                                                                                                                                                        if (result7.status === false){
                                                                                                                                                            res.statusCode = 500;
                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                        } else if (result7.status === true){
                                                                                                                                                            let allow_email_notif_x = result7.data[0].allow_email_notif;

                                                                                                                                                            if (allow_email_notif_x === 'true'){
                                                                                                                                                                mail_service('post_mail', teacher_email, false, true, false, student_name_x, null, teacher_name, student_profile_img, class_name, formated_date, formated_time, clean_post, post_type, class_code, null, null, null, null, null, null); //Send mail

                                                                                                                                                                res.statusCode = 200;
                                                                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                                res.json({ status: 'post_created_successfully', attached_files: file_att_array, last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                                            } else if (allow_email_notif_x === 'false'){
                                                                                                                                                                res.statusCode = 200;
                                                                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                                                res.json({ status: 'post_created_successfully', attached_files: file_att_array, last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    } else {
                                                                                                                                        res.statusCode = 200;
                                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                                        res.json({ status: 'post_created_successfully', attached_files: file_att_array, last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'token_available', new_accessToken: new_access_token });
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
                                                                                                        res.json({ status: 'not_a_member_of_class' });
                                                                                                    }
                                                                                                }
                                                                                            } else {
                                                                                                res.statusCode = 200;
                                                                                                res.json({ status: 'class_not_active' });
                                                                                            }
                                                                                        }
                                                                                    } else {
                                                                                        res.statusCode = 401;
                                                                                        res.json({ status: 'class_does_not_exist' });
                                                                                    }
                                                                                }
                                                                            } else if (post_type === false){
                                                                                res.statusCode = 401;
                                                                                res.json({ status: 'file_length_error' });
                                                                            } else if (post_type === 'error_in_file_query_string'){
                                                                                res.statusCode = 401;
                                                                                res.json({ status: 'missing_credentials' });
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
                                                                            let post_type = '';

                                                                            if (req.files){
                                                                                if (req.files.file){
                                                                                    var uploaded_files = req.files.file;

                                                                                    if (uploaded_files.length === undefined){
                                                                                        post_type = 'post_with_attachment';
                                                                                        uploaded_files = [ uploaded_files ];
                                                                                    } else {
                                                                                        if (uploaded_files.length >= 1 && uploaded_files.length <= 3){
                                                                                            post_type = 'post_with_attachment';
                                                                                        } else {
                                                                                            post_type = false;
                                                                                        }
                                                                                    }
                                                                                } else {
                                                                                    post_type = 'error_in_file_query_string';
                                                                                }
                                                                            } else {
                                                                                post_type = 'plain_post';
                                                                            }

                                                                            if (post_type === 'plain_post'){
                                                                                let result = await db_query.check_if_class_exists(class_code);

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
                                                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                                                        var months = list_months;
                                                                                                        var date = new Date();
                                                                                                        var formated_date = format_date(months, date);
                                                                                                        var formated_time = format_time(new Date);

                                                                                                        const clean_post = sanitizeHtml(data_content, {
                                                                                                            allowedTags: [ 'p', 'a', 'ul', 'li', 'strong', 'i', 's', 'u', 'em' ],
                                                                                                            allowedAttributes: {
                                                                                                                'a': [ 'href', 'rel', 'target' ]
                                                                                                            }
                                                                                                        });

                                                                                                        if (/^ *$/.test(clean_post)){
                                                                                                            res.statusCode = 401; //Status code
                                                                                                            res.json({ status: 'error_occured' }); //Json response
                                                                                                        } else {
                                                                                                            let result = await db_query.create_new_post(user_id, class_code, post_type, formated_date, clean_post, formated_time);

                                                                                                            if (result.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result.status === true){
                                                                                                                let post_id = result.data[0].last_post_id;

                                                                                                                let result1 = await db_query.fetch_a_particular_post(post_id);

                                                                                                                if (result1.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result1.status === true){
                                                                                                                    let result2 = await db_query.fetch_all_students_of_joined_class_except_one(class_code, user_id);

                                                                                                                    if (result2.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result2.status === true){
                                                                                                                        var students_of_class = result2.data;

                                                                                                                        if (students_of_class.length > 0){
                                                                                                                            let resultx = await db_query.fetch_class_details(class_code);

                                                                                                                            if (resultx.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (resultx.status === true){
                                                                                                                                var class_name = resultx.data[0].class_name;

                                                                                                                                let resultx1 = await db_query.get_user_by_id(user_id);

                                                                                                                                if (resultx1.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (resultx1.status === true){
                                                                                                                                    var student_name_x = resultx1.data[0].name;
                                                                                                                                    var student_profile_img = resultx1.data[0].profile_image;

                                                                                                                                    for ([i, record] of students_of_class.entries()){
                                                                                                                                        let student_user_id = record.user_id;
                
                                                                                                                                        let result3 = await db_query.get_user_settings(student_user_id);
                
                                                                                                                                        if (result3.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result3.status === true){
                                                                                                                                            let allow_email_notif = result3.data[0].allow_email_notif;
                
                                                                                                                                            let result4 = await db_query.get_user_by_id(student_user_id);
                
                                                                                                                                            if (result4.status === false){
                                                                                                                                                res.statusCode = 500;
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (result4.status === true){
                                                                                                                                                var student_email = result4.data[0].email;
                                                                                                                                                var student_name = result4.data[0].name;
                
                                                                                                                                                if (allow_email_notif === 'true'){
                                                                                                                                                    mail_service('post_mail', student_email, false, false, true, student_name_x, student_name, null, student_profile_img, class_name, formated_date, formated_time, clean_post, post_type, class_code, null, null, null, null, null, null); //Send mail
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }

                                                                                                                                    let result5 = await db_query.fetch_class_details(class_code);
                
                                                                                                                                    if (result5.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result5.status === true){
                                                                                                                                        var teacher_user_id = result5.data[0].creators_user_id;
                                                                                                                                        
                                                                                                                                        let result6 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                                                        if (result6.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result6.status === true){
                                                                                                                                            var teacher_name = result6.data[0].name;
                                                                                                                                            var teacher_email = result6.data[0].email;
                                                                                                                                            
                                                                                                                                            let result7 = await db_query.get_user_settings(teacher_user_id);

                                                                                                                                            if (result7.status === false){
                                                                                                                                                res.statusCode = 500;
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (result7.status === true){
                                                                                                                                                let allow_email_notif_x = result7.data[0].allow_email_notif;

                                                                                                                                                if (allow_email_notif_x === 'true'){
                                                                                                                                                    mail_service('post_mail', teacher_email, false, true, false, student_name_x, null, teacher_name, student_profile_img, class_name, formated_date, formated_time, clean_post, post_type, class_code, null, null, null, null, null, null); //Send mail

                                                                                                                                                    res.statusCode = 200;
                                                                                                                                                    let post_creation_date = result1.data[0].post_creation_date;
                                                                                                                                                    res.json({ status: 'post_created_successfully', last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'no_token' });
                                                                                                                                                } else if (allow_email_notif_x === 'false'){
                                                                                                                                                    res.statusCode = 200;
                                                                                                                                                    let post_creation_date = result1.data[0].post_creation_date;
                                                                                                                                                    res.json({ status: 'post_created_successfully', last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'no_token' });
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        } else {
                                                                                                                            res.statusCode = 200;
                                                                                                                            let post_creation_date = result1.data[0].post_creation_date;
                                                                                                                            res.json({ status: 'post_created_successfully', last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'no_token' });
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    } else {
                                                                                                        res.statusCode = 401;
                                                                                                        res.json({ status: 'not_a_member_of_class' });
                                                                                                    }
                                                                                                }
                                                                                            } else {
                                                                                                res.statusCode = 200;
                                                                                                res.json({ status: 'class_not_active' });
                                                                                            }
                                                                                        }
                                                                                    } else {
                                                                                        res.statusCode = 401;
                                                                                        res.json({ status: 'class_does_not_exist' });
                                                                                    }
                                                                                }
                                                                            } else if (post_type === 'post_with_attachment'){
                                                                                let result = await db_query.check_if_class_exists(class_code);

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
                                                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                                                        if (uploaded_files.length > 3){
                                                                                                            res.statusCode = 401;
                                                                                                            res.json({ status: 'error_in_file_length' });
                                                                                                        } else {
                                                                                                            let file_error = false;

                                                                                                            for (let file_object of uploaded_files){
                                                                                                                if (file_type_list.includes(file_object.mimetype)){
                                                                                                                    if (file_object.size < 100000000){
                                                                                                                        //File is good to go
                                                                                                                    } else {
                                                                                                                        file_error = true;
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    file_error = true;
                                                                                                                }
                                                                                                            }

                                                                                                            if (file_error === true){
                                                                                                                res.statusCode = 401;
                                                                                                                res.json({ status: 'file_error' });
                                                                                                            } else if (file_error === false){
                                                                                                                var months = list_months;
                                                                                                                var date = new Date();
                                                                                                                var formated_date = format_date(months, date);
                                                                                                                var formated_time = format_time(new Date);

                                                                                                                const clean_post = sanitizeHtml(data_content, {
                                                                                                                    allowedTags: [ 'p', 'a', 'ul', 'li', 'strong', 'i', 's', 'u', 'em' ],
                                                                                                                    allowedAttributes: {
                                                                                                                        'a': [ 'href', 'rel', 'target' ]
                                                                                                                    }
                                                                                                                });

                                                                                                                if (/^ *$/.test(clean_post)){
                                                                                                                    res.statusCode = 401; //Status code
                                                                                                                    res.json({ status: 'error_occured' }); //Json response
                                                                                                                } else {
                                                                                                                    let result = await db_query.create_new_post(user_id, class_code, post_type, formated_date, clean_post, formated_time);

                                                                                                                    if (result.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result.status === true){
                                                                                                                        let post_id = result.data[0].last_post_id;

                                                                                                                        for (let file_object of uploaded_files){
                                                                                                                            let file_name = file_object.name;
                                                                                                                            let file_type = file_object.mimetype;
                                                                                                                            let file_size = format_file_size(file_object.size);

                                                                                                                            let result1 = await db_query.insert_attached_files(user_id, post_id, class_code, file_name, file_type, file_size);

                                                                                                                            if (result1.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (result1.status === true){
                                                                                                                                file_object.mv(`./public/class_folders/${ class_code }/public/attachments/${user_id}/${ file_name }`, function (err){
                                                                                                                                    if (err){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    }
                                                                                                                                });
                                                                                                                            }
                                                                                                                        }

                                                                                                                        let result2 = await db_query.fetch_a_particular_post(post_id);

                                                                                                                        if (result2.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result2.status === true){
                                                                                                                            let post_creation_date = result2.data[0].post_creation_date;
                                                                                                                            let result3 = await db_query.fetch_attached_files_using_post_id(post_id, class_code);

                                                                                                                            if (result3.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (result3.status === true){
                                                                                                                                let att_files = result3.data;
                                                                                                                                let file_att_array = [];

                                                                                                                                for (const [i, file_obj] of att_files.entries()) {
                                                                                                                                    var id = i;
                                                                                                                                    var file_name = file_obj.file_name;
                                                                                                                                    var file_type = file_obj.file_mimetype;
                                                                                                                                    var file_size_x = file_obj.file_size;
                                                                                                                                    let post_id = file_obj.post_id;
                                                                                                                                    let result33 = await db_query.fetch_particular_post(post_id);

                                                                                                                                    if (result33.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result33.status === true){
                                                                                                                                        let post_data = result33.data;
                                                                                                                                        var post_creation_date_x = post_data[0].post_creation_date;
                                                                                                                                        var post_creation_time_x = post_data[0].post_creation_time;
                                                                                                                                    }

                                                                                                                                    var file_url = `${ process.env.API_URL }/class_folders/${ class_code }/public/attachments/${user_id}/${ file_name }`;
                                                                                                                                    file_att_array.push({ id: id, file_name: file_name, file_type: file_type, file_url: file_url, file_size: file_size_x, post_creation_date: post_creation_date_x, post_creation_time: post_creation_time_x });
                                                                                                                                }

                                                                                                                                let result2 = await db_query.fetch_all_students_of_joined_class_except_one(class_code, user_id);

                                                                                                                                if (result2.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result2.status === true){
                                                                                                                                    var students_of_class = result2.data;

                                                                                                                                    if (students_of_class.length > 0){
                                                                                                                                        let resultx = await db_query.fetch_class_details(class_code);

                                                                                                                                        if (resultx.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (resultx.status === true){
                                                                                                                                            var class_name = resultx.data[0].class_name;

                                                                                                                                            let resultx1 = await db_query.get_user_by_id(user_id);

                                                                                                                                            if (resultx1.status === false){
                                                                                                                                                res.statusCode = 500;
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (resultx1.status === true){
                                                                                                                                                var student_name_x = resultx1.data[0].name;
                                                                                                                                                var student_profile_img = resultx1.data[0].profile_image;

                                                                                                                                                for ([i, record] of students_of_class.entries()){
                                                                                                                                                    let student_user_id = record.user_id;
                            
                                                                                                                                                    let result3 = await db_query.get_user_settings(student_user_id);
                            
                                                                                                                                                    if (result3.status === false){
                                                                                                                                                        res.statusCode = 500;
                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                    } else if (result3.status === true){
                                                                                                                                                        let allow_email_notif = result3.data[0].allow_email_notif;
                            
                                                                                                                                                        let result4 = await db_query.get_user_by_id(student_user_id);
                            
                                                                                                                                                        if (result4.status === false){
                                                                                                                                                            res.statusCode = 500;
                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                        } else if (result4.status === true){
                                                                                                                                                            var student_email = result4.data[0].email;
                                                                                                                                                            var student_name = result4.data[0].name;
                            
                                                                                                                                                            if (allow_email_notif === 'true'){
                                                                                                                                                                mail_service('post_mail', student_email, false, false, true, student_name_x, student_name, null, student_profile_img, class_name, formated_date, formated_time, clean_post, post_type, class_code, null, null, null, null, null, null); //Send mail
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                }

                                                                                                                                                let result5 = await db_query.fetch_class_details(class_code);
                            
                                                                                                                                                if (result5.status === false){
                                                                                                                                                    res.statusCode = 500;
                                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                                } else if (result5.status === true){
                                                                                                                                                    var teacher_user_id = result5.data[0].creators_user_id;
                                                                                                                                                    
                                                                                                                                                    let result6 = await db_query.get_user_by_id(teacher_user_id);

                                                                                                                                                    if (result6.status === false){
                                                                                                                                                        res.statusCode = 500;
                                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                                    } else if (result6.status === true){
                                                                                                                                                        var teacher_name = result6.data[0].name;
                                                                                                                                                        var teacher_email = result6.data[0].email;
                                                                                                                                                        
                                                                                                                                                        let result7 = await db_query.get_user_settings(teacher_user_id);

                                                                                                                                                        if (result7.status === false){
                                                                                                                                                            res.statusCode = 500;
                                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                                        } else if (result7.status === true){
                                                                                                                                                            let allow_email_notif_x = result7.data[0].allow_email_notif;

                                                                                                                                                            if (allow_email_notif_x === 'true'){
                                                                                                                                                                mail_service('post_mail', teacher_email, false, true, false, student_name_x, null, teacher_name, student_profile_img, class_name, formated_date, formated_time, clean_post, post_type, class_code, null, null, null, null, null, null); //Send mail

                                                                                                                                                                res.statusCode = 200;
                                                                                                                                                                res.json({ status: 'post_created_successfully', attached_files: file_att_array, last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'no_token' });
                                                                                                                                                            } else if (allow_email_notif_x === 'false'){
                                                                                                                                                                res.statusCode = 200;
                                                                                                                                                                res.json({ status: 'post_created_successfully', attached_files: file_att_array, last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'no_token' });
                                                                                                                                                            }
                                                                                                                                                        }
                                                                                                                                                    }
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    } else {
                                                                                                                                        res.statusCode = 200;
                                                                                                                                        res.json({ status: 'post_created_successfully', attached_files: file_att_array, last_post_id: post_id, post_type: post_type, post_creation_date: post_creation_date, token_info: 'no_token' });
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
                                                                                                        res.json({ status: 'not_a_member_of_class' });
                                                                                                    }
                                                                                                }
                                                                                            } else {
                                                                                                res.statusCode = 200;
                                                                                                res.json({ status: 'class_not_active' });
                                                                                            }
                                                                                        }
                                                                                    } else {
                                                                                        res.statusCode = 401;
                                                                                        res.json({ status: 'class_does_not_exist' });
                                                                                    }
                                                                                }
                                                                            } else if (post_type === false){
                                                                                res.statusCode = 401;
                                                                                res.json({ status: 'file_length_error' });
                                                                            } else if (post_type === 'error_in_file_query_string'){
                                                                                res.statusCode = 401;
                                                                                res.json({ status: 'missing_credentials' });
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

module.exports = create_post;