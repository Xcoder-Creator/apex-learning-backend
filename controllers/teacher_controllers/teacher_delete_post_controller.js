const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db_query
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header

const delete_post = async (req, res) => {
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
            if (form_data.access_token && form_data.class_code && form_data.post_id && form_data.user_id){

                //Filter and sanitize the request parameters
                let access_token = sanitize_data(form_data.access_token);
                let class_code = sanitize_data(form_data.class_code);
                let post_id = parseInt(form_data.post_id, 10);
                let user_id_from_req = parseInt(form_data.user_id, 10);

                //Check if the request parameters are empty or only contains white spaces
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
                            if (/^ *$/.test(user_id_from_req)){
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
                                                                                            //Perform main operation
                                                                                            if (user_id_from_req === user_id){
                                                                                                let result = await db_query.fetch_particular_post(post_id);

                                                                                                if (result.status === false){
                                                                                                    res.statusCode = 500;
                                                                                                    res.json({ status: 'error_occured' });
                                                                                                } else if (result.status === true){
                                                                                                    if (result.data.length > 0 && result.data.length === 1){
                                                                                                        let result = await db_query.delete_particular_post_teacher(post_id);

                                                                                                        if (result.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result.status === true){
                                                                                                            let result = await db_query.delete_attached_files(post_id);

                                                                                                            if (result.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result.status === true){
                                                                                                                let resultx = await db_query.delete_comments(post_id);

                                                                                                                if (resultx.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (resultx.status === true){
                                                                                                                    res.statusCode = 200;
                                                                                                                    let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                    res.json({ status: 'post_deleted', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                }
                                                                                                            }
                                                                                                        }
                                                                                                    } else {
                                                                                                        //Post does not exist
                                                                                                        res.statusCode = 404;
                                                                                                        res.json({ status: 'post_does_not_exist' });
                                                                                                    }
                                                                                                }
                                                                                            } else {
                                                                                                //User ID mismatch
                                                                                                res.statusCode = 401;
                                                                                                res.json({ status: 'user_id_mismatch' });
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
                                                                                                if (result.data.length > 0){
                                                                                                    //Perform main operation
                                                                                                    if (user_id_from_req === user_id){
                                                                                                        let result = await db_query.fetch_particular_post(post_id);

                                                                                                        if (result.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (result.status === true){
                                                                                                            if (result.data.length > 0 && result.data.length === 1){
                                                                                                                let result = await db_query.delete_particular_post_teacher(post_id);

                                                                                                                if (result.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result.status === true){
                                                                                                                    ////console..log(post_id, user_id);
                                                                                                                    let result = await db_query.delete_attached_files(post_id);

                                                                                                                    if (result.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result.status === true){
                                                                                                                        let resultx = await db_query.delete_comments(post_id);

                                                                                                                        if (resultx.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (resultx.status === true){
                                                                                                                            res.statusCode = 200;
                                                                                                                            res.json({ status: 'post_deleted', token_info: 'no_token' });
                                                                                                                        }
                                                                                                                    }    
                                                                                                                }
                                                                                                            } else {
                                                                                                                //Post does not exist
                                                                                                                res.statusCode = 404;
                                                                                                                res.json({ status: 'post_does_not_exist' });
                                                                                                            }
                                                                                                        }
                                                                                                    } else {
                                                                                                        //User ID mismatch
                                                                                                        res.statusCode = 401;
                                                                                                        res.json({ status: 'user_id_mismatch' });
                                                                                                    }
                                                                                                } else if (result.data.length === 0){
                                                                                                    res.statusCode = 401;
                                                                                                    res.json({ status: 'not_part_of_class' });
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
            if (form_data.class_code && form_data.post_id && form_data.user_id){
                //Filter and sanitize the request parameters
                let class_code = sanitize_data(form_data.class_code);
                let post_id = parseInt(form_data.post_id, 10);
                let user_id_from_req = parseInt(form_data.user_id, 10);

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
                                if (/^ *$/.test(post_id)){
                                    res.statusCode = 401;
                                    res.json({ status: 'missing_credentials' });
                                } else {
                                    if (/^ *$/.test(user_id_from_req)){
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
                                                                                                //Perform main operation
                                                                                                if (user_id_from_req === user_id){
                                                                                                    let result = await db_query.fetch_particular_post(post_id);

                                                                                                    if (result.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (result.status === true){
                                                                                                        if (result.data.length > 0 && result.data.length === 1){
                                                                                                            let result = await db_query.delete_particular_post_teacher(post_id);

                                                                                                            if (result.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result.status === true){
                                                                                                                let result = await db_query.delete_attached_files(post_id);

                                                                                                                if (result.status === false){
                                                                                                                    res.statusCode = 500;
                                                                                                                    res.json({ status: 'error_occured' });
                                                                                                                } else if (result.status === true){
                                                                                                                    let resultx = await db_query.delete_comments(post_id);

                                                                                                                    if (resultx.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (resultx.status === true){
                                                                                                                        res.statusCode = 200;
                                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                                        res.json({ status: 'post_deleted', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                                    }
                                                                                                                }
                                                                                                            }
                                                                                                        } else {
                                                                                                            //Post does not exist
                                                                                                            res.statusCode = 404;
                                                                                                            res.json({ status: 'post_does_not_exist' });
                                                                                                        }
                                                                                                    }
                                                                                                } else {
                                                                                                    //User ID mismatch
                                                                                                    res.statusCode = 401;
                                                                                                    res.json({ status: 'user_id_mismatch' });
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
                                                                                                    if (result.data.length > 0){
                                                                                                        //Perform main operation
                                                                                                        if (user_id_from_req === user_id){
                                                                                                            let result = await db_query.fetch_particular_post(post_id);

                                                                                                            if (result.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (result.status === true){
                                                                                                                if (result.data.length > 0 && result.data.length === 1){
                                                                                                                    let result = await db_query.delete_particular_post_teacher(post_id);

                                                                                                                    if (result.status === false){
                                                                                                                        res.statusCode = 500;
                                                                                                                        res.json({ status: 'error_occured' });
                                                                                                                    } else if (result.status === true){
                                                                                                                        let result = await db_query.delete_attached_files(post_id);

                                                                                                                        if (result.status === false){
                                                                                                                            res.statusCode = 500;
                                                                                                                            res.json({ status: 'error_occured' });
                                                                                                                        } else if (result.status === true){
                                                                                                                            let resultx = await db_query.delete_comments(post_id);

                                                                                                                            if (resultx.status === false){
                                                                                                                                res.statusCode = 500;
                                                                                                                                res.json({ status: 'error_occured' });
                                                                                                                            } else if (resultx.status === true){
                                                                                                                                res.statusCode = 200;
                                                                                                                                res.json({ status: 'post_deleted', token_info: 'no_token' });
                                                                                                                            }
                                                                                                                        }
                                                                                                                    }
                                                                                                                } else {
                                                                                                                    //Post does not exist
                                                                                                                    res.statusCode = 404;
                                                                                                                    res.json({ status: 'post_does_not_exist' });
                                                                                                                }
                                                                                                            }
                                                                                                        } else {
                                                                                                            //User ID mismatch
                                                                                                            res.statusCode = 401;
                                                                                                            res.json({ status: 'user_id_mismatch' });
                                                                                                        }
                                                                                                    } else if (result.data.length === 0){
                                                                                                        res.statusCode = 401;
                                                                                                        res.json({ status: 'not_part_of_class' });
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

module.exports = delete_post;