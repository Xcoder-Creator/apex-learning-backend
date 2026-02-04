const mail_service = require('../../utility/mail_service.util'); //Import mail service
const db_query = require('../../models/db_model'); //Import db model
const sanitize_data = require('../../utility/sanitize_data.util'); //Import sanitize data
const generate_access_token = require('../../utility/generate_access_token.util'); //Import generate access token

const send_reset_code = async (req, res) => {
    //Appropriate response headers
    res.setHeader('Access-Control-Allow-Origin', process.env.URL);
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader("Access-Control-Allow-Headers", 'Origin, X-Requested-With, Content-Type, Authorization, Accept');

    //Validate the request form body data
    if (req.body){
        let form_data = req.body; //Form data from the frontend

        //Check if the appropriate request parameters are set
        if (form_data.email){
            let email = sanitize_data(form_data.email); //Filter and sanitize email

            if (/^ *$/.test(email)){
                res.statusCode = 401;
                res.json({ status: 'invalid_credentials' });
            } else {
                let result = await db_query.check_email(email);

                if (result.status === false){
                    res.statusCode = 500;
                    res.json({ status: 'error_occured' });
                } else if (result.status === true){
                    if (result.data.length > 0 && result.data.length === 1){
                        let user_id = result.data[0].id;
                        let user_name = result.data[0].name;

                        let result2 = await db_query.check_if_account_exists(user_id);

                        if (result2.status === false){
                            res.statusCode = 500;
                            res.json({ status: 'error_occured' });
                        } else if (result2.status === true){
                            if (result2.data.length > 0 && result2.data.length === 1){
                                if (result2.data[0].verification_status === 'verified'){
                                    let user_id = result2.data[0].id;
                                    let user_email = result2.data[0].email;

                                    let result = await db_query.delete_reset_code(user_id);

                                    if (result.status === false){
                                        res.statusCode = 500;
                                        res.json({ status: 'error_occured' });
                                    } else if (result.status === true){
                                        let isCode_exist = '';
                                        let reset_code = '';

                                        do {
                                            let code_to_reset_password = require('crypto').randomBytes(3).toString('hex');
                                            reset_code = code_to_reset_password.toUpperCase();

                                            let result2 = await db_query.check_reset_code(reset_code);

                                            if (result2.status === false){
                                                res.statusCode = 500;
                                                res.json({ status: 'error_occured' });
                                            } else if (result2.status === true){
                                                if (result2.data.length > 0){
                                                    isCode_exist = true;
                                                } else {
                                                    isCode_exist = false;
                                                }
                                            }
                                        } while(isCode_exist === true);

                                        let result = await db_query.insert_reset_code(user_id, reset_code);

                                        if (result.status === false){
                                            res.statusCode = 500;
                                            res.json({ status: 'error_occured' });
                                        } else if (result.status === true){
                                            mail_service('plain_mail', user_email, false, false, false, null, null, null, null, null, null, null, null, null, null, 'Reset Your Password', `This is your reset code: ${ reset_code }`, user_name, `This is your reset code: ${ reset_code }`, null, null); //Send mail

                                            let access_token = generate_access_token(user_id, 'reset_password_token');

                                            res.statusCode = 200;
                                            res.json({ status: true, accessToken: access_token });
                                        }
                                    }
                                } else if (result2.data[0].verification_status === 'not_verified'){
                                    res.statusCode = 401;
                                    res.json({ status: 'account_not_verified' });
                                }
                            } else {
                                res.statusCode = 404;
                                res.json({ status: 'email_not_found' });
                            }
                        }
                    } else {
                        res.statusCode = 404;
                        res.json({ status: 'email_not_found' });
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

module.exports = send_reset_code;