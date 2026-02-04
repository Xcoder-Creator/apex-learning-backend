const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db model
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header
const moment = require('moment'); //Import moment module

const fetch_post = async (req, res) => {
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
            if (form_data.access_token && form_data.class_code && form_data.offset){
                //Filter and sanitize the form data
                let access_token = sanitize_data(form_data.access_token);
                let class_code = sanitize_data(form_data.class_code);
                let offset = parseInt(form_data.offset, 10);

                //Validate form data
                if (/^ *$/.test(access_token)){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    if (/^ *$/.test(class_code)){
                        res.statusCode = 401;
                        res.json({ status: 'missing_credentials' });
                    } else {
                        if (/^ *$/.test(offset)){
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
                                                                    let result = await db_query.check_if_teacher_account(user_id);

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
                                                                                    let result = await db_query.check_if_teacher_of_class(user_id, class_code);

                                                                                    if (result.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (result.status === true){
                                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                                            let result = await db_query.fetch_class_posts(class_code, offset); //Fetch 4 class posts from the database

                                                                                            if (result.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result.status === true){
                                                                                                if (result.data.length > 0){
                                                                                                    var class_posts = result.data;
                                                                                                    var formatted_class_posts = [];

                                                                                                    for (let [i, post] of class_posts.entries()){
                                                                                                        let post_id = post.post_id;
                                                                                                        let post_creation_date = post.post_creation_date;
                                                                                                        let post_data_content = post.post_data;
                                                                                                        let post_creators_id = post.creators_user_id;

                                                                                                        if (post.post_type === 'plain_post'){
                                                                                                            let post_type = post.post_type;
                                                                                                            let result = await db_query.fetch_user_details(post_creators_id);

                                                                                                            if (result.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result.status === true){
                                                                                                                if (result.data.length === 1){
                                                                                                                    let user_name = result.data[0].name;
                                                                                                                    let user_profile_image = result.data[0].profile_image;

                                                                                                                    let post_object = {
                                                                                                                        id: post_id,
                                                                                                                        user_name: user_name,
                                                                                                                        post_creators_id: post_creators_id,
                                                                                                                        title: null,
                                                                                                                        post_due_date: null,
                                                                                                                        date: post_creation_date,
                                                                                                                        user_image: user_profile_image,
                                                                                                                        post_data: post_data_content,
                                                                                                                        post_point: null,
                                                                                                                        post_comments: [],
                                                                                                                        post_type: post_type,
                                                                                                                        submit_assignment_attachment: {
                                                                                                                            file_name: null,
                                                                                                                            file_url: null
                                                                                                                        },
                                                                                                                        added_att: false,
                                                                                                                        assignment_status: null,
                                                                                                                        score_value: null,
                                                                                                                        att_files: null,
                                                                                                                        new_material_files: null
                                                                                                                    };

                                                                                                                    let result1 = await db_query.fetch_comments_for_post(post_id, class_code);

                                                                                                                    if (result1.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result1.status === true){
                                                                                                                        if (result1.data.length >= 1){
                                                                                                                            let available_comments = result1.data;
                                                                                                                            let class_comments = [];

                                                                                                                            for (let [i2, comment] of available_comments.entries()){
                                                                                                                                let user_id_value  = comment.creators_user_id;
                                                                                                                                let key = i2;
                                                                                                                                let comment_data = comment.comment_data;
                                                                                                                                let creation_date = comment.creation_date;

                                                                                                                                let result2 = await db_query.check_if_account_verified(user_id_value);

                                                                                                                                if (result2.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result2.status === true){
                                                                                                                                    if (result2.data.length > 0 && result2.data.length === 1){
                                                                                                                                        let name = result2.data[0].name;
                                                                                                                                        let profile_image = result2.data[0].profile_image;
                                                                                                                                        let crafted_comment = {
                                                                                                                                            name: name,
                                                                                                                                            key: key,
                                                                                                                                            post_id: post_id,
                                                                                                                                            user_id: user_id_value,
                                                                                                                                            profile_img: profile_image,
                                                                                                                                            date: creation_date,
                                                                                                                                            comment_data: comment_data
                                                                                                                                        }
                                                                                                                                        class_comments.push(crafted_comment);
                                                                                                                                        post_object.post_comments = class_comments;
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }

                                                                                                                            formatted_class_posts.push(post_object);
                                                                                                                        } else {
                                                                                                                            post_object.post_comments = [];
                                                                                                                            formatted_class_posts.push(post_object);
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        } else if (post.post_type === 'post_with_attachment'){
                                                                                                            let post_type = post.post_type;
                                                                                                            let result = await db_query.fetch_user_details(post_creators_id);

                                                                                                            if (result.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result.status === true){
                                                                                                                if (result.data.length === 1){
                                                                                                                    let user_name = result.data[0].name;
                                                                                                                    let user_profile_image = result.data[0].profile_image;

                                                                                                                    let result2 = await db_query.fetch_attached_files(post_id);

                                                                                                                    if (result2.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result2.status === true){
                                                                                                                        var attached_files = result2.data;
                                                                                                                        var file_att_array = [];

                                                                                                                        for (let [i, file_obj] of attached_files.entries()){
                                                                                                                            var id = i;
                                                                                                                            var file_name = file_obj.file_name;
                                                                                                                            var file_type = file_obj.file_mimetype;
                                                                                                                            var file_size_x = file_obj.file_size;
                                                                                                                            let post_id = file_obj.post_id;
                                                                                                                            let result3 = await db_query.fetch_particular_post(post_id);

                                                                                                                            if (result3.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (result3.status === true){
                                                                                                                                let post_data = result3.data;
                                                                                                                                var post_creation_date_x = post_data[0].post_creation_date;
                                                                                                                                var post_creation_time_x = post_data[0].post_creation_time;
                                                                                                                                var user_id_value = post_data[0].creators_user_id;
                                                                                                                            }

                                                                                                                            var file_url = `${process.env.API_URL}/class_folders/${class_code}/public/attachments/${user_id_value}/${file_name}`;
                                                                                                                            file_att_array.push({ id: id, file_name: file_name, file_type: file_type, file_url: file_url, file_size: file_size_x, post_creation_date: post_creation_date_x, post_creation_time: post_creation_time_x });
                                                                                                                        }

                                                                                                                        let post_object = {
                                                                                                                            id: post_id,
                                                                                                                            user_name: user_name,
                                                                                                                            post_creators_id: post_creators_id,
                                                                                                                            title: null,
                                                                                                                            post_due_date: null,
                                                                                                                            date: post_creation_date,
                                                                                                                            user_image: user_profile_image,
                                                                                                                            post_data: post_data_content,
                                                                                                                            post_point: null,
                                                                                                                            post_comments: [],
                                                                                                                            post_type: post_type,
                                                                                                                            submit_assignment_attachment: {
                                                                                                                                file_name: null,
                                                                                                                                file_url: null
                                                                                                                            },
                                                                                                                            added_att: false,
                                                                                                                            assignment_status: null,
                                                                                                                            score_value: null,
                                                                                                                            att_files: file_att_array,
                                                                                                                            new_material_files: null
                                                                                                                        };

                                                                                                                        let result1 = await db_query.fetch_comments_for_post(post_id, class_code);

                                                                                                                        if (result1.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result1.status === true){
                                                                                                                            if (result1.data.length >= 1){
                                                                                                                                let available_comments = result1.data;
                                                                                                                                let class_comments = [];

                                                                                                                                for (let [i2, comment] of available_comments.entries()){
                                                                                                                                    let user_id_value  = comment.creators_user_id;
                                                                                                                                    let key = i2;
                                                                                                                                    let comment_data = comment.comment_data;
                                                                                                                                    let creation_date = comment.creation_date;

                                                                                                                                    let result2 = await db_query.check_if_account_verified(user_id_value);

                                                                                                                                    if (result2.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result2.status === true){
                                                                                                                                        if (result2.data.length > 0 && result2.data.length === 1){
                                                                                                                                            let name = result2.data[0].name;
                                                                                                                                            let profile_image = result2.data[0].profile_image;
                                                                                                                                            let crafted_comment = {
                                                                                                                                                name: name,
                                                                                                                                                key: key,
                                                                                                                                                post_id: post_id,
                                                                                                                                                user_id: user_id_value,
                                                                                                                                                profile_img: profile_image,
                                                                                                                                                date: creation_date,
                                                                                                                                                comment_data: comment_data
                                                                                                                                            }
                                                                                                                                            class_comments.push(crafted_comment);
                                                                                                                                            post_object.post_comments = class_comments;
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }

                                                                                                                                formatted_class_posts.push(post_object);
                                                                                                                            } else {
                                                                                                                                post_object.post_comments = [];
                                                                                                                                formatted_class_posts.push(post_object);
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }

                                                                                                    let all_class_posts = await db_query.fetch_all_posts_for_a_class(class_code);

                                                                                                    if (all_class_posts.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (all_class_posts.status === true){
                                                                                                        let class_posts_length = all_class_posts.data.length;

                                                                                                        let resultxc = await db_query.fetch_all_classworks_asc(class_code);

                                                                                                        if (resultxc.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (resultxc.status === true){
                                                                                                            if (resultxc.data.length >= 1){
                                                                                                                let all_classworks = resultxc.data;
                                                                                                                let index_of_latest_classwork = all_classworks.length - 1;
                                                                                                                let latest_classwork = all_classworks[index_of_latest_classwork];
                                                                                                                let due_date = latest_classwork.date_format;
                                                                                                                let due_time = latest_classwork.due_time;

                                                                                                                let current_date = moment().format("YYYY-MM-DD");
                                                                                                                let current_time = moment().format('h:mm a');

                                                                                                                if (moment(current_date).isSame(due_date)){
                                                                                                                    condition = 1;
                                                                                                                } else if (moment(current_date).isBefore(due_date)){
                                                                                                                    condition = 2;
                                                                                                                } else {
                                                                                                                    condition = 3;
                                                                                                                }
            
                                                                                                                if (condition === 1){
                                                                                                                    if (moment(current_time, 'h:mm a').isBefore(moment(due_time, 'h:mm a'))){
                                                                                                                        res.statusCode = 200;
                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                        res.json({ status: 'posts_available', classwork_available: true, classwork_data: latest_classwork, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                    } else {
                                                                                                                        res.statusCode = 200;
                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                        res.json({ status: 'posts_available', classwork_available: false, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                    }
                                                                                                                } else if (condition === 2){
                                                                                                                    res.statusCode = 200;
                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                    res.json({ status: 'posts_available', classwork_available: true, classwork_data: latest_classwork, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                } else if (condition === 3){
                                                                                                                    res.statusCode = 200;
                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                    res.json({ status: 'posts_available', classwork_available: false, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                }
                                                                                                            } else {
                                                                                                                res.statusCode = 200;
                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                res.json({ status: 'posts_available', classwork_available: false, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                } else if (result.data.length === 0){
                                                                                                    let all_class_posts = await db_query.fetch_all_posts_for_a_class(class_code);

                                                                                                    if (all_class_posts.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (all_class_posts.status === true){
                                                                                                        let class_posts_length = all_class_posts.data.length;

                                                                                                        let resultxc = await db_query.fetch_all_classworks_asc(class_code);

                                                                                                        if (resultxc.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (resultxc.status === true){
                                                                                                            if (resultxc.data.length >= 1){
                                                                                                                let all_classworks = resultxc.data;
                                                                                                                let index_of_latest_classwork = all_classworks.length - 1;
                                                                                                                let latest_classwork = all_classworks[index_of_latest_classwork];
                                                                                                                let due_date = latest_classwork.date_format;
                                                                                                                let due_time = latest_classwork.due_time;

                                                                                                                let current_date = moment().format("YYYY-MM-DD");
                                                                                                                let current_time = moment().format('h:mm a');

                                                                                                                if (moment(current_date).isSame(due_date)){
                                                                                                                    condition = 1;
                                                                                                                } else if (moment(current_date).isBefore(due_date)){
                                                                                                                    condition = 2;
                                                                                                                } else {
                                                                                                                    condition = 3;
                                                                                                                }

                                                                                                                if (condition === 1){
                                                                                                                    if (moment(current_time, 'h:mm a').isBefore(moment(due_time, 'h:mm a'))){
                                                                                                                        res.statusCode = 200;
                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                        res.json({ status: 'no_posts', classwork_available: true, classwork_data: latest_classwork, class_posts: [], token_info: 'token_available', total_posts_length: class_posts_length, new_accessToken: new_access_token });
                                                                                                                    } else {
                                                                                                                        res.statusCode = 200;
                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                        res.json({ status: 'no_posts', classwork_available: false, class_posts: [], token_info: 'token_available', total_posts_length: class_posts_length, new_accessToken: new_access_token });
                                                                                                                    }
                                                                                                                } else if (condition === 2){
                                                                                                                    res.statusCode = 200;
                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                    res.json({ status: 'no_posts', classwork_available: true, classwork_data: latest_classwork, class_posts: [], token_info: 'token_available', total_posts_length: class_posts_length, new_accessToken: new_access_token });
                                                                                                                } else if (condition === 3){
                                                                                                                    res.statusCode = 200;
                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                    res.json({ status: 'no_posts', classwork_available: false, class_posts: [], token_info: 'token_available', total_posts_length: class_posts_length, new_accessToken: new_access_token });
                                                                                                                }
                                                                                                            } else {
                                                                                                                res.statusCode = 200;
                                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                res.json({ status: 'no_posts', classwork_available: false, class_posts: [], token_info: 'token_available', total_posts_length: class_posts_length, new_accessToken: new_access_token });
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            }
                                                                                        } else if (result.data.length === 0){
                                                                                            res.statusCode = 401;
                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                            res.json({ status: 'not_teacher_of_class', token_info: 'token_available', new_accessToken: new_access_token });
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
                                                                                let result = await db_query.fetch_all_active_class_details(class_code);

                                                                                if (result.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (result.status === true){
                                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                                        let result = await db_query.check_if_teacher_of_class(user_auth_id, class_code);

                                                                                        if (result.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (result.status === true){
                                                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                                                let result = await db_query.fetch_class_posts(class_code, offset); //Fetch 4 class posts from the database

                                                                                                if (result.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result.status === true){
                                                                                                    if (result.data.length > 0){
                                                                                                        var class_posts = result.data;
                                                                                                        var formatted_class_posts = [];
    
                                                                                                        for (let [i, post] of class_posts.entries()){
                                                                                                            let post_id = post.post_id;
                                                                                                            let post_creation_date = post.post_creation_date;
                                                                                                            let post_data_content = post.post_data;
                                                                                                            let post_creators_id = post.creators_user_id;
    
                                                                                                            if (post.post_type === 'plain_post'){
                                                                                                                let post_type = post.post_type;
                                                                                                                let result = await db_query.fetch_user_details(post_creators_id);
    
                                                                                                                if (result.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result.status === true){
                                                                                                                    if (result.data.length === 1){
                                                                                                                        let user_name = result.data[0].name;
                                                                                                                        let user_profile_image = result.data[0].profile_image;
    
                                                                                                                        let post_object = {
                                                                                                                            id: post_id,
                                                                                                                            user_name: user_name,
                                                                                                                            post_creators_id: post_creators_id,
                                                                                                                            title: null,
                                                                                                                            post_due_date: null,
                                                                                                                            date: post_creation_date,
                                                                                                                            user_image: user_profile_image,
                                                                                                                            post_data: post_data_content,
                                                                                                                            post_point: null,
                                                                                                                            post_comments: [],
                                                                                                                            post_type: post_type,
                                                                                                                            submit_assignment_attachment: {
                                                                                                                                file_name: null,
                                                                                                                                file_url: null
                                                                                                                            },
                                                                                                                            added_att: false,
                                                                                                                            assignment_status: null,
                                                                                                                            score_value: null,
                                                                                                                            att_files: null,
                                                                                                                            new_material_files: null
                                                                                                                        };
    
                                                                                                                        let result1 = await db_query.fetch_comments_for_post(post_id, class_code);
    
                                                                                                                        if (result1.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result1.status === true){
                                                                                                                            if (result1.data.length >= 1){
                                                                                                                                let available_comments = result1.data;
                                                                                                                                let class_comments = [];
    
                                                                                                                                for (let [i2, comment] of available_comments.entries()){
                                                                                                                                    let user_id_value  = comment.creators_user_id;
                                                                                                                                    let key = i2;
                                                                                                                                    let comment_data = comment.comment_data;
                                                                                                                                    let creation_date = comment.creation_date;
    
                                                                                                                                    let result2 = await db_query.check_if_account_verified(user_id_value);
    
                                                                                                                                    if (result2.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result2.status === true){
                                                                                                                                        if (result2.data.length > 0 && result2.data.length === 1){
                                                                                                                                            let name = result2.data[0].name;
                                                                                                                                            let profile_image = result2.data[0].profile_image;
                                                                                                                                            let crafted_comment = {
                                                                                                                                                name: name,
                                                                                                                                                key: key,
                                                                                                                                                post_id: post_id,
                                                                                                                                                user_id: user_id_value,
                                                                                                                                                profile_img: profile_image,
                                                                                                                                                date: creation_date,
                                                                                                                                                comment_data: comment_data
                                                                                                                                            }
                                                                                                                                            class_comments.push(crafted_comment);
                                                                                                                                            post_object.post_comments = class_comments;
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
    
                                                                                                                                formatted_class_posts.push(post_object);
                                                                                                                            } else {
                                                                                                                                post_object.post_comments = [];
                                                                                                                                formatted_class_posts.push(post_object);
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            } else if (post.post_type === 'post_with_attachment'){
                                                                                                                let post_type = post.post_type;
                                                                                                                let result = await db_query.fetch_user_details(post_creators_id);
    
                                                                                                                if (result.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result.status === true){
                                                                                                                    if (result.data.length === 1){
                                                                                                                        let user_name = result.data[0].name;
                                                                                                                        let user_profile_image = result.data[0].profile_image;
    
                                                                                                                        let result2 = await db_query.fetch_attached_files(post_id);
    
                                                                                                                        if (result2.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result2.status === true){
                                                                                                                            var attached_files = result2.data;
                                                                                                                            var file_att_array = [];
    
                                                                                                                            for (let [i, file_obj] of attached_files.entries()){
                                                                                                                                var id = i;
                                                                                                                                var file_name = file_obj.file_name;
                                                                                                                                var file_type = file_obj.file_mimetype;
                                                                                                                                var file_size_x = file_obj.file_size;
                                                                                                                                let post_id = file_obj.post_id;
                                                                                                                                let result3 = await db_query.fetch_particular_post(post_id);
    
                                                                                                                                if (result3.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result3.status === true){
                                                                                                                                    let post_data = result3.data;
                                                                                                                                    var post_creation_date_x = post_data[0].post_creation_date;
                                                                                                                                    var post_creation_time_x = post_data[0].post_creation_time;
                                                                                                                                    var user_id_value = post_data[0].creators_user_id;
                                                                                                                                }
    
                                                                                                                                var file_url = `${process.env.API_URL}/class_folders/${class_code}/public/attachments/${user_id_value}/${file_name}`;
                                                                                                                                file_att_array.push({ id: id, file_name: file_name, file_type: file_type, file_url: file_url, file_size: file_size_x, post_creation_date: post_creation_date_x, post_creation_time: post_creation_time_x });
                                                                                                                            }
    
                                                                                                                            let post_object = {
                                                                                                                                id: post_id,
                                                                                                                                user_name: user_name,
                                                                                                                                post_creators_id: post_creators_id,
                                                                                                                                title: null,
                                                                                                                                post_due_date: null,
                                                                                                                                date: post_creation_date,
                                                                                                                                user_image: user_profile_image,
                                                                                                                                post_data: post_data_content,
                                                                                                                                post_point: null,
                                                                                                                                post_comments: [],
                                                                                                                                post_type: post_type,
                                                                                                                                submit_assignment_attachment: {
                                                                                                                                    file_name: null,
                                                                                                                                    file_url: null
                                                                                                                                },
                                                                                                                                added_att: false,
                                                                                                                                assignment_status: null,
                                                                                                                                score_value: null,
                                                                                                                                att_files: file_att_array,
                                                                                                                                new_material_files: null
                                                                                                                            };
    
                                                                                                                            let result1 = await db_query.fetch_comments_for_post(post_id, class_code);
    
                                                                                                                            if (result1.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (result1.status === true){
                                                                                                                                if (result1.data.length >= 1){
                                                                                                                                    let available_comments = result1.data;
                                                                                                                                    let class_comments = [];
    
                                                                                                                                    for (let [i2, comment] of available_comments.entries()){
                                                                                                                                        let user_id_value  = comment.creators_user_id;
                                                                                                                                        let key = i2;
                                                                                                                                        let comment_data = comment.comment_data;
                                                                                                                                        let creation_date = comment.creation_date;
    
                                                                                                                                        let result2 = await db_query.check_if_account_verified(user_id_value);
    
                                                                                                                                        if (result2.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result2.status === true){
                                                                                                                                            if (result2.data.length > 0 && result2.data.length === 1){
                                                                                                                                                let name = result2.data[0].name;
                                                                                                                                                let profile_image = result2.data[0].profile_image;
                                                                                                                                                let crafted_comment = {
                                                                                                                                                    name: name,
                                                                                                                                                    key: key,
                                                                                                                                                    post_id: post_id,
                                                                                                                                                    user_id: user_id_value,
                                                                                                                                                    profile_img: profile_image,
                                                                                                                                                    date: creation_date,
                                                                                                                                                    comment_data: comment_data
                                                                                                                                                }
                                                                                                                                                class_comments.push(crafted_comment);
                                                                                                                                                post_object.post_comments = class_comments;
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
    
                                                                                                                                    formatted_class_posts.push(post_object);
                                                                                                                                } else {
                                                                                                                                    post_object.post_comments = [];
                                                                                                                                    formatted_class_posts.push(post_object);
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        }
    
                                                                                                        let all_class_posts = await db_query.fetch_all_posts_for_a_class(class_code);
    
                                                                                                        if (all_class_posts.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (all_class_posts.status === true){
                                                                                                            let class_posts_length = all_class_posts.data.length;
    
                                                                                                            let resultxc = await db_query.fetch_all_classworks_asc(class_code);
    
                                                                                                            if (resultxc.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (resultxc.status === true){
                                                                                                                if (resultxc.data.length >= 1){
                                                                                                                    let all_classworks = resultxc.data;
                                                                                                                    let index_of_latest_classwork = all_classworks.length - 1;
                                                                                                                    let latest_classwork = all_classworks[index_of_latest_classwork];
                                                                                                                    let due_date = latest_classwork.date_format;
                                                                                                                    let due_time = latest_classwork.due_time;
    
                                                                                                                    let current_date = moment().format("YYYY-MM-DD");
                                                                                                                    let current_time = moment().format('h:mm a');
    
                                                                                                                    if (moment(current_date).isSame(due_date)){
                                                                                                                        condition = 1;
                                                                                                                    } else if (moment(current_date).isBefore(due_date)){
                                                                                                                        condition = 2;
                                                                                                                    } else {
                                                                                                                        condition = 3;
                                                                                                                    }
                
                                                                                                                    if (condition === 1){
                                                                                                                        if (moment(current_time, 'h:mm a').isBefore(moment(due_time, 'h:mm a'))){
                                                                                                                            res.statusCode = 200;
                                                                                                                    
                                                                                                                            res.json({ status: 'posts_available', classwork_available: true, classwork_data: latest_classwork, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'no_token' });
                                                                                                                        } else {
                                                                                                                            res.statusCode = 200;
                                                                                                                            
                                                                                                                            res.json({ status: 'posts_available', classwork_available: false, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'no_token' });
                                                                                                                        }
                                                                                                                    } else if (condition === 2){
                                                                                                                        res.statusCode = 200;
                                                                                                                        
                                                                                                                        res.json({ status: 'posts_available', classwork_available: true, classwork_data: latest_classwork, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'no_token' });
                                                                                                                    } else if (condition === 3){
                                                                                                                        res.statusCode = 200;
                                                                                                                        
                                                                                                                        res.json({ status: 'posts_available', classwork_available: false, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'no_token' });
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    res.statusCode = 200;
                                                                                                                    
                                                                                                                    res.json({ status: 'posts_available', classwork_available: false, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'no_token' });
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    } else if (result.data.length === 0){
                                                                                                        let all_class_posts = await db_query.fetch_all_posts_for_a_class(class_code);
    
                                                                                                        if (all_class_posts.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (all_class_posts.status === true){
                                                                                                            let class_posts_length = all_class_posts.data.length;
    
                                                                                                            let resultxc = await db_query.fetch_all_classworks_asc(class_code);
    
                                                                                                            if (resultxc.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (resultxc.status === true){
                                                                                                                if (resultxc.data.length >= 1){
                                                                                                                    let all_classworks = resultxc.data;
                                                                                                                    let index_of_latest_classwork = all_classworks.length - 1;
                                                                                                                    let latest_classwork = all_classworks[index_of_latest_classwork];
                                                                                                                    let due_date = latest_classwork.date_format;
                                                                                                                    let due_time = latest_classwork.due_time;
    
                                                                                                                    let current_date = moment().format("YYYY-MM-DD");
                                                                                                                    let current_time = moment().format('h:mm a');
    
                                                                                                                    if (moment(current_date).isSame(due_date)){
                                                                                                                        condition = 1;
                                                                                                                    } else if (moment(current_date).isBefore(due_date)){
                                                                                                                        condition = 2;
                                                                                                                    } else {
                                                                                                                        condition = 3;
                                                                                                                    }
    
                                                                                                                    if (condition === 1){
                                                                                                                        if (moment(current_time, 'h:mm a').isBefore(moment(due_time, 'h:mm a'))){
                                                                                                                            res.statusCode = 200;
                                                                                                                            
                                                                                                                            res.json({ status: 'no_posts', classwork_available: true, classwork_data: latest_classwork, class_posts: [], token_info: 'no_token', total_posts_length: class_posts_length });
                                                                                                                        } else {
                                                                                                                            res.statusCode = 200;
                                                                                                                            
                                                                                                                            res.json({ status: 'no_posts', classwork_available: false, class_posts: [], token_info: 'no_token', total_posts_length: class_posts_length });
                                                                                                                        }
                                                                                                                    } else if (condition === 2){
                                                                                                                        res.statusCode = 200;
                                                                                                                        
                                                                                                                        res.json({ status: 'no_posts', classwork_available: true, classwork_data: latest_classwork, class_posts: [], token_info: 'no_token', total_posts_length: class_posts_length });
                                                                                                                    } else if (condition === 3){
                                                                                                                        res.statusCode = 200;
                                                                                                                        
                                                                                                                        res.json({ status: 'no_posts', classwork_available: false, class_posts: [], token_info: 'no_token', total_posts_length: class_posts_length });
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    res.statusCode = 200;
                                                                                                                    
                                                                                                                    res.json({ status: 'no_posts', classwork_available: false, class_posts: [], token_info: 'no_token', total_posts_length: class_posts_length });
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            } else if (result.data.length === 0){
                                                                                                res.statusCode = 401;
                                                                                                res.json({ status: 'not_teacher_of_class', token_info: 'no_token' });
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
            if (form_data.class_code && form_data.offset){
                //Filter and sanitize the access token and class code
                let class_code = sanitize_data(form_data.class_code);
                let offset = parseInt(form_data.offset, 10);

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
                                if (/^ *$/.test(offset)){
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
                                                                                                let result = await db_query.fetch_class_posts(class_code, offset); //Fetch 4 class posts from the database

                                                                                                if (result.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result.status === true){
                                                                                                    if (result.data.length > 0){
                                                                                                        var class_posts = result.data;
                                                                                                        var formatted_class_posts = [];
    
                                                                                                        for (let [i, post] of class_posts.entries()){
                                                                                                            let post_id = post.post_id;
                                                                                                            let post_creation_date = post.post_creation_date;
                                                                                                            let post_data_content = post.post_data;
                                                                                                            let post_creators_id = post.creators_user_id;
    
                                                                                                            if (post.post_type === 'plain_post'){
                                                                                                                let post_type = post.post_type;
                                                                                                                let result = await db_query.fetch_user_details(post_creators_id);
    
                                                                                                                if (result.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result.status === true){
                                                                                                                    if (result.data.length === 1){
                                                                                                                        let user_name = result.data[0].name;
                                                                                                                        let user_profile_image = result.data[0].profile_image;
    
                                                                                                                        let post_object = {
                                                                                                                            id: post_id,
                                                                                                                            user_name: user_name,
                                                                                                                            post_creators_id: post_creators_id,
                                                                                                                            title: null,
                                                                                                                            post_due_date: null,
                                                                                                                            date: post_creation_date,
                                                                                                                            user_image: user_profile_image,
                                                                                                                            post_data: post_data_content,
                                                                                                                            post_point: null,
                                                                                                                            post_comments: [],
                                                                                                                            post_type: post_type,
                                                                                                                            submit_assignment_attachment: {
                                                                                                                                file_name: null,
                                                                                                                                file_url: null
                                                                                                                            },
                                                                                                                            added_att: false,
                                                                                                                            assignment_status: null,
                                                                                                                            score_value: null,
                                                                                                                            att_files: null,
                                                                                                                            new_material_files: null
                                                                                                                        };
    
                                                                                                                        let result1 = await db_query.fetch_comments_for_post(post_id, class_code);
    
                                                                                                                        if (result1.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result1.status === true){
                                                                                                                            if (result1.data.length >= 1){
                                                                                                                                let available_comments = result1.data;
                                                                                                                                let class_comments = [];
    
                                                                                                                                for (let [i2, comment] of available_comments.entries()){
                                                                                                                                    let user_id_value  = comment.creators_user_id;
                                                                                                                                    let key = i2;
                                                                                                                                    let comment_data = comment.comment_data;
                                                                                                                                    let creation_date = comment.creation_date;
    
                                                                                                                                    let result2 = await db_query.check_if_account_verified(user_id_value);
    
                                                                                                                                    if (result2.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result2.status === true){
                                                                                                                                        if (result2.data.length > 0 && result2.data.length === 1){
                                                                                                                                            let name = result2.data[0].name;
                                                                                                                                            let profile_image = result2.data[0].profile_image;
                                                                                                                                            let crafted_comment = {
                                                                                                                                                name: name,
                                                                                                                                                key: key,
                                                                                                                                                post_id: post_id,
                                                                                                                                                user_id: user_id_value,
                                                                                                                                                profile_img: profile_image,
                                                                                                                                                date: creation_date,
                                                                                                                                                comment_data: comment_data
                                                                                                                                            }
                                                                                                                                            class_comments.push(crafted_comment);
                                                                                                                                            post_object.post_comments = class_comments;
                                                                                                                                        }
                                                                                                                                    }
                                                                                                                                }
    
                                                                                                                                formatted_class_posts.push(post_object);
                                                                                                                            } else {
                                                                                                                                post_object.post_comments = [];
                                                                                                                                formatted_class_posts.push(post_object);
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            } else if (post.post_type === 'post_with_attachment'){
                                                                                                                let post_type = post.post_type;
                                                                                                                let result = await db_query.fetch_user_details(post_creators_id);
    
                                                                                                                if (result.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result.status === true){
                                                                                                                    if (result.data.length === 1){
                                                                                                                        let user_name = result.data[0].name;
                                                                                                                        let user_profile_image = result.data[0].profile_image;
    
                                                                                                                        let result2 = await db_query.fetch_attached_files(post_id);
    
                                                                                                                        if (result2.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result2.status === true){
                                                                                                                            var attached_files = result2.data;
                                                                                                                            var file_att_array = [];
    
                                                                                                                            for (let [i, file_obj] of attached_files.entries()){
                                                                                                                                var id = i;
                                                                                                                                var file_name = file_obj.file_name;
                                                                                                                                var file_type = file_obj.file_mimetype;
                                                                                                                                var file_size_x = file_obj.file_size;
                                                                                                                                let post_id = file_obj.post_id;
                                                                                                                                let result3 = await db_query.fetch_particular_post(post_id);
    
                                                                                                                                if (result3.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result3.status === true){
                                                                                                                                    let post_data = result3.data;
                                                                                                                                    var post_creation_date_x = post_data[0].post_creation_date;
                                                                                                                                    var post_creation_time_x = post_data[0].post_creation_time;
                                                                                                                                    var user_id_value = post_data[0].creators_user_id;
                                                                                                                                }
    
                                                                                                                                var file_url = `${process.env.API_URL}/class_folders/${class_code}/public/attachments/${user_id_value}/${file_name}`;
                                                                                                                                file_att_array.push({ id: id, file_name: file_name, file_type: file_type, file_url: file_url, file_size: file_size_x, post_creation_date: post_creation_date_x, post_creation_time: post_creation_time_x });
                                                                                                                            }
    
                                                                                                                            let post_object = {
                                                                                                                                id: post_id,
                                                                                                                                user_name: user_name,
                                                                                                                                post_creators_id: post_creators_id,
                                                                                                                                title: null,
                                                                                                                                post_due_date: null,
                                                                                                                                date: post_creation_date,
                                                                                                                                user_image: user_profile_image,
                                                                                                                                post_data: post_data_content,
                                                                                                                                post_point: null,
                                                                                                                                post_comments: [],
                                                                                                                                post_type: post_type,
                                                                                                                                submit_assignment_attachment: {
                                                                                                                                    file_name: null,
                                                                                                                                    file_url: null
                                                                                                                                },
                                                                                                                                added_att: false,
                                                                                                                                assignment_status: null,
                                                                                                                                score_value: null,
                                                                                                                                att_files: file_att_array,
                                                                                                                                new_material_files: null
                                                                                                                            };
    
                                                                                                                            let result1 = await db_query.fetch_comments_for_post(post_id, class_code);
    
                                                                                                                            if (result1.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (result1.status === true){
                                                                                                                                if (result1.data.length >= 1){
                                                                                                                                    let available_comments = result1.data;
                                                                                                                                    let class_comments = [];
    
                                                                                                                                    for (let [i2, comment] of available_comments.entries()){
                                                                                                                                        let user_id_value  = comment.creators_user_id;
                                                                                                                                        let key = i2;
                                                                                                                                        let comment_data = comment.comment_data;
                                                                                                                                        let creation_date = comment.creation_date;
    
                                                                                                                                        let result2 = await db_query.check_if_account_verified(user_id_value);
    
                                                                                                                                        if (result2.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result2.status === true){
                                                                                                                                            if (result2.data.length > 0 && result2.data.length === 1){
                                                                                                                                                let name = result2.data[0].name;
                                                                                                                                                let profile_image = result2.data[0].profile_image;
                                                                                                                                                let crafted_comment = {
                                                                                                                                                    name: name,
                                                                                                                                                    key: key,
                                                                                                                                                    post_id: post_id,
                                                                                                                                                    user_id: user_id_value,
                                                                                                                                                    profile_img: profile_image,
                                                                                                                                                    date: creation_date,
                                                                                                                                                    comment_data: comment_data
                                                                                                                                                }
                                                                                                                                                class_comments.push(crafted_comment);
                                                                                                                                                post_object.post_comments = class_comments;
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
    
                                                                                                                                    formatted_class_posts.push(post_object);
                                                                                                                                } else {
                                                                                                                                    post_object.post_comments = [];
                                                                                                                                    formatted_class_posts.push(post_object);
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        }
    
                                                                                                        let all_class_posts = await db_query.fetch_all_posts_for_a_class(class_code);
    
                                                                                                        if (all_class_posts.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (all_class_posts.status === true){
                                                                                                            let class_posts_length = all_class_posts.data.length;
    
                                                                                                            let resultxc = await db_query.fetch_all_classworks_asc(class_code);
    
                                                                                                            if (resultxc.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (resultxc.status === true){
                                                                                                                if (resultxc.data.length >= 1){
                                                                                                                    let all_classworks = resultxc.data;
                                                                                                                    let index_of_latest_classwork = all_classworks.length - 1;
                                                                                                                    let latest_classwork = all_classworks[index_of_latest_classwork];
                                                                                                                    let due_date = latest_classwork.date_format;
                                                                                                                    let due_time = latest_classwork.due_time;
    
                                                                                                                    let current_date = moment().format("YYYY-MM-DD");
                                                                                                                    let current_time = moment().format('h:mm a');
    
                                                                                                                    if (moment(current_date).isSame(due_date)){
                                                                                                                        condition = 1;
                                                                                                                    } else if (moment(current_date).isBefore(due_date)){
                                                                                                                        condition = 2;
                                                                                                                    } else {
                                                                                                                        condition = 3;
                                                                                                                    }
                
                                                                                                                    if (condition === 1){
                                                                                                                        if (moment(current_time, 'h:mm a').isBefore(moment(due_time, 'h:mm a'))){
                                                                                                                            res.statusCode = 200;
                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                            res.json({ status: 'posts_available', classwork_available: true, classwork_data: latest_classwork, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                        } else {
                                                                                                                            res.statusCode = 200;
                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                            res.json({ status: 'posts_available', classwork_available: false, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                        }
                                                                                                                    } else if (condition === 2){
                                                                                                                        res.statusCode = 200;
                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                        res.json({ status: 'posts_available', classwork_available: true, classwork_data: latest_classwork, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                    } else if (condition === 3){
                                                                                                                        res.statusCode = 200;
                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                        res.json({ status: 'posts_available', classwork_available: false, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    res.statusCode = 200;
                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                    res.json({ status: 'posts_available', classwork_available: false, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    } else if (result.data.length === 0){
                                                                                                        let all_class_posts = await db_query.fetch_all_posts_for_a_class(class_code);
    
                                                                                                        if (all_class_posts.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (all_class_posts.status === true){
                                                                                                            let class_posts_length = all_class_posts.data.length;
    
                                                                                                            let resultxc = await db_query.fetch_all_classworks_asc(class_code);
    
                                                                                                            if (resultxc.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (resultxc.status === true){
                                                                                                                if (resultxc.data.length >= 1){
                                                                                                                    let all_classworks = resultxc.data;
                                                                                                                    let index_of_latest_classwork = all_classworks.length - 1;
                                                                                                                    let latest_classwork = all_classworks[index_of_latest_classwork];
                                                                                                                    let due_date = latest_classwork.date_format;
                                                                                                                    let due_time = latest_classwork.due_time;
    
                                                                                                                    let current_date = moment().format("YYYY-MM-DD");
                                                                                                                    let current_time = moment().format('h:mm a');
    
                                                                                                                    if (moment(current_date).isSame(due_date)){
                                                                                                                        condition = 1;
                                                                                                                    } else if (moment(current_date).isBefore(due_date)){
                                                                                                                        condition = 2;
                                                                                                                    } else {
                                                                                                                        condition = 3;
                                                                                                                    }
    
                                                                                                                    if (condition === 1){
                                                                                                                        if (moment(current_time, 'h:mm a').isBefore(moment(due_time, 'h:mm a'))){
                                                                                                                            res.statusCode = 200;
                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                            res.json({ status: 'no_posts', classwork_available: true, classwork_data: latest_classwork, class_posts: [], token_info: 'token_available', total_posts_length: class_posts_length, new_accessToken: new_access_token });
                                                                                                                        } else {
                                                                                                                            res.statusCode = 200;
                                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                            res.json({ status: 'no_posts', classwork_available: false, class_posts: [], token_info: 'token_available', total_posts_length: class_posts_length, new_accessToken: new_access_token });
                                                                                                                        }
                                                                                                                    } else if (condition === 2){
                                                                                                                        res.statusCode = 200;
                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                        res.json({ status: 'no_posts', classwork_available: true, classwork_data: latest_classwork, class_posts: [], token_info: 'token_available', total_posts_length: class_posts_length, new_accessToken: new_access_token });
                                                                                                                    } else if (condition === 3){
                                                                                                                        res.statusCode = 200;
                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                        res.json({ status: 'no_posts', classwork_available: false, class_posts: [], token_info: 'token_available', total_posts_length: class_posts_length, new_accessToken: new_access_token });
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    res.statusCode = 200;
                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                    res.json({ status: 'no_posts', classwork_available: false, class_posts: [], token_info: 'token_available', total_posts_length: class_posts_length, new_accessToken: new_access_token });
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                }
                                                                                            } else if (result.data.length === 0){
                                                                                                res.statusCode = 401;
                                                                                                let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                res.json({ status: 'not_teacher_of_class', new_accessToken: new_access_token });
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
                                                                                res.json({ status: 'role_error'});
                                                                            }
                                                                        }
                                                                    } else {
                                                                        //User does not exist
                                                                        res.statusCode = 404;
                                                                        res.clearCookie('apex_auth'); // Clear apex auth cookie
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
                                                                                    let result = await db_query.fetch_all_active_class_details(class_code);

                                                                                    if (result.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (result.status === true){
                                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                                            let result = await db_query.check_if_teacher_of_class(user_auth_id, class_code);

                                                                                            if (result.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (result.status === true){
                                                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                                                    let result = await db_query.fetch_class_posts(class_code, offset); //Fetch 4 class posts from the database

                                                                                                    if (result.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result.status === true){
                                                                                                        if (result.data.length > 0){
                                                                                                            var class_posts = result.data;
                                                                                                            var formatted_class_posts = [];
        
                                                                                                            for (let [i, post] of class_posts.entries()){
                                                                                                                let post_id = post.post_id;
                                                                                                                let post_creation_date = post.post_creation_date;
                                                                                                                let post_data_content = post.post_data;
                                                                                                                let post_creators_id = post.creators_user_id;
        
                                                                                                                if (post.post_type === 'plain_post'){
                                                                                                                    let post_type = post.post_type;
                                                                                                                    let result = await db_query.fetch_user_details(post_creators_id);
        
                                                                                                                    if (result.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result.status === true){
                                                                                                                        if (result.data.length === 1){
                                                                                                                            let user_name = result.data[0].name;
                                                                                                                            let user_profile_image = result.data[0].profile_image;
        
                                                                                                                            let post_object = {
                                                                                                                                id: post_id,
                                                                                                                                user_name: user_name,
                                                                                                                                post_creators_id: post_creators_id,
                                                                                                                                title: null,
                                                                                                                                post_due_date: null,
                                                                                                                                date: post_creation_date,
                                                                                                                                user_image: user_profile_image,
                                                                                                                                post_data: post_data_content,
                                                                                                                                post_point: null,
                                                                                                                                post_comments: [],
                                                                                                                                post_type: post_type,
                                                                                                                                submit_assignment_attachment: {
                                                                                                                                    file_name: null,
                                                                                                                                    file_url: null
                                                                                                                                },
                                                                                                                                added_att: false,
                                                                                                                                assignment_status: null,
                                                                                                                                score_value: null,
                                                                                                                                att_files: null,
                                                                                                                                new_material_files: null
                                                                                                                            };
        
                                                                                                                            let result1 = await db_query.fetch_comments_for_post(post_id, class_code);
        
                                                                                                                            if (result1.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (result1.status === true){
                                                                                                                                if (result1.data.length >= 1){
                                                                                                                                    let available_comments = result1.data;
                                                                                                                                    let class_comments = [];
        
                                                                                                                                    for (let [i2, comment] of available_comments.entries()){
                                                                                                                                        let user_id_value  = comment.creators_user_id;
                                                                                                                                        let key = i2;
                                                                                                                                        let comment_data = comment.comment_data;
                                                                                                                                        let creation_date = comment.creation_date;
        
                                                                                                                                        let result2 = await db_query.check_if_account_verified(user_id_value);
        
                                                                                                                                        if (result2.status === false){
                                                                                                                                            res.statusCode = 500;
                                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                                        } else if (result2.status === true){
                                                                                                                                            if (result2.data.length > 0 && result2.data.length === 1){
                                                                                                                                                let name = result2.data[0].name;
                                                                                                                                                let profile_image = result2.data[0].profile_image;
                                                                                                                                                let crafted_comment = {
                                                                                                                                                    name: name,
                                                                                                                                                    key: key,
                                                                                                                                                    post_id: post_id,
                                                                                                                                                    user_id: user_id_value,
                                                                                                                                                    profile_img: profile_image,
                                                                                                                                                    date: creation_date,
                                                                                                                                                    comment_data: comment_data
                                                                                                                                                }
                                                                                                                                                class_comments.push(crafted_comment);
                                                                                                                                                post_object.post_comments = class_comments;
                                                                                                                                            }
                                                                                                                                        }
                                                                                                                                    }
        
                                                                                                                                    formatted_class_posts.push(post_object);
                                                                                                                                } else {
                                                                                                                                    post_object.post_comments = [];
                                                                                                                                    formatted_class_posts.push(post_object);
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                } else if (post.post_type === 'post_with_attachment'){
                                                                                                                    let post_type = post.post_type;
                                                                                                                    let result = await db_query.fetch_user_details(post_creators_id);
        
                                                                                                                    if (result.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result.status === true){
                                                                                                                        if (result.data.length === 1){
                                                                                                                            let user_name = result.data[0].name;
                                                                                                                            let user_profile_image = result.data[0].profile_image;
        
                                                                                                                            let result2 = await db_query.fetch_attached_files(post_id);
        
                                                                                                                            if (result2.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (result2.status === true){
                                                                                                                                var attached_files = result2.data;
                                                                                                                                var file_att_array = [];
        
                                                                                                                                for (let [i, file_obj] of attached_files.entries()){
                                                                                                                                    var id = i;
                                                                                                                                    var file_name = file_obj.file_name;
                                                                                                                                    var file_type = file_obj.file_mimetype;
                                                                                                                                    var file_size_x = file_obj.file_size;
                                                                                                                                    let post_id = file_obj.post_id;
                                                                                                                                    let result3 = await db_query.fetch_particular_post(post_id);
        
                                                                                                                                    if (result3.status === false){
                                                                                                                                        res.statusCode = 500;
                                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                                    } else if (result3.status === true){
                                                                                                                                        let post_data = result3.data;
                                                                                                                                        var post_creation_date_x = post_data[0].post_creation_date;
                                                                                                                                        var post_creation_time_x = post_data[0].post_creation_time;
                                                                                                                                        var user_id_value = post_data[0].creators_user_id;
                                                                                                                                    }
        
                                                                                                                                    var file_url = `${process.env.API_URL}/class_folders/${class_code}/public/attachments/${user_id_value}/${file_name}`;
                                                                                                                                    file_att_array.push({ id: id, file_name: file_name, file_type: file_type, file_url: file_url, file_size: file_size_x, post_creation_date: post_creation_date_x, post_creation_time: post_creation_time_x });
                                                                                                                                }
        
                                                                                                                                let post_object = {
                                                                                                                                    id: post_id,
                                                                                                                                    user_name: user_name,
                                                                                                                                    post_creators_id: post_creators_id,
                                                                                                                                    title: null,
                                                                                                                                    post_due_date: null,
                                                                                                                                    date: post_creation_date,
                                                                                                                                    user_image: user_profile_image,
                                                                                                                                    post_data: post_data_content,
                                                                                                                                    post_point: null,
                                                                                                                                    post_comments: [],
                                                                                                                                    post_type: post_type,
                                                                                                                                    submit_assignment_attachment: {
                                                                                                                                        file_name: null,
                                                                                                                                        file_url: null
                                                                                                                                    },
                                                                                                                                    added_att: false,
                                                                                                                                    assignment_status: null,
                                                                                                                                    score_value: null,
                                                                                                                                    att_files: file_att_array,
                                                                                                                                    new_material_files: null
                                                                                                                                };
        
                                                                                                                                let result1 = await db_query.fetch_comments_for_post(post_id, class_code);
        
                                                                                                                                if (result1.status === false){
                                                                                                                                    res.statusCode = 500;
                                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                                } else if (result1.status === true){
                                                                                                                                    if (result1.data.length >= 1){
                                                                                                                                        let available_comments = result1.data;
                                                                                                                                        let class_comments = [];
        
                                                                                                                                        for (let [i2, comment] of available_comments.entries()){
                                                                                                                                            let user_id_value  = comment.creators_user_id;
                                                                                                                                            let key = i2;
                                                                                                                                            let comment_data = comment.comment_data;
                                                                                                                                            let creation_date = comment.creation_date;
        
                                                                                                                                            let result2 = await db_query.check_if_account_verified(user_id_value);
        
                                                                                                                                            if (result2.status === false){
                                                                                                                                                res.statusCode = 500;
                                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                                            } else if (result2.status === true){
                                                                                                                                                if (result2.data.length > 0 && result2.data.length === 1){
                                                                                                                                                    let name = result2.data[0].name;
                                                                                                                                                    let profile_image = result2.data[0].profile_image;
                                                                                                                                                    let crafted_comment = {
                                                                                                                                                        name: name,
                                                                                                                                                        key: key,
                                                                                                                                                        post_id: post_id,
                                                                                                                                                        user_id: user_id_value,
                                                                                                                                                        profile_img: profile_image,
                                                                                                                                                        date: creation_date,
                                                                                                                                                        comment_data: comment_data
                                                                                                                                                    }
                                                                                                                                                    class_comments.push(crafted_comment);
                                                                                                                                                    post_object.post_comments = class_comments;
                                                                                                                                                }
                                                                                                                                            }
                                                                                                                                        }
        
                                                                                                                                        formatted_class_posts.push(post_object);
                                                                                                                                    } else {
                                                                                                                                        post_object.post_comments = [];
                                                                                                                                        formatted_class_posts.push(post_object);
                                                                                                                                    }
                                                                                                                                }
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                }
                                                                                                            }
        
                                                                                                            let all_class_posts = await db_query.fetch_all_posts_for_a_class(class_code);
        
                                                                                                            if (all_class_posts.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (all_class_posts.status === true){
                                                                                                                let class_posts_length = all_class_posts.data.length;
        
                                                                                                                let resultxc = await db_query.fetch_all_classworks_asc(class_code);
        
                                                                                                                if (resultxc.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (resultxc.status === true){
                                                                                                                    if (resultxc.data.length >= 1){
                                                                                                                        let all_classworks = resultxc.data;
                                                                                                                        let index_of_latest_classwork = all_classworks.length - 1;
                                                                                                                        let latest_classwork = all_classworks[index_of_latest_classwork];
                                                                                                                        let due_date = latest_classwork.date_format;
                                                                                                                        let due_time = latest_classwork.due_time;
        
                                                                                                                        let current_date = moment().format("YYYY-MM-DD");
                                                                                                                        let current_time = moment().format('h:mm a');
        
                                                                                                                        if (moment(current_date).isSame(due_date)){
                                                                                                                            condition = 1;
                                                                                                                        } else if (moment(current_date).isBefore(due_date)){
                                                                                                                            condition = 2;
                                                                                                                        } else {
                                                                                                                            condition = 3;
                                                                                                                        }
                    
                                                                                                                        if (condition === 1){
                                                                                                                            if (moment(current_time, 'h:mm a').isBefore(moment(due_time, 'h:mm a'))){
                                                                                                                                res.statusCode = 200;
                                                                                                                        
                                                                                                                                res.json({ status: 'posts_available', classwork_available: true, classwork_data: latest_classwork, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'no_token' });
                                                                                                                            } else {
                                                                                                                                res.statusCode = 200;
                                                                                                                                
                                                                                                                                res.json({ status: 'posts_available', classwork_available: false, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'no_token' });
                                                                                                                            }
                                                                                                                        } else if (condition === 2){
                                                                                                                            res.statusCode = 200;
                                                                                                                            
                                                                                                                            res.json({ status: 'posts_available', classwork_available: true, classwork_data: latest_classwork, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'no_token' });
                                                                                                                        } else if (condition === 3){
                                                                                                                            res.statusCode = 200;
                                                                                                                            
                                                                                                                            res.json({ status: 'posts_available', classwork_available: false, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'no_token' });
                                                                                                                        }
                                                                                                                    } else {
                                                                                                                        res.statusCode = 200;
                                                                                                                        
                                                                                                                        res.json({ status: 'posts_available', classwork_available: false, total_posts_length: class_posts_length, class_posts: formatted_class_posts, offset: offset + 4, token_info: 'no_token' });
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        } else if (result.data.length === 0){
                                                                                                            let all_class_posts = await db_query.fetch_all_posts_for_a_class(class_code);
        
                                                                                                            if (all_class_posts.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (all_class_posts.status === true){
                                                                                                                let class_posts_length = all_class_posts.data.length;
        
                                                                                                                let resultxc = await db_query.fetch_all_classworks_asc(class_code);
        
                                                                                                                if (resultxc.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (resultxc.status === true){
                                                                                                                    if (resultxc.data.length >= 1){
                                                                                                                        let all_classworks = resultxc.data;
                                                                                                                        let index_of_latest_classwork = all_classworks.length - 1;
                                                                                                                        let latest_classwork = all_classworks[index_of_latest_classwork];
                                                                                                                        let due_date = latest_classwork.date_format;
                                                                                                                        let due_time = latest_classwork.due_time;
        
                                                                                                                        let current_date = moment().format("YYYY-MM-DD");
                                                                                                                        let current_time = moment().format('h:mm a');
        
                                                                                                                        if (moment(current_date).isSame(due_date)){
                                                                                                                            condition = 1;
                                                                                                                        } else if (moment(current_date).isBefore(due_date)){
                                                                                                                            condition = 2;
                                                                                                                        } else {
                                                                                                                            condition = 3;
                                                                                                                        }
        
                                                                                                                        if (condition === 1){
                                                                                                                            if (moment(current_time, 'h:mm a').isBefore(moment(due_time, 'h:mm a'))){
                                                                                                                                res.statusCode = 200;
                                                                                                                                
                                                                                                                                res.json({ status: 'no_posts', classwork_available: true, classwork_data: latest_classwork, class_posts: [], token_info: 'no_token', total_posts_length: class_posts_length });
                                                                                                                            } else {
                                                                                                                                res.statusCode = 200;
                                                                                                                                
                                                                                                                                res.json({ status: 'no_posts', classwork_available: false, class_posts: [], token_info: 'no_token', total_posts_length: class_posts_length });
                                                                                                                            }
                                                                                                                        } else if (condition === 2){
                                                                                                                            res.statusCode = 200;
                                                                                                                            
                                                                                                                            res.json({ status: 'no_posts', classwork_available: true, classwork_data: latest_classwork, class_posts: [], token_info: 'no_token', total_posts_length: class_posts_length });
                                                                                                                        } else if (condition === 3){
                                                                                                                            res.statusCode = 200;
                                                                                                                            
                                                                                                                            res.json({ status: 'no_posts', classwork_available: false, class_posts: [], token_info: 'no_token', total_posts_length: class_posts_length });
                                                                                                                        }
                                                                                                                    } else {
                                                                                                                        res.statusCode = 200;
                                                                                                                        
                                                                                                                        res.json({ status: 'no_posts', classwork_available: false, class_posts: [], token_info: 'no_token', total_posts_length: class_posts_length });
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    }
                                                                                                } else if (result.data.length === 0){
                                                                                                    res.statusCode = 401;
                                                                                                    res.json({ status: 'not_teacher_of_class', token_info: 'no_token' });
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
                                                                            res.clearCookie('apex_auth'); // Clear apex auth cookie
                                                                            res.json({ status: 'user_not_found' });
                                                                        }
                                                                    }
                                                                } else {
                                                                    res.statusCode = 401;
                                                                    res.clearCookie('apex_auth'); // Clear apex auth cookie
                                                                    res.json({ status: 'invalid_token' });
                                                                }
                                                            }
                                                        });
                                                    } else {
                                                        res.statusCode = 401;
                                                        res.clearCookie('apex_auth'); // Clear apex auth cookie
                                                        res.json({ status: 'invalid_token' });
                                                    }
                                                }
                                            });
                                        } else {
                                            res.statusCode = 401;
                                            res.clearCookie('apex_auth'); // Clear apex auth cookie
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

module.exports = fetch_post;