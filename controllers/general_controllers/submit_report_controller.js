const jwt = require('jsonwebtoken'); //Import jsonwebtoken module
const db_query = require('../../models/db_model'); //Import db_query
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_auth_header = require('../../utility/validate_auth_header.util'); //Import validate authorization header
const list_months = require('../../utility/months_list.util'); //Import months list
const format_date = require('../../utility/format_date.util'); //Import format date
const format_time = require('../../utility/format_time.util'); //Import format time

const submit_report = async (req, res) => {
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
            if (form_data.access_token && form_data.report_type && form_data.report_option && form_data.class_code && form_data.post_id){
                //Filter and sanitize the request parameters
                let access_token = sanitize_data(form_data.access_token);
                let report_type = sanitize_data(form_data.report_type);
                let report_option = parseInt(form_data.report_option);
                let class_code = sanitize_data(form_data.class_code);
                let post_id = form_data.post_id;

                //Validate the request parameters
                if (/^ *$/.test(access_token)){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    if (/^ *$/.test(report_type)){
                        res.statusCode = 401;
                        res.json({ status: 'missing_credentials' });
                    } else {
                        if (/^ *$/.test(report_option)){
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
                                                                            var months = list_months;
                                                                            var date = new Date();
                                                                            var formated_date = format_date(months, date);
                                                                            var formated_time = format_time(new Date);

                                                                            let resultx = await db_query.fetch_all_active_class_details(class_code);

                                                                            if (resultx.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (resultx.status === true){
                                                                                if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                    let resultz = await db_query.fetch_a_particular_post(post_id);

                                                                                    if (resultz.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (resultz.status === true){
                                                                                        if (resultz.data.length === 1){
                                                                                            if ([1, 2, 3, 4, 5].includes(report_option)){
                                                                                                if (['class', 'post'].includes(report_type)){
                                                                                                    let resultx = await db_query.create_report(user_id, report_option, 'post', formated_date, formated_time, post_id, class_code);

                                                                                                    if (resultx.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (resultx.status === true){
                                                                                                        res.statusCode = 200;
                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                        res.json({ status: 'report_created', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                    }
                                                                                                } else {
                                                                                                    res.statusCode = 401;
                                                                                                    res.json({ status: 'invalid_report_type' });
                                                                                                }
                                                                                            } else {
                                                                                                res.statusCode = 401;
                                                                                                res.json({ status: 'invalid_report_option' });
                                                                                            }
                                                                                        } else {
                                                                                            if ([1, 2, 3, 4, 5].includes(report_option)){
                                                                                                if (['class', 'post'].includes(report_type)){
                                                                                                    let resultx = await db_query.create_report(user_id, report_option, 'class', formated_date, formated_time, null, class_code);

                                                                                                    if (resultx.status === false){
                                                                                                        res.statusCode = 500;
                                                                                                        res.json({ status: 'error_occured' });
                                                                                                    } else if (resultx.status === true){
                                                                                                        res.statusCode = 200;
                                                                                                        let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                        res.json({ status: 'report_created', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                    }
                                                                                                } else {
                                                                                                    res.statusCode = 401;
                                                                                                    res.json({ status: 'invalid_report_type' });
                                                                                                }
                                                                                            } else {
                                                                                                res.statusCode = 401;
                                                                                                res.json({ status: 'invalid_report_option' });
                                                                                            }
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
                                                                                var months = list_months;
                                                                                var date = new Date();
                                                                                var formated_date = format_date(months, date);
                                                                                var formated_time = format_time(new Date);

                                                                                let resultx = await db_query.fetch_all_active_class_details(class_code);

                                                                                if (resultx.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured5' });
                                                                                } else if (resultx.status === true){
                                                                                    if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                        let resultz = await db_query.fetch_a_particular_post(post_id);

                                                                                        if (resultz.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (resultz.status === true){
                                                                                            if (resultz.data.length === 1){
                                                                                                if ([1, 2, 3, 4, 5].includes(report_option)){
                                                                                                    if (['class', 'post'].includes(report_type)){
                                                                                                        let resultx = await db_query.create_report(user_auth_id, report_option, 'post', formated_date, formated_time, post_id, class_code);

                                                                                                        if (resultx.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (resultx.status === true){
                                                                                                            res.statusCode = 200;
                                                                                                            res.json({ status: 'report_created', token_info: 'no_token' });
                                                                                                        }
                                                                                                    } else {
                                                                                                        res.statusCode = 401;
                                                                                                        res.json({ status: 'invalid_report_type' });
                                                                                                    }
                                                                                                } else {
                                                                                                    res.statusCode = 401;
                                                                                                    res.json({ status: 'invalid_report_option' });
                                                                                                }
                                                                                            } else {
                                                                                                if ([1, 2, 3, 4, 5].includes(report_option)){
                                                                                                    if (['class', 'post'].includes(report_type)){
                                                                                                        let resultx = await db_query.create_report(user_auth_id, report_option, 'class', formated_date, formated_time, null, class_code);

                                                                                                        if (resultx.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (resultx.status === true){
                                                                                                            res.statusCode = 200;
                                                                                                            res.json({ status: 'report_created', token_info: 'no_token' });
                                                                                                        }
                                                                                                    } else {
                                                                                                        res.statusCode = 401;
                                                                                                        res.json({ status: 'invalid_report_type' });
                                                                                                    }
                                                                                                } else {
                                                                                                    res.statusCode = 401;
                                                                                                    res.json({ status: 'invalid_report_option' });
                                                                                                }
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
            if (form_data.report_type && form_data.report_option && form_data.class_code && form_data.post_id){
                //Filter and sanitize the request parameters
                let report_type = sanitize_data(form_data.report_type);
                let report_option = parseInt(form_data.report_option);
                let class_code = sanitize_data(form_data.class_code);
                let post_id = sanitize_data(form_data.post_id);

                if (/^ *$/.test(report_type)){
                    res.statusCode = 401;
                    res.json({ status: 'missing_credentials' });
                } else {
                    if (/^ *$/.test(report_option)){
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
                                                                                var months = list_months;
                                                                                var date = new Date();
                                                                                var formated_date = format_date(months, date);
                                                                                var formated_time = format_time(new Date);

                                                                                let resultx = await db_query.fetch_all_active_class_details(class_code);

                                                                                if (resultx.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (resultx.status === true){
                                                                                    if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                        let resultz = await db_query.fetch_a_particular_post(post_id);

                                                                                        if (resultz.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (resultz.status === true){
                                                                                            if (resultz.data.length === 1){
                                                                                                if ([1, 2, 3, 4, 5].includes(report_option)){
                                                                                                    if (['class', 'post'].includes(report_type)){
                                                                                                        let resultx = await db_query.create_report(user_id, report_option, 'post', formated_date, formated_time, post_id, class_code);

                                                                                                        if (resultx.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (resultx.status === true){
                                                                                                            res.statusCode = 200;
                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                            res.json({ status: 'report_created', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                        }
                                                                                                    } else {
                                                                                                        res.statusCode = 401;
                                                                                                        res.json({ status: 'invalid_report_type' });
                                                                                                    }
                                                                                                } else {
                                                                                                    res.statusCode = 401;
                                                                                                    res.json({ status: 'invalid_report_option' });
                                                                                                }
                                                                                            } else {
                                                                                                if ([1, 2, 3, 4, 5].includes(report_option)){
                                                                                                    if (['class', 'post'].includes(report_type)){
                                                                                                        let resultx = await db_query.create_report(user_id, report_option, 'class', formated_date, formated_time, null, class_code);

                                                                                                        if (resultx.status === false){
                                                                                                            res.statusCode = 500;
                                                                                                            res.json({ status: 'error_occured' });
                                                                                                        } else if (resultx.status === true){
                                                                                                            res.statusCode = 200;
                                                                                                            let new_access_token = generate_access_token(user_id, 'user_direct_access_token');
                                                                                                            res.json({ status: 'report_created', token_info: 'token_available', new_accessToken: new_access_token });
                                                                                                        }
                                                                                                    } else {
                                                                                                        res.statusCode = 401;
                                                                                                        res.json({ status: 'invalid_report_type' });
                                                                                                    }
                                                                                                } else {
                                                                                                    res.statusCode = 401;
                                                                                                    res.json({ status: 'invalid_report_option' });
                                                                                                }
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
                                                                                    var months = list_months;
                                                                                    var date = new Date();
                                                                                    var formated_date = format_date(months, date);
                                                                                    var formated_time = format_time(new Date);

                                                                                    let resultx = await db_query.fetch_all_active_class_details(class_code);

                                                                                    if (resultx.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (resultx.status === true){
                                                                                        if (resultx.data.length > 0 && resultx.data.length === 1){
                                                                                            let resultz = await db_query.fetch_a_particular_post(post_id);

                                                                                            if (resultz.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (resultz.status === true){
                                                                                                if (resultz.data.length === 1){
                                                                                                    if ([1, 2, 3, 4, 5].includes(report_option)){
                                                                                                        if (['class', 'post'].includes(report_type)){
                                                                                                            let resultx = await db_query.create_report(user_auth_id, report_option, 'post', formated_date, formated_time, post_id, class_code);

                                                                                                            if (resultx.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (resultx.status === true){
                                                                                                                res.statusCode = 200;
                                                                                                                res.json({ status: 'report_created', token_info: 'no_token' });
                                                                                                            }
                                                                                                        } else {
                                                                                                            res.statusCode = 401;
                                                                                                            res.json({ status: 'invalid_report_type' });
                                                                                                        }
                                                                                                    } else {
                                                                                                        res.statusCode = 401;
                                                                                                        res.json({ status: 'invalid_report_option' });
                                                                                                    }
                                                                                                } else {
                                                                                                    if ([1, 2, 3, 4, 5].includes(report_option)){
                                                                                                        if (['class', 'post'].includes(report_type)){
                                                                                                            let resultx = await db_query.create_report(user_auth_id, report_option, 'class', formated_date, formated_time, null, class_code);

                                                                                                            if (resultx.status === false){
                                                                                                                res.statusCode = 500;
                                                                                                                res.json({ status: 'error_occured' });
                                                                                                            } else if (resultx.status === true){
                                                                                                                res.statusCode = 200;
                                                                                                                res.json({ status: 'report_created', token_info: 'no_token' });
                                                                                                            }
                                                                                                        } else {
                                                                                                            res.statusCode = 401;
                                                                                                            res.json({ status: 'invalid_report_type' });
                                                                                                        }
                                                                                                    } else {
                                                                                                        ////console..log(typeof(report_option));
                                                                                                        ////console..log([1, 2, 3, 4, 5].includes(report_option))
                                                                                                        res.statusCode = 401;
                                                                                                        res.json({ status: 'invalid_report_option' });
                                                                                                    }
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

module.exports = submit_report;