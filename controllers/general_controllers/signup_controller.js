const bcrypt = require('bcrypt'); //Import bcrypt module
const mail_service = require('../../utility/mail_service.util'); //Import mail service
const db_query = require('../../models/db_model'); //Import db model
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token
const validate_email = require('../../utility/validate_email.util'); //Import validate email
const fs = require('fs'); //Import file system module

const signup = async (req, res) => {
    //Appropriate response headers
    res.setHeader('Access-Control-Allow-Origin', process.env.URL);
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    //Validate the request form body data
    if (req.body){
        let form_data = req.body; //Form data from the frontend

        //Check if the appropriate request parameters are set
        if (form_data.name && form_data.email && form_data.role && form_data.password){

            //Variables to hold form data individually and remove any quotes contained in them from left to right
            //and also remove leading and trailing whitespaces
            var user_name = sanitize_data(form_data.name);
            var user_email = sanitize_data(form_data.email);
            var user_role = sanitize_data(form_data.role);
            var user_password = sanitize_data(form_data.password);

            if (/^ *$/.test(user_name)){
                res.statusCode = 401;
                res.json({ status: 'missing_name' });
            } else {
                if (user_name.length > 30 || user_name.length === 0){
                    res.statusCode = 401;
                    res.json({ status: 'name_length_error' });
                } else {
                    if (/^ *$/.test(user_email)){
                        res.statusCode = 401;
                        res.json({ status: 'missing_email' });
                    } else {
                        if (user_email.length > 230 || user_email.length === 0 || validate_email(user_email) === false){
                            res.statusCode = 401;
                            res.json({ status: 'invalid_email' });
                        } else {
                            if (/^ *$/.test(user_role)){
                                res.statusCode = 401;
                                res.json({ status: 'missing_role' });
                            } else {
                                if (user_role === 'Student' || user_role === 'Teacher'){
                                    if (user_role.length > 7){
                                        res.statusCode = 401;
                                        res.json({ status: 'role_length_error' });
                                    } else {
                                        if (/^ *$/.test(user_password)){
                                            res.statusCode = 401;
                                            res.json({ status: 'missing_password' });
                                        } else {
                                            if (user_password.length > 10 || user_password.length < 10 || user_password.length === 0){
                                                res.statusCode = 401;
                                                res.json({ status: 'password_length_error' });
                                            } else {
                                                if (!!(user_password || '').match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*(_|[^\w])).+$/) === true){
                                                    let result = await db_query.check_email(user_email);

                                                    if (result.status === false){
                                                        res.statusCode = 500;
                                                        res.json({ status: 'error_occured' });
                                                    } else if (result.status === true){
                                                        if (result.data.length > 0){
                                                            res.statusCode = 401;
                                                            res.json({ status: 'email_already_taken' });
                                                        } else if (result.data.length === 0){
                                                            let result = await db_query.fetch_all_account_details();

                                                            if (result.status === false){
                                                                res.statusCode = 500;
                                                                res.json({ status: 'error_occured' });
                                                            } else if (result.status === true){
                                                                if (result.data.length > 0){
                                                                    let password_exist_count = 0;

                                                                    result.data.forEach(async data_value => {
                                                                        let hashed_password_from_db = data_value.password;
                                                                        let password_from_request = user_password;
                                                                        let compare_passwords = bcrypt.compareSync(password_from_request, hashed_password_from_db);

                                                                        if (compare_passwords === true){
                                                                            password_exist_count += 1;
                                                                        }
                                                                    });

                                                                    if (password_exist_count > 0){
                                                                        res.statusCode = 401;
                                                                        res.json({ status: 'password_already_taken' });
                                                                    } else if (password_exist_count === 0){
                                                                        let hashed_password = bcrypt.hashSync(user_password, 10);

                                                                        let result2 = await db_query.create_new_account(user_name, user_email, user_role, hashed_password);

                                                                        if (result2.status === false){
                                                                            res.statusCode = 500;
                                                                            res.json({ status: 'error_occured' });
                                                                        } else if (result2.status === true){
                                                                            let isCode_exist = '';
                                                                            let verify_code = '';
                                                                            let verify_code_mail = '';

                                                                            do {
                                                                                let verification_code = require('crypto').randomBytes(3).toString('hex');
                                                                                verify_code = verification_code.toUpperCase();
                                                                                verify_code_mail = verify_code;

                                                                                let result = await db_query.check_verify_code(verify_code);

                                                                                if (result.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (result.status === true){
                                                                                    if (result.data.length > 0){
                                                                                        isCode_exist = true;
                                                                                    } else if (result.data.length === 0){
                                                                                        isCode_exist = false;
                                                                                    }
                                                                                }
                                                                            } while(isCode_exist === true);

                                                                            let result2 = await db_query.check_email(user_email);

                                                                            if (result2.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (result2.status === true){
                                                                                let user_id = result2.data[0].id;

                                                                                let result = await db_query.insert_verify_code(user_id, verify_code);

                                                                                if (result.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (result.status === true){
                                                                                    mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Verify Your Account', `This is your verification code: ${ verify_code_mail }`, user_name, `Hello, This is your verification code: ${ verify_code_mail }`, null, null); //Send mail

                                                                                    let result = await db_query.check_email(user_email);

                                                                                    if (result.status === false){
                                                                                        res.statusCode = 500;
                                                                                        res.json({ status: 'error_occured' });
                                                                                    } else if (result.status === true){
                                                                                        fs.mkdirSync(`public/user_profiles/${user_id}`);
                                                                                        fs.mkdirSync(`public/user_profiles/${user_id}/profile_img`);

                                                                                        let user_row_id = result.data[0].id;
                                                                                        let user_role = result.data[0].role;

                                                                                        if (user_role === 'Student'){
                                                                                            let resultx = await db_query.create_new_settings_for_student(user_row_id, 'true');

                                                                                            if (resultx.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (resultx.status === true){
                                                                                                res.statusCode = 200;
                                                                                                let access_token = generate_access_token(user_row_id, 'verify_account_token');
                                                                                                res.json({ status: 'account_creation_successfull', verified_status: 'not_verified', user_name: user_name, user_email: user_email, accessToken: access_token });
                                                                                            }
                                                                                        } else if (user_role === 'Teacher'){
                                                                                            let resultx = await db_query.create_new_settings_for_teacher(user_row_id, 'true');

                                                                                            if (resultx.status === false){
                                                                                                res.statusCode = 500;
                                                                                                res.json({ status: 'error_occured' });
                                                                                            } else if (resultx.status === true){
                                                                                                res.statusCode = 200;
                                                                                                let access_token = generate_access_token(user_row_id, 'verify_account_token');
                                                                                                res.json({ status: 'account_creation_successfull', verified_status: 'not_verified', user_name: user_name, user_email: user_email, accessToken: access_token });
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                } else if (result.data.length === 0){
                                                                    let hashed_password = bcrypt.hashSync(user_password, 10);

                                                                    let result = await db_query.create_new_account(user_name, user_email, user_role, hashed_password);

                                                                    if (result.status === false){
                                                                        res.statusCode = 500;
                                                                        res.json({ status: 'error_occured' });
                                                                    } else if (result.status === true){
                                                                        let isCode_exist = '';
                                                                        let verify_code = '';
                                                                        let verify_code_mail = '';

                                                                        do {
                                                                            let verification_code = require('crypto').randomBytes(3).toString('hex');
                                                                            verify_code = verification_code.toUpperCase();
                                                                            verify_code_mail = verify_code;

                                                                            let result = await db_query.check_verify_code(verify_code);

                                                                            if (result.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (result.status === true){
                                                                                if (result.data.length > 0){
                                                                                    isCode_exist = true;
                                                                                } else if (result.data.length === 0){
                                                                                    isCode_exist = false;
                                                                                }
                                                                            }
                                                                        } while(isCode_exist === true);

                                                                        let result2 = await db_query.check_email(user_email);

                                                                        if (result2.status === false){
                                                                            res.statusCode = 500;
                                                                            res.json({ status: 'error_occured' });
                                                                        } else if (result2.status === true){
                                                                            let user_id = result2.data[0].id;

                                                                            let result = await db_query.insert_verify_code(user_id, verify_code);

                                                                            if (result.status === false){
                                                                                res.statusCode = 500;
                                                                                res.json({ status: 'error_occured' });
                                                                            } else if (result.status === true){
                                                                                mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Verify Your Account', `This is your verification code: ${ verify_code_mail }`, user_name, `Hello, This is your verification code: ${ verify_code_mail }`, null, null); //Send mail

                                                                                let result = await db_query.check_email(user_email);

                                                                                if (result.status === false){
                                                                                    res.statusCode = 500;
                                                                                    res.json({ status: 'error_occured' });
                                                                                } else if (result.status === true){
                                                                                    fs.mkdirSync(`public/user_profiles/${user_id}`);
                                                                                    fs.mkdirSync(`public/user_profiles/${user_id}/profile_img`);
                                                                                    
                                                                                    let user_row_id = result.data[0].id;
                                                                                    let user_role = result.data[0].role;

                                                                                    if (user_role === 'Student'){
                                                                                        let resultx = await db_query.create_new_settings_for_student(user_row_id, 'true');

                                                                                        if (resultx.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (resultx.status === true){
                                                                                            res.statusCode = 200;
                                                                                            let access_token = generate_access_token(user_row_id, 'verify_account_token');
                                                                                            res.json({ status: 'account_creation_successfull', verified_status: 'not_verified', user_name: user_name, user_email: user_email, accessToken: access_token });
                                                                                        }
                                                                                    } else if (user_role === 'Teacher'){
                                                                                        let resultx = await db_query.create_new_settings_for_teacher(user_row_id, 'true');

                                                                                        if (resultx.status === false){
                                                                                            res.statusCode = 500;
                                                                                            res.json({ status: 'error_occured' });
                                                                                        } else if (resultx.status === true){
                                                                                            res.statusCode = 200;
                                                                                            let access_token = generate_access_token(user_row_id, 'verify_account_token');
                                                                                            res.json({ status: 'account_creation_successfull', verified_status: 'not_verified', user_name: user_name, user_email: user_email, accessToken: access_token });
                                                                                        }
                                                                                    }
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
                                                    res.json({ status: 'invalid_password' });
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    res.statusCode = 401;
                                    res.json({ status: 'unspecified_role' });
                                }
                            }
                        }
                    }
                }
            }
        } else {
            res.statusCode = 401;
            res.json({ status: 'invalid_credentials' });
        }
    } else {
        res.statusCode = 401;
        res.json({ status: 'error_occured' });
    }
}

module.exports = signup;