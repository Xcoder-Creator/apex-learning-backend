const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db query
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_class_code = require('../../utility/generate_class_code.util') //Import generate class code
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header
const fs = require('fs'); //Import fs module

const create_new_class = async (req, res) => {
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
            if (form_data.access_token && form_data.class_name && form_data.class_section && form_data.class_subject && form_data.class_room){
                //Filter and sanitize the form data
                let access_token = sanitize_data(form_data.access_token);
                let class_name = sanitize_data(form_data.class_name);
                let class_section = sanitize_data(form_data.class_section);
                let class_subject = sanitize_data(form_data.class_subject);
                let class_room = sanitize_data(form_data.class_room);

                //Check if the access token is empty or only contains white spaces
                if (/^ *$/.test(access_token)){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    if (/^ *$/.test(class_name) || class_name.length > 500){
                        res.statusCode = 401;
                        res.json({ status: 'invalid_credentials' });
                    } else {
                        if (/^ *$/.test(class_section) || class_section.length > 500){
                            res.statusCode = 401;
                            res.json({ status: 'invalid_credentials' });
                        } else {
                            if (/^ *$/.test(class_subject) || class_subject.length > 500){
                                res.statusCode = 401;
                                res.json({ status: 'invalid_credentials' });
                            } else {
                                if (/^ *$/.test(class_room) || class_room.length > 500){
                                    res.statusCode = 401;
                                    res.json({ status: 'invalid_credentials' });
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
                                                                                    let isClassCode_exist = null;
                                                                                    let class_code_length = [ 8, 12 ];
                                                                                    let new_classcode_value = '';

                                                                                    do {
                                                                                        let random = Math.floor(Math.random() * class_code_length.length);
                                                                                        let no_of_characters_for_class_code = class_code_length[random];
                                                                                        let new_class_code = generate_class_code(no_of_characters_for_class_code);
                                            
                                                                                        let result1 = await db_query.check_if_class_exists(new_class_code);
                                            
                                                                                        if (result1.data.length > 0){
                                                                                            isClassCode_exist = true;
                                                                                        } else if (result1.data.length === 0){
                                                                                            new_classcode_value = new_class_code;
                                                                                            isClassCode_exist = false;
                                                                                        }
                                                                                    } while(isClassCode_exist === true);

                                                                                    let profile_initials = class_name[0];

                                                                                    let result2 = await db_query.create_new_class(new_classcode_value, user_id, class_name, class_subject, class_room, class_section, profile_initials.toUpperCase(), '/images/class_background_images/backtoschool.jpg');

                                                                                    if (result2.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (result2.status === true){
                                                                                        fs.mkdirSync(`public/class_folders/${new_classcode_value}`);
                                                                                        fs.mkdirSync(`public/class_folders/${new_classcode_value}/public`);
                                                                                        fs.mkdirSync(`public/class_folders/${new_classcode_value}/public/attachments`);
                                                                                        fs.mkdirSync(`public/class_folders/${new_classcode_value}/public/attachments/${user_id}`);

                                                                                        let result = await db_query.fetch_created_classes_by_teacher(user_id);

                                                                                        if (result.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (result.status === true){
                                                                                            if (result.data.length > 0){
                                                                                                var created_classes = result.data;
                                                                                                var active_classes = [];

                                                                                                for (let [i, record] of created_classes.entries()){
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
                                                                                                                    class_data['id'] = i;
                                                                                                                    class_data['creators_user_id'] = user_id;
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
                                                                                                    res.statusCode = 200;
                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                    res.json({ status: 'class_created_successfully', class_code: new_classcode_value, token_info: 'token_available', new_accessToken: new_access_token, details: active_classes });
                                                                                                } else {
                                                                                                    res.statusCode = 200;
                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                    res.json({ status: 'class_created_successfully', class_code: new_classcode_value, token_info: 'token_available', new_accessToken: new_access_token, details: [] });
                                                                                                }
                                                                                            } else {
                                                                                                res.statusCode = 200;
                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                res.json({ status: 'class_created_successfully', class_code: new_classcode_value, token_info: 'token_available', new_accessToken: new_access_token, details: [] });
                                                                                            }
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
                                                                    let status = user.status;

                                                                    if (status === 'user_direct_access_token'){
                                                                        let user_auth_id = user.user_id; //Users authentication id

                                                                        let result = await db_query.check_if_account_verified(user_auth_id);

                                                                        if (result.status === false){
                                                                            res.statusCode = 500;
                                                                            res.json({ status: 'error_occured' });
                                                                        } else if (result.status === true){
                                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                                let result = await db_query.check_if_teacher_account(user_auth_id);

                                                                                if (result.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (result.status === true){
                                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                                        let isClassCode_exist = null;
                                                                                        let class_code_length = [ 8, 12 ];
                                                                                        let new_classcode_value = '';

                                                                                        do {
                                                                                            let random = Math.floor(Math.random() * class_code_length.length);
                                                                                            let no_of_characters_for_class_code = class_code_length[random];
                                                                                            let new_class_code = generate_class_code(no_of_characters_for_class_code);
                                                
                                                                                            let result1 = await db_query.check_if_class_exists(new_class_code);
                                                
                                                                                            if (result1.data.length > 0){
                                                                                                isClassCode_exist = true;
                                                                                            } else if (result1.data.length === 0){
                                                                                                new_classcode_value = new_class_code;
                                                                                                isClassCode_exist = false;
                                                                                            }
                                                                                        } while(isClassCode_exist === true);

                                                                                        let profile_initials = class_name[0];

                                                                                        let result2 = await db_query.create_new_class(new_classcode_value, user_auth_id, class_name, class_subject, class_room, class_section, profile_initials.toUpperCase(), '/images/class_background_images/backtoschool.jpg');

                                                                                        if (result2.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (result2.status === true){
                                                                                            fs.mkdirSync(`public/class_folders/${new_classcode_value}`);
                                                                                            fs.mkdirSync(`public/class_folders/${new_classcode_value}/public`);
                                                                                            fs.mkdirSync(`public/class_folders/${new_classcode_value}/public/attachments`);
                                                                                            fs.mkdirSync(`public/class_folders/${new_classcode_value}/public/attachments/${user_auth_id}`);

                                                                                            let result = await db_query.fetch_created_classes_by_teacher(user_id);

                                                                                            if (result.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result.status === true){
                                                                                                if (result.data.length > 0){
                                                                                                    var created_classes = result.data;
                                                                                                    var active_classes = [];

                                                                                                    for (let [i, record] of created_classes.entries()){
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
                                                                                                                        class_data['id'] = i;
                                                                                                                        class_data['creators_user_id'] = user_auth_id;
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
                                                                                                        res.statusCode = 200;
                                                                                                        res.json({ status: 'class_created_successfully', class_code: new_classcode_value, token_info: 'no_token', details: active_classes });
                                                                                                    } else {
                                                                                                        res.statusCode = 200;
                                                                                                        res.json({ status: 'class_created_successfully', class_code: new_classcode_value, token_info: 'no_token', details: [] });
                                                                                                    }
                                                                                                } else {
                                                                                                    res.statusCode = 200;
                                                                                                    res.json({ status: 'class_created_successfully', class_code: new_classcode_value, token_info: 'no_token', details: [] });
                                                                                                }
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
            if (form_data.class_name && form_data.class_section && form_data.class_subject && form_data.class_room){
                //Filter and sanitize form data
                let class_name = sanitize_data(form_data.class_name);
                let class_section = sanitize_data(form_data.class_section);
                let class_subject = sanitize_data(form_data.class_subject);
                let class_room = sanitize_data(form_data.class_room);

                let access_token = validate_auth_header(req.headers['authorization']);

                if (access_token == null){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    const raw_cookies = JSON.parse(JSON.stringify(req.cookies));

                    if (raw_cookies){
                        if (raw_cookies.hasOwnProperty('apex_auth')){
                            let refresh_token = raw_cookies['apex_auth'];

                            if (/^ *$/.test(class_name)){
                                res.statusCode = 401;
                                res.json({ status: 'missing_credentials' });
                            } else {
                                if (/^ *$/.test(class_section)){
                                    res.statusCode = 401;
                                    res.json({ status: 'missing_credentials' });
                                } else {
                                    if (/^ *$/.test(class_subject)){
                                        res.statusCode = 401;
                                        res.json({ status: 'missing_credentials' });
                                    } else {
                                        if (/^ *$/.test(class_room)){
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
                                                                                        let isClassCode_exist = null;
                                                                                        let class_code_length = [ 8, 12 ];
                                                                                        let new_classcode_value = '';

                                                                                        do {
                                                                                            let random = Math.floor(Math.random() * class_code_length.length);
                                                                                            let no_of_characters_for_class_code = class_code_length[random];
                                                                                            let new_class_code = generate_class_code(no_of_characters_for_class_code);
                                                
                                                                                            let result1 = await db_query.check_if_class_exists(new_class_code);
                                                
                                                                                            if (result1.data.length > 0){
                                                                                                isClassCode_exist = true;
                                                                                            } else if (result1.data.length === 0){
                                                                                                new_classcode_value = new_class_code;
                                                                                                isClassCode_exist = false;
                                                                                            }
                                                                                        } while(isClassCode_exist === true);

                                                                                        let profile_initials = class_name[0];

                                                                                        let result2 = await db_query.create_new_class(new_classcode_value, user_id, class_name, class_subject, class_room, class_section, profile_initials.toUpperCase(), '/images/class_background_images/backtoschool.jpg');

                                                                                        if (result2.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (result2.status === true){
                                                                                            fs.mkdirSync(`public/class_folders/${new_classcode_value}`);
                                                                                            fs.mkdirSync(`public/class_folders/${new_classcode_value}/public`);
                                                                                            fs.mkdirSync(`public/class_folders/${new_classcode_value}/public/attachments`);
                                                                                            fs.mkdirSync(`public/class_folders/${new_classcode_value}/public/attachments/${user_id}`);

                                                                                            let result = await db_query.fetch_created_classes_by_teacher(user_id);

                                                                                            if (result.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result.status === true){
                                                                                                if (result.data.length > 0){
                                                                                                    var created_classes = result.data;
                                                                                                    var active_classes = [];

                                                                                                    for (let [i, record] of created_classes.entries()){
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
                                                                                                                        class_data['id'] = i;
                                                                                                                        class_data['creators_user_id'] = user_id;
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
                                                                                                        res.statusCode = 200;
                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                        res.json({ status: 'class_created_successfully', class_code: new_classcode_value, token_info: 'token_available', new_accessToken: new_access_token, details: active_classes });
                                                                                                    } else {
                                                                                                        res.statusCode = 200;
                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                        res.json({ status: 'class_created_successfully', class_code: new_classcode_value, token_info: 'token_available', new_accessToken: new_access_token, details: [] });
                                                                                                    }
                                                                                                } else {
                                                                                                    res.statusCode = 200;
                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                    res.json({ status: 'class_created_successfully', class_code: new_classcode_value, token_info: 'token_available', new_accessToken: new_access_token, details: [] });
                                                                                                }
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
                                                                        let status = user.status;

                                                                        if (status === 'user_direct_access_token'){
                                                                            let user_auth_id = user.user_id; //Users authentication id

                                                                            let result = await db_query.check_if_account_verified(user_auth_id);

                                                                            if (result.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (result.status === true){
                                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                                    let result = await db_query.check_if_teacher_account(user_auth_id);

                                                                                    if (result.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (result.status === true){
                                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                                            let isClassCode_exist = null;
                                                                                            let class_code_length = [ 8, 12 ];
                                                                                            let new_classcode_value = '';

                                                                                            do {
                                                                                                let random = Math.floor(Math.random() * class_code_length.length);
                                                                                                let no_of_characters_for_class_code = class_code_length[random];
                                                                                                let new_class_code = generate_class_code(no_of_characters_for_class_code);
                                                    
                                                                                                let result1 = await db_query.check_if_class_exists(new_class_code);
                                                    
                                                                                                if (result1.data.length > 0){
                                                                                                    isClassCode_exist = true;
                                                                                                } else if (result1.data.length === 0){
                                                                                                    new_classcode_value = new_class_code;
                                                                                                    isClassCode_exist = false;
                                                                                                }
                                                                                            } while(isClassCode_exist === true);

                                                                                            let profile_initials = class_name[0];

                                                                                            let result2 = await db_query.create_new_class(new_classcode_value, user_auth_id, class_name, class_subject, class_room, class_section, profile_initials.toUpperCase(), '/images/class_background_images/backtoschool.jpg');

                                                                                            if (result2.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result2.status === true){
                                                                                                fs.mkdirSync(`public/class_folders/${new_classcode_value}`);
                                                                                                fs.mkdirSync(`public/class_folders/${new_classcode_value}/public`);
                                                                                                fs.mkdirSync(`public/class_folders/${new_classcode_value}/public/attachments`);
                                                                                                fs.mkdirSync(`public/class_folders/${new_classcode_value}/public/attachments/${user_auth_id}`);

                                                                                                let result = await db_query.fetch_created_classes_by_teacher(user_auth_id);

                                                                                                if (result.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result.status === true){
                                                                                                    if (result.data.length > 0){
                                                                                                        var created_classes = result.data;
                                                                                                        var active_classes = [];

                                                                                                        for (let [i, record] of created_classes.entries()){
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
                                                                                                                            class_data['id'] = i;
                                                                                                                            class_data['creators_user_id'] = user_auth_id;
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
                                                                                                            res.statusCode = 200;
                                                                                                            res.json({ status: 'class_created_successfully', class_code: new_classcode_value, token_info: 'no_token', details: active_classes });
                                                                                                        } else {
                                                                                                            res.statusCode = 200;
                                                                                                            res.json({ status: 'class_created_successfully', class_code: new_classcode_value, token_info: 'no_token', details: [] });
                                                                                                        }
                                                                                                    } else {
                                                                                                        res.statusCode = 200;
                                                                                                        res.json({ status: 'class_created_successfully', class_code: new_classcode_value, token_info: 'no_token', details: [] });
                                                                                                    }
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

module.exports = create_new_class;